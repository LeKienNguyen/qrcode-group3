import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getQR, recordScan } from '../firebase.js'
import { getDeviceType } from '../lib/device.js'

function ScanRedirect() {
  const { id } = useParams()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false

    getQR(id)
      .then((record) => {
        if (cancelled) return

        if (!record || !record.content) {
          setStatus('not-found')
          return
        }

        recordScan(id, getDeviceType()).catch(() => {})
        window.location.replace(record.content)
      })
      .catch(() => {
        if (!cancelled) setStatus('not-found')
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="app-shell">
      <main className="main">
        <div className="card">
          {status === 'loading' && <p className="history-empty">Redirecting...</p>}
          {status === 'not-found' && (
            <p className="history-empty history-empty--error">This QR code could not be found.</p>
          )}
        </div>
      </main>
    </div>
  )
}

export default ScanRedirect
