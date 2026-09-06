import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader2, Tag, Percent, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import AdminLayout from '@/components/admin/AdminLayout'

export default function PromoPage() {
  const { addToast } = useToast()
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [formData, setFormData] = useState({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_booking_amount: '', max_discount: '', start_date: '', end_date: '', usage_limit: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchPromos() }, [])

  const fetchPromos = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/promos', { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json()
      setPromos(data.promos || [])
    } catch (error) { setPromos([]) }
    finally { setLoading(false) }
  }

  const handleOpenForm = (promo = null) => {
    if (promo) {
      setEditingPromo(promo)
      setFormData({ code: promo.code, description: promo.description || '', discount_type: promo.discount_type, discount_value: promo.discount_value, min_booking_amount: promo.min_booking_amount || '', max_discount: promo.max_discount || '', start_date: promo.start_date || '', end_date: promo.end_date || '', usage_limit: promo.usage_limit || '' })
    } else {
      setEditingPromo(null)
      setFormData({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_booking_amount: '', max_discount: '', start_date: '', end_date: '', usage_limit: '' })
    }
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const token = localStorage.getItem('admin_token')
      const url = editingPromo ? `/api/admin/promos/${editingPromo.id}` : '/api/admin/promos'
      const body = { ...formData, discount_value: parseFloat(formData.discount_value), min_booking_amount: formData.min_booking_amount ? parseFloat(formData.min_booking_amount) : 0, max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null, usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null }
      await fetch(url, { method: editingPromo ? 'PUT' : 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setShowForm(false)
      fetchPromos()
      addToast({ variant: 'success', title: 'Berhasil', description: 'Promo berhasil disimpan' })
    } catch (error) { addToast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan' }) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus promo ini?')) return
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`/api/admin/promos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      setPromos(prev => prev.filter(p => p.id !== id))
      addToast({ variant: 'success', title: 'Berhasil', description: 'Promo berhasil dihapus' })
    } catch (error) { addToast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menghapus' }) }
  }

  const toggleActive = async (promo) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`/api/admin/promos/${promo.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !promo.is_active }) })
      setPromos(prev => prev.map(p => p.id === promo.id ? { ...p, is_active: !p.is_active } : p))
      addToast({ variant: 'success', title: 'Berhasil', description: 'Status promo diupdate' })
    } catch (error) { addToast({ variant: 'destructive', title: 'Gagal', description: 'Gagal update' }) }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Promo Codes</h1><p className="text-muted-foreground">Kelola kode promo dan diskon</p></div>
          <Button onClick={() => handleOpenForm()}><Plus className="h-4 w-4 mr-2" />Tambah Promo</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-6"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>)}
            </>
          ) : promos.length === 0 ? (
            <Card className="col-span-full"><CardContent className="p-12 text-center"><Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">Belum Ada Promo</h3><Button onClick={() => handleOpenForm()}><Plus className="h-4 w-4 mr-2" />Tambah Promo</Button></CardContent></Card>
          ) : (
            promos.map((promo) => (
              <Card key={promo.id} className={!promo.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={promo.is_active ? 'success' : 'secondary'}>{promo.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                        <Badge variant="outline">{promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `Rp${promo.discount_value}`}</Badge>
                      </div>
                      <h3 className="text-lg font-mono font-bold">{promo.code}</h3>
                    </div>
                    {promo.discount_type === 'percentage' ? <Percent className="h-5 w-5 text-primary" /> : <DollarSign className="h-5 w-5 text-primary" />}
                  </div>
                  {promo.description && <p className="text-sm text-muted-foreground mb-3">{promo.description}</p>}
                  <div className="text-xs text-muted-foreground space-y-1 mb-4">
                    <p>Min. booking: Rp{(promo.min_booking_amount || 0).toLocaleString('id-ID')}</p>
                    {promo.max_discount && <p>Maks. diskon: Rp{promo.max_discount.toLocaleString('id-ID')}</p>}
                    {promo.usage_limit && <p>Penggunaan: {promo.used_count}/{promo.usage_limit}</p>}
                    {promo.start_date && <p>Berlaku: {promo.start_date} - {promo.end_date || 'Unlimited'}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenForm(promo)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => toggleActive(promo)}>{promo.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(promo.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editingPromo ? 'Edit Promo' : 'Tambah Promo Baru'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Kode Promo *</Label><Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} required placeholder="CONTOH10" /></div>
            <div><Label>Deskripsi</Label><Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Diskon untuk..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipe Diskon *</Label><Select value={formData.discount_type} onValueChange={(v) => setFormData({...formData, discount_type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Persen (%)</SelectItem><SelectItem value="fixed">Fixed (Rp)</SelectItem></SelectContent></Select></div>
              <div><Label>Nilai Diskon *</Label><Input type="number" value={formData.discount_value} onChange={(e) => setFormData({...formData, discount_value: e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Min. Booking (Rp)</Label><Input type="number" value={formData.min_booking_amount} onChange={(e) => setFormData({...formData, min_booking_amount: e.target.value})} /></div>
              <div><Label>Maks. Diskon (Rp)</Label><Input type="number" value={formData.max_discount} onChange={(e) => setFormData({...formData, max_discount: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tanggal Mulai</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} /></div>
              <div><Label>Tanggal Akhir</Label><Input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} /></div>
            </div>
            <div><Label>Batas Penggunaan</Label><Input type="number" value={formData.usage_limit} onChange={(e) => setFormData({...formData, usage_limit: e.target.value})} placeholder="Unlimited" /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button><Button type="submit" disabled={submitting}>{submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : 'Simpan'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
