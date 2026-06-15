import Input from './ui/Input.jsx'

function PhoneQRForm({ values, errors, onChange }) {
  return (
    <div className="form-grid">
      <Input
        label="Phone number"
        name="phone"
        type="tel"
        placeholder="0901234567 or +84901234567"
        value={values.phone}
        onChange={(event) => onChange({ phone: event.target.value })}
        error={errors.phone}
      />
    </div>
  )
}

export default PhoneQRForm
