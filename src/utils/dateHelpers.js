export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US');
}

export function isDateBefore(dateA, dateB) {
  return new Date(dateA) < new Date(dateB);
}
