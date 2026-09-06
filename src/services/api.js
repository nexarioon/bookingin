const API_BASE = '/api'

async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('admin_token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'API request failed')
  }
  
  return data
}

// Public APIs
export const getUnits = () => fetchAPI('/units')
export const getUnit = (id) => fetchAPI(`/units/${id}`)
export const checkAvailability = (unitId, startDate, endDate) => 
  fetchAPI(`/availability?unit_id=${unitId}&start_date=${startDate}&end_date=${endDate}`)
export const submitBooking = (bookingData) => 
  fetchAPI('/bookings', { method: 'POST', body: JSON.stringify(bookingData) })

// Auth APIs
export const login = (email, password) => 
  fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })

// Admin APIs
export const getAdminBookings = (status) => 
  fetchAPI(`/admin/bookings${status ? `?status=${status}` : ''}`)
export const getBooking = (id) => fetchAPI(`/admin/bookings/${id}`)
export const updateBookingStatus = (id, status, notes) => 
  fetchAPI(`/admin/bookings/${id}`, { 
    method: 'PATCH', 
    body: JSON.stringify({ status, notes }) 
  })

export const createUnit = (unitData) => 
  fetchAPI('/admin/units', { method: 'POST', body: JSON.stringify(unitData) })
export const updateUnit = (id, unitData) => 
  fetchAPI(`/admin/units/${id}`, { method: 'PUT', body: JSON.stringify(unitData) })
export const deleteUnit = (id) => 
  fetchAPI(`/admin/units/${id}`, { method: 'DELETE' })

export const getAdminStats = () => fetchAPI('/admin/stats')
export const getCalendarData = (month, year) => 
  fetchAPI(`/admin/calendar?month=${month}&year=${year}`)
