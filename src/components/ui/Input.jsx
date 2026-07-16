import './Input.css'

export default function Input({ label, error, ...props }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <input className={`field-input ${error ? 'field-input-error' : ''}`} {...props} />
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}