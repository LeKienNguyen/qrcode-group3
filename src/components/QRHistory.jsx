import { useEffect, useState } from 'react'
import { getQRs, deleteQR } from '../firebase.js'
import { LinkIcon, MailIcon, PhoneIcon, TextIcon, TrashIcon, WifiIcon } from './icons/Icons.jsx'
import Button from './ui/Button.jsx'
import { withTimeout } from '../lib/async.js'

const TYPE_ICONS = { url: LinkIcon, wifi: WifiIcon, email: MailIcon, text: TextIcon, phone: PhoneIcon }
const TYPE_LABELS = { url: 'URL', wifi: 'Wi-Fi', email: 'Email', text: 'Text', phone: 'Phone' }
const LOAD_TIMEOUT_MS = 10000

function formatDate(value) {
  if (!value) return 'Just now'
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'
  return date.toLocaleString()
}

function QRHistory({ refreshSignal }) {
  const [records, setRecords] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    withTimeout(getQRs(), LOAD_TIMEOUT_MS, 'History is unavailable right now.')
      .then((data) => {
        if (cancelled) return
        setRecords(data)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [refreshSignal])

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteQR(id)
      setRecords((prev) => prev.filter((record) => record.id !== id))
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="history-section">
      <h2 className="history-title">Saved QR codes</h2>

      {status === 'loading' && <p className="history-empty">Loading saved QR codes...</p>}

      {status === 'error' && <p className="history-empty">{error}</p>}

      {status === 'ready' && records.length === 0 && (
        <p className="history-empty">No QR codes saved yet. Download one to save it here.</p>
      )}

      {status === 'ready' && records.length > 0 && (
        <ul className="history-list">
          {records.map((record) => {
            const Icon = TYPE_ICONS[record.type] || LinkIcon
            return (
              <li key={record.id} className="history-item">
                <span className="history-icon">
                  <Icon />
                </span>
                <div className="history-details">
                  <p className="history-content">{record.content}</p>
                  <p className="history-meta">
                    {TYPE_LABELS[record.type] || record.type} · {formatDate(record.createdAt)} ·{' '}
                    {record.status} · {record.scans ?? 0} scans
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="history-delete"
                  onClick={() => handleDelete(record.id)}
                  disabled={deletingId === record.id}
                  aria-label="Delete saved QR code"
                >
                  <TrashIcon />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default QRHistory
