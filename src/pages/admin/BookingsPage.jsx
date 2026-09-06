import { useState, useEffect } from 'react'
import { Search, Eye, CheckCircle, XCircle, Clock, Loader2, Download, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import AdminLayout from '@/components/admin/AdminLayout'
import { formatCurrency, formatDate } from '@/utils/whatsapp'

const statusColors = { PENDING: 'warning', CONFIRMED: 'success', ONGOING: 'info', COMPLETED: 'default', CANCELLED: 'destructive', REJECTED: 'destructive' }
const paymentColors = { UNPAID: 'destructive', PARTIAL: 'warning', PAID: 'success' }

export default function BookingsPage() {
  const { addToast } = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => { fetchBookings() }, [])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (searchQuery) params.append('search', searchQuery)
      const response = await fetch(`/api/admin/bookings?${params}`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [filterStatus, searchQuery])

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setUpdating(true)
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes })
      })
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b))
      setShowDetail(false)
      addToast({ variant: 'success', title: 'Berhasil', description: 'Status booking berhasil diupdate' })
    } catch (error) {
      addToast({ variant: 'destructive', title: 'Gagal', description: 'Gagal mengupdate status' })
    } finally {
      setUpdating(false)
    }
  }

  const handleExport = () => {
    const token = localStorage.getItem('admin_token')
    window.open(`/api/admin/export/bookings?token=${token}`, '_blank')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bookings</h1>
            <p className="text-muted-foreground">Kelola semua pemesanan</p>
          </div>
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari nama, kode booking, atau unit..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Daftar Booking ({bookings.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><p>Tidak ada booking ditemukan</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Booking ID</th>
                      <th className="text-left p-3 font-medium">Customer</th>
                      <th className="text-left p-3 font-medium">Unit</th>
                      <th className="text-left p-3 font-medium">Tanggal</th>
                      <th className="text-left p-3 font-medium">Malam</th>
                      <th className="text-left p-3 font-medium">Total</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Bayar</th>
                      <th className="text-right p-3 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedBooking(b); setShowDetail(true) }}>
                        <td className="p-3 font-mono text-xs">#{b.booking_code}</td>
                        <td className="p-3"><p className="font-medium">{b.customer_name}</p><p className="text-xs text-muted-foreground">{b.customer_phone}</p></td>
                        <td className="p-3"><p className="text-sm">{b.unit_name}</p><p className="text-xs text-muted-foreground">{b.property_name}</p></td>
                        <td className="p-3 text-xs"><p>{b.start_date}</p><p className="text-muted-foreground">s/d {b.end_date}</p></td>
                        <td className="p-3 text-sm">{b.nights}</td>
                        <td className="p-3 font-medium">{formatCurrency(b.total_price)}</td>
                        <td className="p-3"><Badge variant={statusColors[b.status]}>{b.status}</Badge></td>
                        <td className="p-3"><Badge variant={paymentColors[b.payment_status]}>{b.payment_status}</Badge></td>
                        <td className="p-3 text-right"><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detail Booking #{selectedBooking?.booking_code}</DialogTitle></DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{selectedBooking.customer_name}</p><p className="text-xs text-muted-foreground">{selectedBooking.customer_phone}</p><p className="text-xs text-muted-foreground">{selectedBooking.customer_email}</p></div>
                <div><p className="text-muted-foreground">Unit</p><p className="font-medium">{selectedBooking.unit_name}</p><p className="text-xs text-muted-foreground">{selectedBooking.property_name}</p></div>
                <div><p className="text-muted-foreground">Check-in</p><p className="font-medium">{selectedBooking.start_date}</p></div>
                <div><p className="text-muted-foreground">Check-out</p><p className="font-medium">{selectedBooking.end_date}</p></div>
                <div><p className="text-muted-foreground">Malam</p><p className="font-medium">{selectedBooking.nights}</p></div>
                <div><p className="text-muted-foreground">Harga/Malam</p><p className="font-medium">{formatCurrency(selectedBooking.base_price)}</p></div>
                {selectedBooking.weekend_surcharge > 0 && <div><p className="text-muted-foreground">Weekend Surcharge</p><p className="font-medium text-orange-600">+{formatCurrency(selectedBooking.weekend_surcharge)}</p></div>}
                {selectedBooking.promo_discount > 0 && <div><p className="text-muted-foreground">Diskon Promo</p><p className="font-medium text-success">-{formatCurrency(selectedBooking.promo_discount)}</p></div>}
                <div className="col-span-2"><p className="text-muted-foreground">Total</p><p className="text-xl font-bold">{formatCurrency(selectedBooking.total_price)}</p></div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Status</p><Badge variant={statusColors[selectedBooking.status]}>{selectedBooking.status}</Badge></div>
                <div><p className="text-muted-foreground">Pembayaran</p><Badge variant={paymentColors[selectedBooking.payment_status]}>{selectedBooking.payment_status}</Badge></div>
                {selectedBooking.payment_amount > 0 && <div><p className="text-muted-foreground">Dibayar</p><p className="font-medium">{formatCurrency(selectedBooking.payment_amount)}</p></div>}
                {selectedBooking.promo_code && <div><p className="text-muted-foreground">Kode Promo</p><p className="font-medium">{selectedBooking.promo_code}</p></div>}
                {selectedBooking.special_requests && <div className="col-span-2"><p className="text-muted-foreground">Permintaan Khusus</p><p className="text-sm">{selectedBooking.special_requests}</p></div>}
              </div>

              <div>
                <Label>Catatan Admin</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tambahkan catatan..." />
              </div>

              <div>
                <Label>Update Status</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedBooking.status !== 'CONFIRMED' && <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedBooking.id, 'CONFIRMED')} disabled={updating}><CheckCircle className="h-4 w-4 mr-1" />Confirm</Button>}
                  {selectedBooking.status === 'CONFIRMED' && <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedBooking.id, 'ONGOING')} disabled={updating}>Check-in</Button>}
                  {selectedBooking.status === 'ONGOING' && <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedBooking.id, 'COMPLETED')} disabled={updating}>Check-out</Button>}
                  {!['CANCELLED', 'COMPLETED'].includes(selectedBooking.status) && <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(selectedBooking.id, 'CANCELLED')} disabled={updating}><XCircle className="h-4 w-4 mr-1" />Cancel</Button>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
