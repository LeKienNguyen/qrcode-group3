import Input from '../ui/Input.jsx'
import TextArea from '../ui/TextArea.jsx'

function EmailForm({ values, errors, onChange }) {
  return (
    <div className="form-grid">
      <Input
        label="Recipient email"
        name="email"
        type="email"
        placeholder="name@company.com"
        value={values.email}
        onChange={(event) => onChange({ email: event.target.value })}
        error={errors.email}
      />

      <Input
        label="Subject (optional)"
        name="subject"
        type="text"
        placeholder="Meeting request"
        value={values.subject}
        onChange={(event) => onChange({ subject: event.target.value })}
        error={errors.subject}
      />

      <TextArea
        label="Message (optional)"
        name="body"
        rows={4}
        placeholder="Write a short message..."
        value={values.body}
        onChange={(event) => onChange({ body: event.target.value })}
        error={errors.body}
      />
    </div>
  )
}

export default EmailForm
