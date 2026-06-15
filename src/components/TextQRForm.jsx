import TextArea from './ui/TextArea.jsx'
import { TEXT_MAX_LENGTH } from '../lib/validation.js'

function TextQRForm({ values, errors, onChange }) {
  return (
    <div className="form-grid">
      <TextArea
        label="Text content"
        name="text"
        rows={6}
        placeholder="Enter any text to encode..."
        value={values.text}
        onChange={(event) => onChange({ text: event.target.value })}
        error={errors.text}
        maxLength={TEXT_MAX_LENGTH}
      />
      <p className="field-hint">
        {values.text.length} / {TEXT_MAX_LENGTH} characters
      </p>
    </div>
  )
}

export default TextQRForm
