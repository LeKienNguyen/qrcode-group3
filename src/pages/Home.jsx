import { useEffect, useMemo, useRef, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import TabSelector from '../components/TabSelector.jsx'
import QRPreview from '../components/QRPreview.jsx'
import CustomizationPanel from '../components/CustomizationPanel.jsx'
import QRHistory from '../components/QRHistory.jsx'
import UrlForm from '../components/forms/UrlForm.jsx'
import WifiForm from '../components/forms/WifiForm.jsx'
import EmailForm from '../components/forms/EmailForm.jsx'
import { buildEmailValue, buildUrlValue, buildWifiValue } from '../lib/qrString.js'
import { validateEmail, validateUrl, validateWifi } from '../lib/validation.js'
import { CONTENT_SAFETY_MESSAGES } from '../lib/moderation.js'
import { readFileAsDataUrl } from '../lib/file.js'
import { checkContentSafety } from '../lib/gemini.js'
import { saveQR, logBlockedAttempt } from '../firebase.js'

const INITIAL_FORM_DATA = {
  url: { url: '' },
  wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
  email: { email: '', subject: '', body: '' },
}

const DEFAULT_CUSTOMIZATION = { fgColor: '#1e293b', bgColor: '#ffffff', logo: null }

const MAX_LOGO_SIZE = 2 * 1024 * 1024

const AI_CHECK_DELAY = 800

const IDLE_AI_STATE = { status: 'idle', reason: '' }

const QR_BUILDERS = {
  url: { validate: validateUrl, build: buildUrlValue },
  wifi: { validate: validateWifi, build: buildWifiValue },
  email: { validate: validateEmail, build: buildEmailValue },
}

function Home() {
  const [activeTab, setActiveTab] = useState('url')
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [interactedTabs, setInteractedTabs] = useState({})
  const [customization, setCustomization] = useState(DEFAULT_CUSTOMIZATION)
  const [logoError, setLogoError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [historyRefresh, setHistoryRefresh] = useState(0)

  const values = formData[activeTab]
  const { validate, build } = QR_BUILDERS[activeTab]

  const errors = useMemo(() => validate(values), [validate, values])
  const visibleErrors = interactedTabs[activeTab] ? errors : {}

  const candidateValue = useMemo(() => {
    return Object.keys(errors).length === 0 ? build(values) : ''
  }, [build, errors, values])

  const [aiState, setAiState] = useState(IDLE_AI_STATE)
  const aiCacheRef = useRef(new Map())

  useEffect(() => {
    if (!candidateValue) {
      setAiState(IDLE_AI_STATE)
      return
    }

    const cached = aiCacheRef.current.get(candidateValue)
    if (cached) {
      setAiState(cached)
      return
    }

    setAiState({ status: 'checking', reason: '' })
    let cancelled = false

    const timer = setTimeout(async () => {
      const result = await checkContentSafety(candidateValue)
      if (cancelled) return

      let next
      if (result.skipped) {
        next = { status: 'unavailable', reason: '' }
      } else if (result.safe) {
        next = { status: 'safe', reason: '' }
      } else {
        next = { status: 'unsafe', reason: result.reason || 'This content was flagged as unsafe.' }
        logBlockedAttempt({ type: activeTab, content: candidateValue, reason: next.reason, source: 'ai' }).catch(() => {})
      }

      aiCacheRef.current.set(candidateValue, next)
      setAiState(next)
    }, AI_CHECK_DELAY)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [activeTab, candidateValue])

  const qrValue = aiState.status === 'unsafe' ? '' : candidateValue

  const moderationLogCacheRef = useRef(new Set())

  useEffect(() => {
    const rawValue = build(values)
    if (!rawValue) return

    const blockedMessage = Object.values(errors).find((message) => CONTENT_SAFETY_MESSAGES.has(message))
    if (!blockedMessage) return

    const key = `${activeTab}:${rawValue}:${blockedMessage}`
    if (moderationLogCacheRef.current.has(key)) return

    const timer = setTimeout(() => {
      moderationLogCacheRef.current.add(key)
      logBlockedAttempt({ type: activeTab, content: rawValue, reason: blockedMessage, source: 'moderation' }).catch(() => {})
    }, AI_CHECK_DELAY)

    return () => clearTimeout(timer)
  }, [activeTab, values, errors, build])

  const hasCustomization =
    customization.fgColor !== DEFAULT_CUSTOMIZATION.fgColor ||
    customization.bgColor !== DEFAULT_CUSTOMIZATION.bgColor ||
    customization.logo !== null

  const handleChange = (patch) => {
    setFormData((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], ...patch },
    }))
    setInteractedTabs((prev) => ({ ...prev, [activeTab]: true }))
  }

  const handleCustomizationChange = (patch) => {
    setCustomization((prev) => ({ ...prev, ...patch }))
  }

  const handleLogoUpload = async (file) => {
    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose an image file.')
      return
    }

    if (file.size > MAX_LOGO_SIZE) {
      setLogoError('Logo must be smaller than 2 MB.')
      return
    }

    setLogoError('')
    const dataUrl = await readFileAsDataUrl(file)
    handleCustomizationChange({ logo: dataUrl })
  }

  const handleLogoRemove = () => {
    setLogoError('')
    handleCustomizationChange({ logo: null })
  }

  const handleCustomizationReset = () => {
    setCustomization(DEFAULT_CUSTOMIZATION)
    setLogoError('')
  }

  const handlePrepareDownload = async (content) => {
    try {
      const id = await saveQR({ type: activeTab, content })
      setSaveError('')
      setHistoryRefresh((value) => value + 1)

      if (activeTab === 'url') {
        return `${window.location.origin}/s/${id}`
      }

      return content
    } catch (err) {
      setSaveError(`Couldn't save this QR code to your history: ${err.message}`)
      return content
    }
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="main">
        <div className="card">
          <TabSelector active={activeTab} onChange={setActiveTab} />
          <div className="card-body">
            <div className="form-panel">
              {activeTab === 'url' && (
                <UrlForm values={values} errors={visibleErrors} onChange={handleChange} />
              )}
              {activeTab === 'wifi' && (
                <WifiForm values={values} errors={visibleErrors} onChange={handleChange} />
              )}
              {activeTab === 'email' && (
                <EmailForm values={values} errors={visibleErrors} onChange={handleChange} />
              )}
            </div>
            <div className="preview-panel">
              <QRPreview
                value={qrValue}
                fileName={`qr-${activeTab}`}
                fgColor={customization.fgColor}
                bgColor={customization.bgColor}
                logo={customization.logo}
                aiStatus={aiState}
                onPrepareDownload={handlePrepareDownload}
              />
            </div>
          </div>
          <div className="customize-section">
            <CustomizationPanel
              customization={customization}
              logoError={logoError}
              hasCustomization={hasCustomization}
              onChange={handleCustomizationChange}
              onLogoUpload={handleLogoUpload}
              onLogoRemove={handleLogoRemove}
              onReset={handleCustomizationReset}
            />
          </div>
          <div className="history-wrapper">
            {saveError && <p className="field-error">{saveError}</p>}
            <QRHistory refreshSignal={historyRefresh} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Home
