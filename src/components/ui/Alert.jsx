import './Alert.css'

export default function Alert({ type = 'error', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>
}