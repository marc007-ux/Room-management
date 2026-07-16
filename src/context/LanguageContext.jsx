import { createContext, useContext, useState } from 'react'

const translations = {
  en: {
    header_title: 'Dashboard',
    switch_language: 'Switch language',
    notifications: 'Notifications',
    settings: 'Settings',
    logout: 'Log out',
    staff_account: 'Staff account',
    nav_dashboard: 'Dashboard',
    nav_rooms: 'Rooms',
    nav_categories: 'Categories',
    nav_customers: 'Customers',
    nav_reservations: 'Reservations',
    nav_payments: 'Payments',
    notif_checkout_soon: 'Room 12 checkout due in 2 hours',
    notif_maintenance_done: 'Room 5 maintenance completed',
    notif_payment_received: 'Payment received for Reservation #204',
    welcome_back: 'Welcome back',
    dashboard_subtitle: "Here's what's happening across your property today.",
    stat_available: 'Available',
    stat_reserved: 'Reserved',
    stat_occupied: 'Occupied',
    stat_maintenance: 'Maintenance',
    stat_out_of_service: 'Out of Service',
    recent_reservations: 'Recent Reservations',
    quick_actions: 'Quick Actions',
    action_new_reservation: 'New Reservation',
    action_add_room: 'Add Room',
    action_add_customer: 'Add Customer',
  },
  fr: {
    header_title: 'Tableau de bord',
    switch_language: 'Changer de langue',
    notifications: 'Notifications',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    staff_account: 'Compte du personnel',
    nav_dashboard: 'Tableau de bord',
    nav_rooms: 'Chambres',
    nav_categories: 'Catégories',
    nav_customers: 'Clients',
    nav_reservations: 'Réservations',
    nav_payments: 'Paiements',
    notif_checkout_soon: 'Chambre 12 : départ prévu dans 2 heures',
    notif_maintenance_done: 'Chambre 5 : entretien terminé',
    notif_payment_received: 'Paiement reçu pour la réservation #204',
    welcome_back: 'Bon retour',
    dashboard_subtitle: "Voici ce qui se passe dans votre établissement aujourd'hui.",
    stat_available: 'Disponibles',
    stat_reserved: 'Réservées',
    stat_occupied: 'Occupées',
    stat_maintenance: 'Entretien',
    stat_out_of_service: 'Hors service',
    recent_reservations: 'Réservations récentes',
    quick_actions: 'Actions rapides',
    action_new_reservation: 'Nouvelle réservation',
    action_add_room: 'Ajouter une chambre',
    action_add_customer: 'Ajouter un client',
  },
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en')

  function toggleLanguage() {
    setLanguage((prev) => (prev === 'en' ? 'fr' : 'en'))
  }

  function t(key) {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)