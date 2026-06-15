function Checkbox({ label, id, ...props }) {
  const inputId = id ?? props.name

  return (
    <label className="checkbox" htmlFor={inputId}>
      <input id={inputId} type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  )
}

export default Checkbox
