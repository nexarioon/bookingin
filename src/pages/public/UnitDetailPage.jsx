import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Users, Phone, CheckCircle, Home, Star, Wifi, Car as CarIcon, ChevronLeft, ChevronRight, MapPin, Bed, Bath, Maximize, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, generateWhatsAppUrl } from '@/utils/whatsapp'
import { formatDateForAPI } from '@/utils/date'

export default function UnitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [unit, setUnit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [priceInfo, setPriceInfo] = useState(null)
  const [isAvailable, setIsAvailable] = useState(null)
  
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState('')
  
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingData, setBookingData] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showGallery, setShowGallery] = useState(false)
  
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1)
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [calendarData, setCalendarData] = useState([])
  const [loadingCalendar, setLoadingCalendar] = useState(false)

  useEffect(() => { fetchUnit() }, [id])
  useEffect(() => { fetchCalendar() }, [id, calendarMonth, calendarYear])

  const fetchUnit = async () => {
    try {
      const response = await fetch(`/api/units/${id}`)
      const data = await response.json()
      setUnit(data.unit)
    } catch (error) {
      console.error('Failed to fetch unit:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCalendar = async () => {
    setLoadingCalendar(true)
    try {
      const response = await fetch(`/api/calendar/${id}?month=${calendarMonth}&year=${calendarYear}`)
      const data = await response.json()
      setCalendarData(data.calendar || [])
    } catch (error) {
      console.error('Failed to fetch calendar:', error)
    } finally {
      setLoadingCalendar(false)
    }
  }

  const handleDateClick = (day) => {
    if (!day.isAvailable) return
    
    if (!startDate || (startDate && endDate)) {
      // First click or reset: set start date only
      setStartDate(day.date)
      setEndDate('')
      setIsAvailable(null)
      setPriceInfo(null)
      setShowBookingForm(false)
    } else {
      // Second click: set end date
      if (day.date <= startDate) {
        // If clicked date before start, reset
        setStartDate(day.date)
        setEndDate('')
        return
      }
      setEndDate(day.date)
      setShowBookingForm(true)
    }
  }

  const checkAvailability = async () => {
    if (!startDate || !endDate) return
    setCheckingAvailability(true)
    setIsAvailable(null)
    setPriceInfo(null)
    try {
      const response = await fetch(`/api/availability?unit_id=${id}&start_date=${startDate}&end_date=${endDate}`)
      const data = await response.json()
      setIsAvailable(data.available)
      setPriceInfo(data.price)
      if (data.available) setShowBookingForm(true)
    } catch (error) {
      setIsAvailable(false)
    } finally {
      setCheckingAvailability(false)
    }
  }

  const validatePromo = async () => {
    if (!promoCode || !priceInfo) return
    setPromoError('')
    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, amount: priceInfo.total_base })
      })
      const data = await response.json()
      if (response.ok) {
        setPromoDiscount(data.promo.discount)
      } else {
        setPromoError(data.error)
        setPromoDiscount(0)
      }
    } catch (error) {
      setPromoError('Gagal validasi promo')
    }
  }

  const handleSubmitBooking = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: parseInt(id), start_date: startDate, end_date: endDate,
          customer_name: customerName, customer_phone: customerPhone, customer_email: customerEmail,
          guest_count: guestCount ? parseInt(guestCount) : null,
          special_requests: specialRequests, promo_code: promoDiscount > 0 ? promoCode : null
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setBookingData(data.booking)
      setShowBookingForm(false)
      setBookingSuccess(true)
    } catch (error) {
      addToast({ variant: 'destructive', title: 'Gagal', description: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  const getNights = () => {
    if (!startDate || !endDate) return 0
    return Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000)
  }

  const getFinalTotal = () => {
    if (!priceInfo) return 0
    return priceInfo.total_base + (priceInfo.weekend_surcharge || 0) - promoDiscount
  }

  const getGalleryImages = () => {
    if (unit?.gallery?.length) return unit.gallery.map(g => g.photo_url)
    if (unit?.photo_url) return [unit.photo_url]
    return ['https://images.unsplash.com/photo-1499793983394-12dec6520863?w=1200&auto=format&fit=crop']
  }

  const getAmenityIcon = (amenity) => {
    const lower = amenity.toLowerCase()
    if (lower.includes('wifi')) return <Wifi className="h-4 w-4" />
    if (lower.includes('ac') || lower.includes(' pendingdingin')) return <CarIcon className="h-4 w-4" />
    if (lower.includes('parkir') || lower.includes('parking')) return <CarIcon className="h-4 w-4" />
    return <Home className="h-4 w-4" />
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  if (!unit) return <div className="min-h-screen flex items-center justify-center"><Card className="p-8 text-center"><h2 className="text-xl font-semibold mb-2">Unit Tidak Ditemukan</h2><Button onClick={() => navigate('/')}>Kembali</Button></Card></div>

  const galleryImages = getGalleryImages()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2"><ArrowLeft className="h-4 w-4" />Kembali</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <Card>
              <div className="relative h-64 md:h-96 bg-muted rounded-t-xl overflow-hidden">
                <img src={galleryImages[currentImageIndex]} alt={unit.name} className="w-full h-full object-cover cursor-pointer" onClick={() => setShowGallery(true)} />
                {galleryImages.length > 1 && (
                  <>
                    <Button variant="secondary" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => i === 0 ? galleryImages.length - 1 : i - 1) }}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="secondary" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i => i === galleryImages.length - 1 ? 0 : i + 1) }}><ChevronRight className="h-4 w-4" /></Button>
                  </>
                )}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {galleryImages.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === currentImageIndex ? 'bg-primary' : 'bg-white/50'}`} />)}
                </div>
                {unit.type && <Badge variant="secondary" className="absolute top-4 left-4">{unit.type}</Badge>}
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    {unit.property_name && <p className="text-sm text-muted-foreground mb-1">{unit.property_name}</p>}
                    <h1 className="text-2xl font-bold mb-2">{unit.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1"><Users className="h-4 w-4" /><span>{unit.capacity} orang</span></div>
                      {unit.bed_count && <div className="flex items-center gap-1"><Bed className="h-4 w-4" /><span>{unit.bed_count} kamar</span></div>}
                      {unit.bathroom_count && <div className="flex items-center gap-1"><Bath className="h-4 w-4" /><span>{unit.bathroom_count} kamar mandi</span></div>}
                      {unit.size_m2 && <div className="flex items-center gap-1"><Maximize className="h-4 w-4" /><span>{unit.size_m2} m²</span></div>}
                      {unit.avg_rating && <div className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /><span>{unit.avg_rating} ({unit.review_count} ulasan)</span></div>}
                    </div>
                  </div>
                  <Badge variant={unit.is_active ? "success" : "secondary"}>{unit.is_active ? 'Tersedia' : 'Penuh'}</Badge>
                </div>
                
                {unit.description && <p className="text-muted-foreground mb-6 whitespace-pre-line">{unit.description}</p>}

                {/* Amenities */}
                {unit.amenities?.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Fasilitas</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {unit.amenities.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">{getAmenityIcon(a.amenity_name || a)}</div>
                          <span>{a.amenity_name || a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold mb-4">Harga</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Weekday (Senin-Kamis)</span><span>{formatCurrency(unit.base_price)}/malam</span></div>
                    <div className="flex justify-between"><span>Weekend (Jumat-Minggu)</span><span>{formatCurrency(unit.weekend_price || unit.base_price)}/malam</span></div>
                  </div>
                </div>

                {/* Availability Calendar */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />Ketersediaan Kamar
                  </h3>
                  
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (calendarMonth === 1) { setCalendarMonth(12); setCalendarYear(y => y - 1) }
                      else setCalendarMonth(m => m - 1)
                    }}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-sm font-medium">
                      {new Date(calendarYear, calendarMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (calendarMonth === 12) { setCalendarMonth(1); setCalendarYear(y => y + 1) }
                      else setCalendarMonth(m => m + 1)
                    }}><ChevronRight className="h-4 w-4" /></Button>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div><span>Tersedia</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-foreground"></div><span>Sudah dipesan</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-700"></div><span>Dipilih</span></div>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-0 mb-1">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                      <div key={d} className="text-center text-[11px] text-muted-foreground py-1">{d}</div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  {loadingCalendar ? (
                    <div className="h-40 bg-muted animate-pulse rounded" />
                  ) : (
                    <div className="grid grid-cols-7 gap-0">
                      {Array.from({ length: new Date(calendarYear, calendarMonth - 1, 1).getDay() }, (_, i) => (
                        <div key={`empty-${i}`} className="h-9" />
                      ))}
                      
                      {calendarData.map((day) => {
                        const isStart = day.date === startDate
                        const isEnd = day.date === endDate
                        const inRange = startDate && endDate && day.date > startDate && day.date < endDate
                        
                        let cellClass = ''
                        if (!day.isAvailable) {
                          cellClass = 'text-foreground font-medium cursor-not-allowed'
                        } else if (isStart || isEnd) {
                          cellClass = 'bg-green-700 text-white font-semibold rounded cursor-pointer'
                        } else if (inRange) {
                          cellClass = 'bg-green-100 text-green-800 cursor-pointer'
                        } else if (!startDate) {
                          cellClass = 'text-green-600 cursor-pointer hover:bg-green-50 rounded'
                        } else {
                          cellClass = 'text-green-600 cursor-pointer hover:bg-green-50 rounded'
                        }

                        return (
                          <div
                            key={day.date}
                            onClick={() => handleDateClick(day)}
                            className={`h-9 flex items-center justify-center text-sm ${cellClass}`}
                            title={isStart ? 'Check-in' : isEnd ? 'Check-out' : `${day.date}: ${day.isAvailable ? 'Klik untuk pesan' : 'Tidak tersedia'}`}
                          >
                            {day.day}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-3">
                    {!startDate ? 'Klik tanggal hijau untuk pilih check-in.' : !endDate ? 'Klik tanggal lagi untuk pilih check-out.' : 'Kedua tanggal sudah dipilih. Silakan isi form pemesanan.'}
                  </p>
                </div>

                {/* Reviews */}
                {unit.reviews?.length > 0 && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><MessageSquare className="h-5 w-5" />Ulasan ({unit.reviews.length})</h3>
                    <div className="space-y-4">
                      {unit.reviews.map((r) => (
                        <div key={r.id} className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">{r.customer_name?.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-medium">{r.is_anonymous ? 'Anonim' : r.customer_name}</p>
                              <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />)}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Map */}
                {unit.latitude && unit.longitude && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="h-5 w-5" />Lokasi</h3>
                    <div className="rounded-lg overflow-hidden h-48 bg-muted">
                      <a href={`https://www.google.com/maps?q=${unit.latitude},${unit.longitude}`} target="_blank" rel="noopener" className="block w-full h-full relative">
                        <img src={`https://maps.googleapis.com/maps/api/staticmap?center=${unit.latitude},${unit.longitude}&zoom=15&size=600x300&markers=color:red%7C${unit.latitude},${unit.longitude}&key=demo`} alt="Map" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                        <div className="hidden w-full h-full items-center justify-center bg-muted absolute inset-0">
                          <div className="text-center"><MapPin className="h-12 w-12 mx-auto text-primary mb-2" /><p className="text-sm text-muted-foreground">{unit.property_address}</p><p className="text-xs text-primary mt-1">Klik untuk buka di Google Maps</p></div>
                        </div>
                      </a>
                    </div>
                  </div>
                )}

                {/* Policies */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold mb-4">Kebijakan</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Check-in: 14:00 WIB</li>
                    <li>• Check-out: 12:00 WIB</li>
                    <li>• Minimal menginap: {unit.min_nights || 1} malam</li>
                    {unit.max_nights && <li>• Maksimal menginap: {unit.max_nights} malam</li>}
                    <li>• Pembatalan gratis hingga 24 jam sebelum check-in</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader><CardTitle>Pesan Sekarang</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <span className="text-3xl font-bold text-primary">{formatCurrency(unit.base_price)}</span>
                  <span className="text-muted-foreground">/malam</span>
                  {unit.weekend_price && unit.weekend_price > unit.base_price && (
                    <p className="text-xs text-muted-foreground mt-1">Weekend: {formatCurrency(unit.weekend_price)}/malam</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="start-date">Check-in</Label>
                    <Input id="start-date" type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setIsAvailable(null); setPriceInfo(null) }} min={formatDateForAPI(new Date())} />
                  </div>
                  <div>
                    <Label htmlFor="end-date">Check-out</Label>
                    <Input id="end-date" type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setIsAvailable(null); setPriceInfo(null) }} min={startDate || formatDateForAPI(new Date())} />
                  </div>

                  {priceInfo && (
                    <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between"><span>{priceInfo.nights} malam × {formatCurrency(priceInfo.base_price)}</span><span>{formatCurrency(priceInfo.total_base)}</span></div>
                      {priceInfo.weekend_surcharge > 0 && <div className="flex justify-between text-orange-600"><span>Surcharge weekend</span><span>+{formatCurrency(priceInfo.weekend_surcharge)}</span></div>}
                      {priceInfo.seasonal_surcharge > 0 && <div className="flex justify-between text-red-600"><span>Seasonal surcharge</span><span>+{formatCurrency(priceInfo.seasonal_surcharge)}</span></div>}
                      <div className="flex justify-between font-semibold border-t pt-2"><span>Total</span><span className="text-primary">{formatCurrency(priceInfo.total_price)}</span></div>
                    </div>
                  )}

                  {isAvailable === false && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">Maaf, kamar tidak tersedia pada tanggal tersebut.</div>}

                  <Button className="w-full" size="lg" onClick={checkAvailability} disabled={!startDate || !endDate || checkingAvailability}>
                    {checkingAvailability ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>Mengecek...</> : 'Cek Ketersediaan'}
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <a href="https://wa.me/6281234567890" target="_blank" rel="noopener"><Phone className="mr-2 h-4 w-4" />Tanya via WhatsApp</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Gallery Dialog */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="sm:max-w-[800px] p-0">
          <div className="relative">
            <img src={galleryImages[currentImageIndex]} alt="" className="w-full h-[500px] object-cover" />
            {galleryImages.length > 1 && (
              <>
                <Button variant="secondary" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2" onClick={() => setCurrentImageIndex(i => i === 0 ? galleryImages.length - 1 : i - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="secondary" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setCurrentImageIndex(i => i === galleryImages.length - 1 ? 0 : i + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Form Dialog */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Formulir Pemesanan</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitBooking} className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-semibold">{unit.name}</p>
            </div>
            
            {/* Check-in / Check-out */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Check-in *</Label>
                <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setIsAvailable(null); setPriceInfo(null) }} required />
              </div>
              <div>
                <Label>Check-out *</Label>
                <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setIsAvailable(null); setPriceInfo(null) }} min={startDate || undefined} required />
              </div>
            </div>
            {startDate && !endDate && <p className="text-xs text-muted-foreground">Pilih tanggal check-out</p>}
            
            <div><Label>Nama Lengkap *</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Masukkan nama" required /></div>
            <div><Label>Nomor WhatsApp *</Label><Input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08xxxxxxxxxx" required /></div>
            <div><Label>Email (Opsional)</Label><Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@example.com" /></div>
            <div><Label>Jumlah Tamu</Label><Input type="number" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder={`Maks ${unit.capacity} orang`} min="1" max={unit.capacity} /></div>
            <div>
              <Label>Kode Promo</Label>
              <div className="flex gap-2">
                <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Masukkan kode" />
                <Button type="button" variant="outline" onClick={validatePromo} disabled={!promoCode}>Apply</Button>
              </div>
              {promoError && <p className="text-xs text-destructive mt-1">{promoError}</p>}
              {promoDiscount > 0 && <p className="text-xs text-success mt-1">Diskon: -{formatCurrency(promoDiscount)}</p>}
            </div>
            <div><Label>Permintaan Khusus</Label><Input value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} placeholder="Contoh: want extra pillows" /></div>
            
            {priceInfo && (
              <div className="p-3 bg-primary/5 rounded-lg space-y-1 text-sm">
                <p className="text-xs text-muted-foreground mb-2">{getNights()} malam</p>
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(priceInfo?.total_base)}</span></div>
                {priceInfo?.weekend_surcharge > 0 && <div className="flex justify-between"><span>Weekend surcharge</span><span>+{formatCurrency(priceInfo.weekend_surcharge)}</span></div>}
                {promoDiscount > 0 && <div className="flex justify-between text-success"><span>Diskon promo</span><span>-{formatCurrency(promoDiscount)}</span></div>}
                <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span className="text-primary">{formatCurrency(getFinalTotal())}</span></div>
              </div>
            )}

            {startDate && endDate && !isAvailable && !checkingAvailability && (
              <Button type="button" className="w-full" variant="outline" onClick={checkAvailability} disabled={checkingAvailability}>
                {checkingAvailability ? 'Mengecek...' : 'Cek Ketersediaan'}
              </Button>
            )}
            {checkingAvailability && <p className="text-xs text-muted-foreground text-center">Mengecek ketersediaan...</p>}
            {isAvailable === true && priceInfo && (
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>Memproses...</> : 'Kirim Pemesanan'}
              </Button>
            )}
            {isAvailable === false && <p className="text-sm text-destructive text-center">Kamar tidak tersedia pada tanggal tersebut.</p>}
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={bookingSuccess} onOpenChange={setBookingSuccess}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="text-center py-4">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Pemesanan Berhasil!</h2>
            <p className="text-muted-foreground mb-2">Booking ID: <span className="font-mono font-bold">#{bookingData?.booking_code}</span></p>
            <p className="text-sm text-muted-foreground mb-6">Silakan konfirmasi via WhatsApp.</p>
            <Button className="w-full" size="lg" asChild>
              <a href={generateWhatsAppUrl('6281234567890', { bookingCode: bookingData?.booking_code, customerName, unitName: unit.name, startDate, endDate, totalPrice: getFinalTotal() })} target="_blank" rel="noopener">
                <Phone className="mr-2 h-4 w-4" />Konfirmasi via WhatsApp
              </a>
            </Button>
            <Button variant="ghost" className="w-full mt-2" onClick={() => navigate('/')}>Kembali ke Beranda</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
