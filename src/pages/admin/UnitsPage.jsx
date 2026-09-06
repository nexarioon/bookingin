import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader2, Package, Star, Image, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import AdminLayout from '@/components/admin/AdminLayout'
import { formatCurrency } from '@/utils/whatsapp'

const defaultUnit = { name: '', type: '', base_price: '', weekend_price: '', capacity: '', bed_count: '', bathroom_count: '', size_m2: '', description: '', photo_url: '', is_active: true, min_nights: 1, max_nights: '', amenities: [] }

export default function UnitsPage() {
  const { addToast } = useToast()
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [formData, setFormData] = useState(defaultUnit)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)
  
  const [showGallery, setShowGallery] = useState(false)
  const [galleryUnit, setGalleryUnit] = useState(null)
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [newAmenity, setNewAmenity] = useState('')

  useEffect(() => { fetchUnits() }, [])

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/units', { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json()
      setUnits(data.units || [])
    } catch (error) {
      setUnits([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForm = (unit = null) => {
    if (unit) {
      setEditingUnit(unit)
      setFormData({ name: unit.name, type: unit.type || '', base_price: unit.base_price, weekend_price: unit.weekend_price || '', capacity: unit.capacity || '', bed_count: unit.bed_count || '', bathroom_count: unit.bathroom_count || '', size_m2: unit.size_m2 || '', description: unit.description || '', photo_url: unit.photo_url || '', is_active: unit.is_active, min_nights: unit.min_nights || 1, max_nights: unit.max_nights || '', amenities: [] })
    } else {
      setEditingUnit(null)
      setFormData(defaultUnit)
    }
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const token = localStorage.getItem('admin_token')
      const url = editingUnit ? `/api/admin/units/${editingUnit.id}` : '/api/admin/units'
      const body = { ...formData, base_price: parseFloat(formData.base_price), weekend_price: formData.weekend_price ? parseFloat(formData.weekend_price) : null, capacity: formData.capacity ? parseInt(formData.capacity) : null, bed_count: formData.bed_count ? parseInt(formData.bed_count) : null, bathroom_count: formData.bathroom_count ? parseInt(formData.bathroom_count) : null, size_m2: formData.size_m2 ? parseInt(formData.size_m2) : null, min_nights: formData.min_nights ? parseInt(formData.min_nights) : 1, max_nights: formData.max_nights ? parseInt(formData.max_nights) : null }
      await fetch(url, { method: editingUnit ? 'PUT' : 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setShowForm(false)
      fetchUnits()
      addToast({ variant: 'success', title: 'Berhasil', description: 'Unit berhasil disimpan' })
    } catch (error) {
      addToast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan unit' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (unitId) => {
    if (!confirm('Yakin hapus unit ini?')) return
    setDeleting(unitId)
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`/api/admin/units/${unitId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      setUnits(prev => prev.filter(u => u.id !== unitId))
      addToast({ variant: 'success', title: 'Berhasil', description: 'Unit berhasil dihapus' })
    } catch (error) { addToast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menghapus' }) }
    finally { setDeleting(null) }
  }

  const openGallery = async (unit) => {
    setGalleryUnit(unit)
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`/api/admin/units/${unit.id}/gallery`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json()
      setGalleryPhotos(data.gallery || [])
    } catch (error) { setGalleryPhotos([]) }
    setShowGallery(true)
  }

  const addPhoto = async () => {
    if (!newPhotoUrl || !galleryUnit) return
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`/api/admin/units/${galleryUnit.id}/gallery`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ photo_url: newPhotoUrl }) })
      const response = await fetch(`/api/admin/units/${galleryUnit.id}/gallery`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json()
      setGalleryPhotos(data.gallery || [])
      setNewPhotoUrl('')
      addToast({ variant: 'success', title: 'Berhasil', description: 'Foto berhasil ditambahkan' })
    } catch (error) { addToast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menambah foto' }) }
  }

  const deletePhoto = async (photoId) => {
    try {
      const token = localStorage.getItem('admin_token')
      await fetch(`/api/admin/gallery/${photoId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      setGalleryPhotos(prev => prev.filter(p => p.id !== photoId))
      addToast({ variant: 'success', title: 'Berhasil', description: 'Foto berhasil dihapus' })
    } catch (error) { addToast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menghapus foto' }) }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Units</h1><p className="text-muted-foreground">Kelola unit penginapan</p></div>
          <Button onClick={() => handleOpenForm()}><Plus className="h-4 w-4 mr-2" />Tambah Unit</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => <Card key={i}><div className="h-48 bg-muted animate-pulse" /><CardContent className="p-6"><div className="h-4 bg-muted animate-pulse rounded mb-2" /></CardContent></Card>)}
            </>
          ) : units.length === 0 ? (
            <Card className="col-span-full"><CardContent className="p-12 text-center"><Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">Belum Ada Unit</h3><Button onClick={() => handleOpenForm()}><Plus className="h-4 w-4 mr-2" />Tambah Unit</Button></CardContent></Card>
          ) : (
            units.map((unit) => (
              <Card key={unit.id} className="overflow-hidden">
                <div className="relative h-48 bg-muted">
                  <img src={unit.photo_url || 'https://images.unsplash.com/photo-1499793983394-12dec6520863?w=800'} alt={unit.name} className="w-full h-full object-cover" />
                  <Badge variant={unit.is_active ? "success" : "secondary"} className="absolute top-2 right-2">{unit.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                  {unit.type && <Badge variant="secondary" className="absolute top-2 left-2">{unit.type}</Badge>}
                </div>
                <CardContent className="p-4">
                  {unit.property_name && <p className="text-xs text-muted-foreground mb-1">{unit.property_name}</p>}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{unit.name}</h3>
                      {unit.avg_rating && <div className="flex items-center gap-1 text-xs"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /><span>{unit.avg_rating}</span></div>}
                    </div>
                  </div>
                  <div className="text-sm space-y-1 mb-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">Weekday</span><span className="font-medium">{formatCurrency(unit.base_price)}/mlm</span></div>
                    {unit.weekend_price && <div className="flex justify-between"><span className="text-muted-foreground">Weekend</span><span className="font-medium">{formatCurrency(unit.weekend_price)}/mlm</span></div>}
                    <div className="flex justify-between text-xs text-muted-foreground"><span>{unit.capacity} org • {unit.bed_count || '-'} kamar • {unit.size_m2 || '-'}m²</span></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenForm(unit)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => openGallery(unit)}><Image className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(unit.id)} disabled={deleting === unit.id}>{deleting === unit.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Unit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingUnit ? 'Edit Unit' : 'Tambah Unit Baru'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Nama Unit *</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tipe</Label><Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}><SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger><SelectContent><SelectItem value="Villa">Villa</SelectItem><SelectItem value="Kamar">Kamar</SelectItem><SelectItem value="Homestay">Homestay</SelectItem></SelectContent></Select></div>
              <div><Label>Kapasitas</Label><Input type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} placeholder="Jumlah orang" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Harga Weekday (Rp) *</Label><Input type="number" value={formData.base_price} onChange={(e) => setFormData({...formData, base_price: e.target.value})} required /></div>
              <div><Label>Harga Weekend (Rp)</Label><Input type="number" value={formData.weekend_price} onChange={(e) => setFormData({...formData, weekend_price: e.target.value})} placeholder="Lebih tinggi dari weekday" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Kamar Tidur</Label><Input type="number" value={formData.bed_count} onChange={(e) => setFormData({...formData, bed_count: e.target.value})} /></div>
              <div><Label>Kamar Mandi</Label><Input type="number" value={formData.bathroom_count} onChange={(e) => setFormData({...formData, bathroom_count: e.target.value})} /></div>
              <div><Label>Ukuran (m²)</Label><Input type="number" value={formData.size_m2} onChange={(e) => setFormData({...formData, size_m2: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Min Malam</Label><Input type="number" value={formData.min_nights} onChange={(e) => setFormData({...formData, min_nights: e.target.value})} /></div>
              <div><Label>Max Malam</Label><Input type="number" value={formData.max_nights} onChange={(e) => setFormData({...formData, max_nights: e.target.value})} placeholder="Unlimited" /></div>
            </div>
            <div><Label>Deskripsi</Label><Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
            <div><Label>URL Foto Utama</Label><Input value={formData.photo_url} onChange={(e) => setFormData({...formData, photo_url: e.target.value})} placeholder="https://..." /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="rounded" /><Label>Unit Aktif</Label></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button><Button type="submit" disabled={submitting}>{submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</> : 'Simpan'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gallery Dialog */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Gallery - {galleryUnit?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="URL foto baru" value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)} />
              <Button onClick={addPhoto} disabled={!newPhotoUrl}>Tambah</Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {galleryPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img src={photo.photo_url} alt="" className="w-full h-24 object-cover rounded-lg" />
                  <button onClick={() => deletePhoto(photo.id)} className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {galleryPhotos.length === 0 && <p className="col-span-3 text-center text-muted-foreground py-4 text-sm">Belum ada foto</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
