import Input from '../ui/Input.jsx'

function UrlForm({ values, errors, onChange }) {
  return (
    <div className="form-grid">
      <Input
        label="Website URL"
        name="url"
        type="text"
        placeholder="https://example.com"
        value={values.url}
        onChange={(event) => onChange({ url: event.target.value })}
        error={errors.url}
      />
    </div>
  )
}

export default UrlForm
