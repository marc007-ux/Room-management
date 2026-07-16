import './Badge.css'

const LABELS = {
  available: 'Available', reserved: 'Reserved', occupied: 'Occupied',
  maintenance: 'Maintenance', out_of_service: 'Out of Service',
}

export default function Badge({ status, children }) {
  return <span className={`badge badge-${status}`}>{children || LABELS[status] || status}</span>
}