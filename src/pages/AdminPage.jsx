import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import Button from '../components/ui/Button.jsx'
import { DownloadIcon } from '../components/icons/Icons.jsx'
import { getQRs, getBlockedAttempts, getScans } from '../firebase.js'
import { exportQrReport } from '../lib/csv.js'
import { withTimeout } from '../lib/async.js'

const DAYS_SHOWN = 7
const LOAD_TIMEOUT_MS = 10000

const TYPE_LABELS = { url: 'URL', wifi: 'Wi-Fi', email: 'Email', text: 'Text', phone: 'Phone' }
const TYPE_COLORS = { url: '#1d4ed8', wifi: '#0ea5e9', email: '#f59e0b', text: '#10b981', phone: '#a855f7' }

function toDate(value) {
  if (!value) return null
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function dateKey(date) {
  return date.toISOString().slice(0, 10)
}

function buildDailyCounts(records) {
  const counts = new Map()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = DAYS_SHOWN - 1; i >= 0; i -= 1) {
    const day = new Date(today)
    day.setDate(day.getDate() - i)
    counts.set(dateKey(day), { date: day, count: 0 })
  }

  records.forEach((record) => {
    const created = toDate(record.createdAt)
    if (!created) return

    const day = new Date(created)
    day.setHours(0, 0, 0, 0)
    const key = dateKey(day)

    if (counts.has(key)) {
      counts.get(key).count += 1
    }
  })

  return Array.from(counts.values()).map(({ date, count }) => ({
    label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count,
  }))
}

function buildTypeDistribution(records) {
  const counts = { url: 0, wifi: 0, email: 0, text: 0, phone: 0 }

  records.forEach((record) => {
    if (record.type in counts) counts[record.type] += 1
  })

  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([type, value]) => ({ name: TYPE_LABELS[type] || type, type, value }))
}

function formatDate(value) {
  const date = toDate(value)
  return date ? date.toLocaleString() : 'Just now'
}

function truncate(text, max = 28) {
  if (!text) return text
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function buildScanStats(scans, qrs) {
  const totalScans = scans.length

  const lastScanAt = scans.reduce((latest, scan) => {
    const scannedAt = toDate(scan.scannedAt)
    if (!scannedAt) return latest
    return !latest || scannedAt > latest ? scannedAt : latest
  }, null)

  const countsByQrId = new Map()
  scans.forEach((scan) => {
    countsByQrId.set(scan.qrId, (countsByQrId.get(scan.qrId) || 0) + 1)
  })

  let mostScannedId = null
  let mostScannedCount = 0
  countsByQrId.forEach((count, qrId) => {
    if (count > mostScannedCount) {
      mostScannedCount = count
      mostScannedId = qrId
    }
  })

  const mostScannedQr = mostScannedId ? qrs.find((record) => record.id === mostScannedId) : null

  return { totalScans, lastScanAt, mostScannedQr, mostScannedCount }
}

function StatCard({ label, value }) {
  const isText = typeof value === 'string'
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value${isText ? ' stat-value--text' : ''}`}>{value}</p>
    </div>
  )
}

function AdminPage() {
  const [qrs, setQrs] = useState([])
  const [blockedAttempts, setBlockedAttempts] = useState([])
  const [scans, setScans] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    withTimeout(
      Promise.all([getQRs(), getBlockedAttempts(), getScans()]),
      LOAD_TIMEOUT_MS,
      "Couldn't connect to Firebase. Check your Firebase configuration in .env.local.",
    )
      .then(([qrRecords, blocked, scanRecords]) => {
        if (cancelled) return
        setQrs(qrRecords)
        setBlockedAttempts(blocked)
        setScans(scanRecords)
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
  }, [])

  if (status === 'loading') {
    return (
      <div className="app-shell">
        <Header />
        <main className="main">
          <div className="card admin-card">
            <p className="history-empty">Loading dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="app-shell">
        <Header />
        <main className="main">
          <div className="card admin-card">
            <p className="history-empty history-empty--error">Couldn't load dashboard data: {error}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const totalQRs = qrs.length
  const activeQRs = qrs.filter((record) => record.status === 'active').length
  const dailyCounts = buildDailyCounts(qrs)
  const typeDistribution = buildTypeDistribution(qrs)
  const { totalScans, lastScanAt, mostScannedQr, mostScannedCount } = buildScanStats(scans, qrs)

  const activity = [
    ...qrs.map((record) => ({
      id: `qr-${record.id}`,
      kind: 'created',
      type: record.type,
      content: record.content,
      detail: record.status,
      createdAt: record.createdAt,
    })),
    ...blockedAttempts.map((record) => ({
      id: `blocked-${record.id}`,
      kind: 'blocked',
      type: record.type,
      content: record.content,
      detail: record.reason,
      createdAt: record.createdAt,
    })),
  ]
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0))
    .slice(0, 8)

  return (
    <div className="app-shell">
      <Header />
      <main className="main">
        <div className="card admin-card">
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-title">Overview</h2>
              <Button variant="secondary" onClick={() => exportQrReport(qrs)} disabled={qrs.length === 0}>
                <DownloadIcon />
                Export CSV
              </Button>
            </div>
            <div className="stat-grid">
              <StatCard label="Total QR codes" value={totalQRs} />
              <StatCard label="Active QR codes" value={activeQRs} />
              <StatCard label="Blocked QR attempts" value={blockedAttempts.length} />
              <StatCard label="Total scans" value={totalScans} />
              <StatCard label="Last scan" value={lastScanAt ? lastScanAt.toLocaleString() : 'No scans yet'} />
              <StatCard
                label="Most scanned QR"
                value={mostScannedQr ? `${truncate(mostScannedQr.content)} (${mostScannedCount})` : 'No scans yet'}
              />
            </div>
          </div>

          <div className="admin-section">
            <h2 className="admin-title">Charts</h2>
            <div className="chart-grid">
              <div className="chart-card">
                <h3 className="chart-title">QR creation by day</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dailyCounts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="QR codes" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3 className="chart-title">QR type distribution</h3>
                {typeDistribution.length === 0 ? (
                  <p className="history-empty">No QR codes saved yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {typeDistribution.map((entry) => (
                          <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="admin-section">
            <h2 className="admin-title">Recent activity</h2>
            {activity.length === 0 ? (
              <p className="history-empty">No activity yet.</p>
            ) : (
              <ul className="history-list">
                {activity.map((item) => (
                  <li key={item.id} className="history-item">
                    <span className={`activity-badge activity-badge--${item.kind}`}>
                      {item.kind === 'blocked' ? 'Blocked' : 'Created'}
                    </span>
                    <div className="history-details">
                      <p className="history-content">{item.content}</p>
                      <p className="history-meta">
                        {TYPE_LABELS[item.type] || item.type} · {formatDate(item.createdAt)}
                        {item.detail ? ` · ${item.detail}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default AdminPage
