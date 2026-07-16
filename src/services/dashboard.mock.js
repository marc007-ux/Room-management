export function getDashboardMockData() {
  return {
    todaySummary: { checkIns: 4, checkOuts: 3, newReservations: 6 },
    revenueThisMonth: 1284500, // FCFA
    occupancyRate: 0.72,
    bookingTrend: [
      { day: 'Mon', bookings: 4 },
      { day: 'Tue', bookings: 7 },
      { day: 'Wed', bookings: 5 },
      { day: 'Thu', bookings: 9 },
      { day: 'Fri', bookings: 12 },
      { day: 'Sat', bookings: 15 },
      { day: 'Sun', bookings: 8 },
    ],
    recentReservations: [
      { id: 1, guest: 'Ngono Patrick', room: '204', dates: 'Jul 14 – Jul 17', status: 'active' },
      { id: 2, guest: 'Fotso Marie', room: '108', dates: 'Jul 15 – Jul 16', status: 'completed' },
      { id: 3, guest: 'Biya Junior', room: 'A12', dates: 'Jul 16 – Jul 20', status: 'active' },
      { id: 4, guest: 'Tchoumi Sarah', room: '301', dates: 'Jul 13 – Jul 15', status: 'cancelled' },
    ],
    upcomingCheckouts: [
      { id: 1, guest: 'Ngono Patrick', room: '204', time: 'Today, 12:00 PM' },
      { id: 2, guest: 'Essomba Rita', room: '110', time: 'Today, 2:00 PM' },
      { id: 3, guest: 'Kamga Boris', room: 'B04', time: 'Tomorrow, 11:00 AM' },
    ],
    recentActivity: [
      { id: 1, text: 'Room 12 marked as Maintenance', time: '10 min ago' },
      { id: 2, text: 'Payment received — Reservation #204', time: '32 min ago' },
      { id: 3, text: 'New customer registered: Fotso Marie', time: '1h ago' },
      { id: 4, text: 'Room 5 checked out', time: '2h ago' },
    ],
  }
}