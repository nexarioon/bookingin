import { useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Phone, Home } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function BookingSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const bookingCode = searchParams.get('code')
  const customerName = searchParams.get('name')
  const unitName = searchParams.get('unit')
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')
  const totalPrice = searchParams.get('total')

  useEffect(() => {
    if (!bookingCode) {
      navigate('/')
    }
  }, [bookingCode, navigate])

  if (!bookingCode) {
    return null
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const generateWhatsAppUrl = () => {
    const message = `Halo Admin, saya ingin melakukan konfirmasi booking.

Booking ID: #${bookingCode}
Nama: ${customerName}
Unit: ${unitName}
Tanggal: ${startDate} - ${endDate}
Total: ${formatCurrency(totalPrice)}

Apakah bisa dibantu untuk proses pembayarannya?`

    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/6281234567890?text=${encodedMessage}`
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-20 w-20 text-success mx-auto mb-6" />
          
          <h1 className="text-2xl font-bold mb-2">Pemesanan Berhasil!</h1>
          <p className="text-muted-foreground mb-6">
            Terima kasih telah melakukan pemesanan. Silakan konfirmasi via WhatsApp.
          </p>

          <div className="bg-muted rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Booking ID:</span>
                <span className="font-mono font-bold">#{bookingCode}</span>
              </div>
              {customerName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama:</span>
                  <span>{customerName}</span>
                </div>
              )}
              {unitName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit:</span>
                  <span>{unitName}</span>
                </div>
              )}
              {startDate && endDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal:</span>
                  <span>{startDate} - {endDate}</span>
                </div>
              )}
              {totalPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold">{formatCurrency(totalPrice)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full" size="lg" asChild>
              <a href={generateWhatsAppUrl()} target="_blank" rel="noopener">
                <Phone className="mr-2 h-4 w-4" />
                Konfirmasi via WhatsApp
              </a>
            </Button>
            
            <Button variant="outline" className="w-full" asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Kembali ke Beranda
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
