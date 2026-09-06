export function generateWhatsAppUrl(phoneNumber, bookingData) {
  const message = `Halo Admin, saya ingin melakukan konfirmasi booking.

Booking ID: #${bookingData.bookingCode}
Nama: ${bookingData.customerName}
Unit: ${bookingData.unitName}
Tanggal: ${bookingData.startDate} - ${bookingData.endDate}
Total: Rp${bookingData.totalPrice.toLocaleString('id-ID')}

Apakah bisa dibantu untuk proses pembayarannya?`

  const encodedMessage = encodeURIComponent(message)
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateShort(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
