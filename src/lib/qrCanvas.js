import QRCode from 'qrcode'

// Keep the logo small enough, with high error-correction, so the QR code
// stays scannable even with a logo covering its center.
const LOGO_SIZE_RATIO = 0.22
const LOGO_PADDING_RATIO = 0.04
const LOGO_RADIUS_RATIO = 0.18

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load the logo image.'))
    image.src = src
  })
}

function drawRoundedRect(context, x, y, size, radius) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + size, y, x + size, y + size, radius)
  context.arcTo(x + size, y + size, x, y + size, radius)
  context.arcTo(x, y + size, x, y, radius)
  context.arcTo(x, y, x + size, y, radius)
  context.closePath()
}

export async function renderQrToCanvas(canvas, value, { size, fgColor, bgColor, logo }) {
  await QRCode.toCanvas(canvas, value, {
    width: size,
    margin: 1,
    errorCorrectionLevel: logo ? 'H' : 'M',
    color: { dark: fgColor, light: bgColor },
  })

  if (!logo) return

  const image = await loadImage(logo)
  const context = canvas.getContext('2d')

  const boxSize = size * (LOGO_SIZE_RATIO + LOGO_PADDING_RATIO * 2)
  const boxOffset = (size - boxSize) / 2

  context.fillStyle = bgColor
  drawRoundedRect(context, boxOffset, boxOffset, boxSize, boxSize * LOGO_RADIUS_RATIO)
  context.fill()

  const logoSize = size * LOGO_SIZE_RATIO
  const logoOffset = (size - logoSize) / 2
  context.drawImage(image, logoOffset, logoOffset, logoSize, logoSize)
}
