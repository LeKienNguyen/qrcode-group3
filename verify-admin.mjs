import { chromium } from 'playwright'

const PROJECT = 'test-project'
const BASE = `projects/${PROJECT}/databases/(default)/documents`

function ts(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

function doc(collection, id, fields) {
  const encoded = {}
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string') encoded[key] = { stringValue: value }
    else if (typeof value === 'number') encoded[key] = { integerValue: String(value) }
    else if (value instanceof Date) encoded[key] = { timestampValue: value.toISOString() }
  }
  return {
    document: {
      name: `${BASE}/${collection}/${id}`,
      fields: encoded,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    },
    readTime: new Date().toISOString(),
  }
}

const qrDocs = [
  doc('qrCodes', 'a1', { type: 'url', content: 'https://example.com/a', status: 'active', scans: 5, createdAt: new Date(ts(0)) }),
  doc('qrCodes', 'a2', { type: 'url', content: 'https://example.com/b', status: 'active', scans: 2, createdAt: new Date(ts(0)) }),
  doc('qrCodes', 'a3', { type: 'wifi', content: 'WIFI:T:WPA;S:HomeNet;P:secret;;', status: 'active', scans: 0, createdAt: new Date(ts(1)) }),
  doc('qrCodes', 'a4', { type: 'email', content: 'mailto:hello@example.com', status: 'inactive', scans: 1, createdAt: new Date(ts(2)) }),
  doc('qrCodes', 'a5', { type: 'url', content: 'https://example.com/c', status: 'active', scans: 9, createdAt: new Date(ts(3)) }),
  doc('qrCodes', 'a6', { type: 'wifi', content: 'WIFI:T:WPA;S:OfficeNet;P:secret;;', status: 'active', scans: 0, createdAt: new Date(ts(8)) }),
]

const blockedDocs = [
  doc('blockedAttempts', 'b1', { type: 'url', content: 'https://malware.com', reason: 'This website is on our blocked list and cannot be used to generate a QR code.', source: 'moderation', createdAt: new Date(ts(0)) }),
  doc('blockedAttempts', 'b2', { type: 'url', content: 'https://phishy-site.example', reason: 'Suspicious phishing content', source: 'ai', createdAt: new Date(ts(1)) }),
]

const scanDocs = [
  doc('qr_scans', 's1', { qrId: 'a1', scannedAt: new Date(ts(0)), device: 'Mobile' }),
  doc('qr_scans', 's2', { qrId: 'a1', scannedAt: new Date(ts(0)), device: 'Desktop' }),
  doc('qr_scans', 's3', { qrId: 'a1', scannedAt: new Date(ts(1)), device: 'Mobile' }),
  doc('qr_scans', 's4', { qrId: 'a5', scannedAt: new Date(ts(2)), device: 'Tablet' }),
]

async function run() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => pageErrors.push(err.message))

  await page.route('**/documents:runQuery', (route) => {
    const body = JSON.parse(route.request().postData())
    const collectionId = body.structuredQuery?.from?.[0]?.collectionId
    const docs =
      collectionId === 'blockedAttempts' ? blockedDocs : collectionId === 'qr_scans' ? scanDocs : qrDocs
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(docs) })
  })

  console.log('\n=== Loading Admin Dashboard with mocked Firestore data ===')
  await page.goto('http://localhost:5173/admin')
  await page.waitForTimeout(1500)

  const stats = await page.locator('.stat-card').allTextContents()
  console.log('Stat cards:', stats)

  const chartTitles = await page.locator('.chart-title').allTextContents()
  console.log('Chart titles:', chartTitles)

  const barCount = await page.locator('.chart-card .recharts-bar-rectangle').count()
  console.log('Bar chart bars rendered:', barCount)

  const pieCount = await page.locator('.chart-card .recharts-pie-sector').count()
  console.log('Pie chart slices rendered:', pieCount)

  const legend = await page.locator('.recharts-legend-wrapper').textContent().catch(() => null)
  console.log('Pie legend:', legend)

  const activity = await page.locator('.history-item').allTextContents()
  console.log('Recent activity items:', activity.length)
  activity.slice(0, 3).forEach((a) => console.log('  -', a.replace(/\s+/g, ' ').trim()))

  console.log('\nPage errors:', pageErrors)
  console.log('Console errors:', consoleErrors)

  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
