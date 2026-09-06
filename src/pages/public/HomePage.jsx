import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Home, Calendar, Phone, MapPin, Star, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/utils/whatsapp'

export default function HomePage() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [property, setProperty] = useState(null)

  useEffect(() => {
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/units')
      const data = await response.json()
      setUnits(data.units || [])
    } catch (error) {
      console.error('Failed to fetch units:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Villa Kuningan</span>
            </div>
            <nav className="flex items-center gap-4">
              <a href="#units" className="text-sm hover:text-primary">Kamar & Villa</a>
              <a href="#location" className="text-sm hover:text-primary">Lokasi</a>
              <a href="#contact" className="text-sm hover:text-primary">Kontak</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4">Homestay & Villa</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Nikmati Liburan di Kuningan
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Temukan penginapan nyaman dengan pemandangan alam yang indah. 
              Booking mudah, cepat, dan tanpa ribet.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild>
                <a href="#units">Lihat Kamar & Villa</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener">
                  <Phone className="mr-2 h-4 w-4" />
                  Hubungi Kami
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Villa & Kamar</h3>
              <p className="text-sm text-muted-foreground">Pilihan penginapan lengkap</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Fasilitas Lengkap</h3>
              <p className="text-sm text-muted-foreground">AC, WiFi, Kolam Renang</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Lokasi Strategis</h3>
              <p className="text-sm text-muted-foreground">Dekat wisata Kuningan</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Booking Instan</h3>
              <p className="text-sm text-muted-foreground">Cek ketersediaan real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Units Section */}
      <section id="units" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Kamar & Villa</h2>
            <p className="text-muted-foreground">Pilih penginapan yang sesuai dengan kebutuhan Anda</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-muted animate-pulse" />
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : units.length === 0 ? (
            <Card className="p-12 text-center">
              <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum Ada Kamar</h3>
              <p className="text-muted-foreground">Kamar akan segera tersedia</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {units.map((unit) => (
                <UnitCard key={unit.id} unit={unit} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Location */}
      <section id="location" className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Lokasi Kami</h2>
            <p className="text-muted-foreground mb-6">
              Terletak di jantung Kuningan, dekat dengan berbagai tempat wisata
            </p>
            <div className="bg-card rounded-lg p-6 text-left">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold">Villa Kuningan Indah</p>
                  <p className="text-sm text-muted-foreground">Jl. Raya Kuningan No. 123, Kuningan, Jawa Barat</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Dekat dengan:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Wisata Alam Ciremai</li>
                    <li>• Curug/Curug Putri</li>
                    <li>• Pemandian Air Panas</li>
                  </ul>
                </div>
                <div>
                  <p className="text-muted-foreground">Fasilitas:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Kolam Renang</li>
                    <li>• Area Parkir Luas</li>
                    <li>• Taman Bermain</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Butuh Bantuan?</h2>
            <p className="text-muted-foreground mb-6">
              Hubungi kami via WhatsApp untuk pertanyaan dan reservasi
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener">
                  <Phone className="mr-2 h-4 w-4" />
                  Chat WhatsApp
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="tel:6281234567890">
                  📞 Telepon
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 Villa Kuningan Indah. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function UnitCard({ unit }) {
  const getDefaultImage = (type) => {
    if (type === 'Villa') {
      return 'https://images.unsplash.com/photo-1499793983394-12dec6520863?w=800&auto=format&fit=crop'
    }
    if (type === 'Homestay') {
      return 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&auto=format&fit=crop'
    }
    return 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop'
  }

  return (
    <Link to={`/unit/${unit.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="relative h-48 bg-muted overflow-hidden">
          <img 
            src={unit.photo_url || getDefaultImage(unit.type)} 
            alt={unit.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <Badge 
            variant={unit.is_active ? "success" : "secondary"} 
            className="absolute top-2 right-2"
          >
            {unit.is_active ? 'Tersedia' : 'Penuh'}
          </Badge>
          {unit.type && (
            <Badge variant="secondary" className="absolute top-2 left-2">
              {unit.type}
            </Badge>
          )}
        </div>
        <CardContent className="p-6">
          {unit.property_name && (
            <p className="text-xs text-muted-foreground mb-1">{unit.property_name}</p>
          )}
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
            {unit.name}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{unit.capacity} orang</span>
            </div>
            {unit.avg_rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span>{unit.avg_rating} ({unit.review_count})</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(unit.base_price)}
              </span>
              <span className="text-sm text-muted-foreground">/malam</span>
            </div>
            <Button size="sm">Pesan</Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
