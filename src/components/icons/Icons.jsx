const baseProps = {
  viewBox: '0 0 24 24',
  width: 18,
  height: 18,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function QrIcon(props) {
  return (
    <svg {...baseProps} width={28} height={28} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3z" />
      <path d="M19 14h2v2" />
      <path d="M14 19h2v2" />
      <path d="M19 19h2v2" />
    </svg>
  )
}

export function LinkIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M10 13a5 5 0 0 0 7.07 0l1.93-1.93a5 5 0 0 0-7.07-7.07L10.5 5.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.99 12.93a5 5 0 0 0 7.07 7.07L13.5 18.5" />
    </svg>
  )
}

export function WifiIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 12.5a11 11 0 0 1 14 0" />
      <path d="M7.8 15.5a7 7 0 0 1 8.4 0" />
      <path d="M10.6 18.5a3 3 0 0 1 2.8 0" />
      <circle cx="12" cy="20.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function MailIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

export function DownloadIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

export function TrashIcon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}
