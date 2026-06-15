function Button({ variant = 'primary', className = '', ...props }) {
  return <button className={`btn btn--${variant} ${className}`.trim()} {...props} />
}

export default Button
