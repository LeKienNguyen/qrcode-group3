function Select({ label, error, id, options, ...props }) {
  const inputId = id ?? props.name

  return (
    <label className="field" htmlFor={inputId}>
      <span className="field-label">{label}</span>
      <select
        id={inputId}
        className={`field-input ${error ? 'field-input--error' : ''}`}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}

export default Select
