// Builds and downloads a CSV report of saved QR records.

const CSV_HEADERS = ['QR ID', 'Type', 'Content', 'Created Date', 'Scan Count']

function toDate(value) {
  if (!value) return null
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function escapeCsvField(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * Builds a CSV string with columns: QR ID, Type, Content, Created Date, Scan Count.
 * @param {Array<{ id: string, type: string, content: string, createdAt: any, scans?: number }>} records
 * @returns {string}
 */
export function buildQrReportCsv(records) {
  const rows = records.map((record) => {
    const created = toDate(record.createdAt)
    return [record.id, record.type, record.content, created ? created.toISOString() : '', record.scans ?? 0]
  })

  return [CSV_HEADERS, ...rows].map((row) => row.map(escapeCsvField).join(',')).join('\r\n')
}

/** Builds the report filename for a given date, e.g. "qr-report-2026-06-16.csv". */
export function buildQrReportFilename(date = new Date()) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `qr-report-${yyyy}-${mm}-${dd}.csv`
}

/** Triggers a browser download of the given CSV content. */
export function downloadCsv(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

/** Builds and downloads the QR report CSV for the given records. */
export function exportQrReport(records) {
  downloadCsv(buildQrReportFilename(), buildQrReportCsv(records))
}
