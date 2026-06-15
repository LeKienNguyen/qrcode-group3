import { LinkIcon, MailIcon, WifiIcon } from './icons/Icons.jsx'

export const QR_TYPES = [
  { id: 'url', label: 'URL', Icon: LinkIcon },
  { id: 'wifi', label: 'Wi-Fi', Icon: WifiIcon },
  { id: 'email', label: 'Email', Icon: MailIcon },
]

function TabSelector({ active, onChange }) {
  return (
    <div className="tabs" role="tablist" aria-label="QR code type">
      {QR_TYPES.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          className={`tab ${active === id ? 'tab--active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon className="tab-icon" />
          {label}
        </button>
      ))}
    </div>
  )
}

export default TabSelector
