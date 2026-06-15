import { useRef } from 'react'
import Button from './ui/Button.jsx'

const ACCEPTED_TYPES = 'image/png,image/jpeg,image/svg+xml,image/webp'

function LogoUpload({ logo, error, onUpload, onRemove }) {
  const inputRef = useRef(null)

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onUpload(file)
  }

  return (
    <div className="field">
      <span className="field-label">Center logo (optional)</span>
      <div className="logo-upload">
        <div className="logo-preview">
          {logo ? (
            <img src={logo} alt="Logo preview" />
          ) : (
            <span className="logo-preview-empty">No logo</span>
          )}
        </div>
        <div className="logo-actions">
          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
            Upload logo
          </Button>
          {logo && (
            <Button type="button" variant="ghost" onClick={onRemove}>
              Remove logo
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            hidden
          />
        </div>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

export default LogoUpload
