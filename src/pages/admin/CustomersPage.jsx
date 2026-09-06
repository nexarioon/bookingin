import { useState, useEffect } from 'react'
import { Users, Eye, Loader2, Phone, Mail, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import AdminLayout from '@/components/admin/AdminLayout'
import { formatCurrency } from '@/utils/whatsapp'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [customerBookings, setCustomerBookings] = useState([])

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/customers', { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) { setCustomers([]) }
    finally { setLoading(false) }
  }

  const viewCustomer = async (customer) => {
    setSelectedCustomer(customer)
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/customers/${customer.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json()
      setCustomerBookings(data.customer?.bookings || [])
    } catch (error) { setCustomerBookings([]) }
    setShowDetail(true)
  }

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || (c.email && c.email.toLowerCase().includes(search.toLowerCase())))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Riwayat pelanggan</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <Input placeholder="Cari nama, telepon, atau email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Daftar Pelanggan ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Belum ada pelanggan</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Nama</th>
                      <th className="text-left p-3 font-medium">Telepon</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Total Booking</th>
                      <th className="text-left p-3 font-medium">Sejak</th>
                      <th className="text-right p-3 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center"><span className="text-sm font-medium text-primary">{c.name.charAt(0)}</span></div>
                            <span className="font-medium">{c.name}</span>
                          </div>
                        </td>
                        <td className="p-3"><div className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{c.phone}</div></td>
                        <td className="p-3"><div className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" />{c.email || '-'}</div></td>
                        <td className="p-3"><Badge variant="secondary">{c.total_bookings} booking</Badge></td>
                        <td className="p-3 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="p-3 text-right"><Button variant="ghost" size="sm" onClick={() => viewCustomer(c)}><Eye className="h-4 w-4" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Riwayat - {selectedCustomer?.name}</DialogTitle></DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Nama</p><p className="font-medium">{selectedCustomer.name}</p></div>
                <div><p className="text-muted-foreground">Telepon</p><p className="font-medium">{selectedCustomer.phone}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selectedCustomer.email || '-'}</p></div>
                <div><p className="text-muted-foreground">Total Booking</p><p className="font-medium">{selectedCustomer.total_bookings}</p></div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Riwayat Booking</h4>
                {customerBookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada booking</p>
                ) : (
                  <div className="space-y-2">
                    {customerBookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                        <div>
                          <p className="font-medium">#{b.booking_code}</p>
                          <p className="text-xs text-muted-foreground">{b.unit_name}</p>
                        </div>
                        <div className="text-right">
                          <p>{b.start_date} - {b.end_date}</p>
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant={b.status === 'COMPLETED' ? 'success' : b.status === 'CANCELLED' ? 'destructive' : 'secondary'} className="text-[10px]">{b.status}</Badge>
                            <span className="font-medium">{formatCurrency(b.total_price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
