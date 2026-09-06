import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AdminLayout from '@/components/admin/AdminLayout'
import { getMonthName, getDaysInMonth } from '@/utils/date'

const statusColors = {
  PENDING: 'bg-yellow-200 text-yellow-800',
  CONFIRMED: 'bg-red-200 text-red-800',
  ONGOING: 'bg-blue-200 text-blue-800',
  COMPLETED: 'bg-green-200 text-green-800',
  CANCELLED: 'bg-gray-200 text-gray-800',
  REJECTED: 'bg-gray-200 text-gray-800',
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [units, setUnits] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(month, year)

  useEffect(() => {
    fetchData()
  }, [month, year])

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
      const [unitsRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/units', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/bookings', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      
      const unitsData = await unitsRes.json()
      const bookingsData = await bookingsRes.json()
      
      setUnits(unitsData.units || [])
      setBookings(bookingsData.bookings || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBookingsForDate = (unitId, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return bookings.filter(booking => 
      booking.unit_id === unitId &&
      dateStr >= booking.start_date &&
      dateStr <= booking.end_date &&
      ['PENDING', 'CONFIRMED', 'ONGOING'].includes(booking.status)
    )
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Kalender</h1>
          <p className="text-muted-foreground">Lihat jadwal booking semua unit</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-200" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-200" />
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-200" />
            <span>Ongoing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-200" />
            <span>Available</span>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-xl">
              {getMonthName(month)} {year}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : units.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Belum ada unit. Tambah unit terlebih dahulu.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left border bg-muted/50 sticky left-0 min-w-[150px]">
                        Unit
                      </th>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                        <th 
                          key={day} 
                          className="p-2 text-center border bg-muted/50 min-w-[50px]"
                        >
                          <div className="text-xs">{day}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit) => (
                      <tr key={unit.id}>
                        <td className="p-2 border font-medium sticky left-0 bg-card min-w-[150px]">
                          <div className="text-sm">{unit.name}</div>
                          {unit.type && (
                            <div className="text-xs text-muted-foreground">{unit.type}</div>
                          )}
                        </td>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                          const dayBookings = getBookingsForDate(unit.id, day)
                          const hasBooking = dayBookings.length > 0
                          const booking = dayBookings[0]
                          
                          return (
                            <td 
                              key={day} 
                              className={`p-1 border text-center text-xs ${
                                hasBooking 
                                  ? statusColors[booking.status] || 'bg-gray-100'
                                  : 'bg-green-50'
                              }`}
                            >
                              {hasBooking ? (
                                <div className="font-medium truncate px-1" title={booking.customer_name}>
                                  {booking.status.charAt(0)}
                                </div>
                              ) : (
                                <span className="text-green-600">-</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bookings This Month */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2">
                {bookings
                  .filter(b => {
                    const start = new Date(b.start_date)
                    return start.getMonth() === month && start.getFullYear() === year
                  })
                  .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                  .map((booking) => (
                    <div 
                      key={booking.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          statusColors[booking.status]?.split(' ')[0] || 'bg-gray-200'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{booking.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{booking.unit_name}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p>{booking.start_date} - {booking.end_date}</p>
                        <p className="text-xs text-muted-foreground">{booking.status}</p>
                      </div>
                    </div>
                  ))}
                {bookings.filter(b => {
                  const start = new Date(b.start_date)
                  return start.getMonth() === month && start.getFullYear() === year
                }).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Tidak ada booking bulan ini
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
