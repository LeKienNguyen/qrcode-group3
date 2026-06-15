import { useEffect, useRef, useState } from 'react'
import Button from './ui/Button.jsx'
import { DownloadIcon } from './icons/Icons.jsx'
import { renderQrToCanvas } from '../lib/qrCanvas.js'

const PREVIEW_SIZE = 240
const DOWNLOAD_SIZE = 400

const DEFAULT_AI_STATUS = { status: 'idle', reason: '' }

function QRPreview({ value, fileName, fgColor, bgColor, logo, aiStatus = DEFAULT_AI_STATUS, onPrepareDownload }) {
  const canvasRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!value) {
      const context = canvas.getContext('2d')
      context.clearRect(0, 0, canvas.width, canvas.height)
      setError('')
      return
    }

    renderQrToCanvas(canvas, value, { size: PREVIEW_SIZE, fgColor, bgColor, logo })
      .then(() => setError(''))
      .catch((err) => setError(err.message))
  }, [value, fgColor, bgColor, logo])

  const handleDownload = async () => {
    if (!value) return

    const downloadValue = onPrepareDownload ? await onPrepareDownload(value) : value

    const canvas = document.createElement('canvas')
    await renderQrToCanvas(canvas, downloadValue, { size: DOWNLOAD_SIZE, fgColor, bgColor, logo })

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${fileName}.png`
    link.click()
  }

  const isChecking = aiStatus.status === 'checking'
  const isBlocked = aiStatus.status === 'unsafe'

  return (
    <div className="preview">
      <div className="preview-canvas-wrap">
        <canvas ref={canvasRef} width={PREVIEW_SIZE} height={PREVIEW_SIZE} className="preview-canvas" />
        {!value && isBlocked && (
          <p className="preview-placeholder preview-placeholder--blocked">
            {aiStatus.reason || 'This content was flagged as unsafe by our AI safety check.'}
          </p>
        )}
        {!value && !isBlocked && (
          <p className="preview-placeholder">Fill in the form to generate your QR code</p>
        )}
      </div>

      {error && <p className="field-error">{error}</p>}

      {value && isChecking && <p className="ai-note">Running AI safety check...</p>}
      {value && aiStatus.status === 'unavailable' && (
        <p className="ai-note">AI safety check unavailable — proceeding with local checks only.</p>
      )}

      <Button onClick={handleDownload} disabled={!value || isChecking} className="preview-download">
        <DownloadIcon />
        {isChecking ? 'Checking content safety...' : 'Download PNG (400 x 400)'}
      </Button>
    </div>
  )
}

export default QRPreview
