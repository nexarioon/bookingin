export function formatDateForAPI(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate()
}

export function getMonthDays(month, year) {
  const daysInMonth = getDaysInMonth(month, year)
  const firstDay = new Date(year, month, 1).getDay()
  const days = []
  
  // Add empty slots for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  
  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  
  return days
}

export function isDateInRange(date, startDate, endDate) {
  const d = new Date(date)
  const start = new Date(startDate)
  const end = new Date(endDate)
  return d >= start && d <= end
}

export function isSameDay(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return d1.toDateString() === d2.toDateString()
}

export function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function getMonthName(month) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return months[month]
}

export function getDayName(day) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  return days[day]
}
