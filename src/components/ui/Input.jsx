function Input({ label, error, id, ...props }) {
  const inputId = id ?? props.name

  return (
    <label className="field" htmlFor={inputId}>
      <span className="field-label">{label}</span>
      <input
        id={inputId}
        className={`field-input ${error ? 'field-input--error' : ''}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}

export default Input
