// Best-effort device category from the user agent, used to label scan events.
export function getDeviceType() {
  const ua = navigator.userAgent || ''

  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'Tablet'
  if (/Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'Tablet'
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'Mobile'

  return 'Desktop'
}
