import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Checkbox from '../ui/Checkbox.jsx'

const ENCRYPTION_OPTIONS = [
  { value: 'WPA', label: 'WPA / WPA2 / WPA3' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: 'No password' },
]

function WifiForm({ values, errors, onChange }) {
  return (
    <div className="form-grid">
      <Input
        label="Network name (SSID)"
        name="ssid"
        type="text"
        placeholder="Office-WiFi"
        value={values.ssid}
        onChange={(event) => onChange({ ssid: event.target.value })}
        error={errors.ssid}
      />

      <Select
        label="Security"
        name="encryption"
        value={values.encryption}
        onChange={(event) => onChange({ encryption: event.target.value })}
        options={ENCRYPTION_OPTIONS}
      />

      {values.encryption !== 'nopass' && (
        <Input
          label="Password"
          name="password"
          type="text"
          placeholder="Enter Wi-Fi password"
          value={values.password}
          onChange={(event) => onChange({ password: event.target.value })}
          error={errors.password}
        />
      )}

      <Checkbox
        label="Hidden network"
        name="hidden"
        checked={values.hidden}
        onChange={(event) => onChange({ hidden: event.target.checked })}
      />
    </div>
  )
}

export default WifiForm
