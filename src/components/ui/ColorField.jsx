import { useEffect, useState } from 'react'
import { isValidHexColor } from '../../lib/color.js'

function ColorField({ label, value, onChange }) {
  const [text, setText] = useState(value)

  useEffect(() => {
    setText(value)
  }, [value])

  const handleTextChange = (next) => {
    setText(next)
    if (isValidHexColor(next)) {
      onChange(next)
    }
  }

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="color-field">
        <input
          type="color"
          className="color-swatch"
          value={isValidHexColor(text) ? text : value}
          onChange={(event) => {
            setText(event.target.value)
            onChange(event.target.value)
          }}
          aria-label={`${label} swatch`}
        />
        <input
          type="text"
          className="field-input color-hex"
          value={text}
          onChange={(event) => handleTextChange(event.target.value)}
          maxLength={7}
          spellCheck={false}
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  )
}

export default ColorField
