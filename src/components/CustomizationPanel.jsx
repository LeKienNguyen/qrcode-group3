import ColorField from './ui/ColorField.jsx'
import LogoUpload from './LogoUpload.jsx'
import { getContrastRatio } from '../lib/color.js'

const LOW_CONTRAST_THRESHOLD = 2.5

function CustomizationPanel({ customization, logoError, hasCustomization, onChange, onLogoUpload, onLogoRemove, onReset }) {
  const contrastRatio = getContrastRatio(customization.fgColor, customization.bgColor)
  const isLowContrast = contrastRatio !== null && contrastRatio < LOW_CONTRAST_THRESHOLD

  return (
    <div className="customize">
      <div className="customize-header">
        <h2 className="customize-title">Customize appearance</h2>
        <button type="button" className="link-button" onClick={onReset} disabled={!hasCustomization}>
          Reset customization
        </button>
      </div>

      <div className="customize-grid">
        <ColorField
          label="Foreground color"
          value={customization.fgColor}
          onChange={(fgColor) => onChange({ fgColor })}
        />
        <ColorField
          label="Background color"
          value={customization.bgColor}
          onChange={(bgColor) => onChange({ bgColor })}
        />
        <LogoUpload
          logo={customization.logo}
          error={logoError}
          onUpload={onLogoUpload}
          onRemove={onLogoRemove}
        />
      </div>

      {isLowContrast && (
        <p className="customize-warning">
          These colors have low contrast and may be harder for some scanners to read. For best
          results, choose a foreground and background with more contrast.
        </p>
      )}
    </div>
  )
}

export default CustomizationPanel
