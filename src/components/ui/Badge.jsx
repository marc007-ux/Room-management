import './Badge.css'
import { useLanguage } from '../../hooks/useLanguage'

const LABELS = {
  en: {
    available: 'Available',
    reserved: 'Reserved',
    occupied: 'Occupied',
    maintenance: 'Maintenance',
    out_of_service: 'Out of Service',
    neutral: 'Info',
  },
  fr: {
    available: 'Disponible',
    reserved: 'Réservée',
    occupied: 'Occupée',
    maintenance: 'Maintenance',
    out_of_service: 'Hors service',
    neutral: 'Info',
  },
}

export default function Badge({ status, children }) {
  const { language } = useLanguage() || { language: 'en' }
  const tone = status || 'neutral'
  const label = children || LABELS[language]?.[tone] || LABELS.en[tone] || tone

  return <span className={`badge badge-${tone}`}>{label}</span>
}
