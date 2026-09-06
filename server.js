import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'booking-ku-secret-key-2026'

app.use(cors())
app.use(express.json({ limit: '10mb' }))

const db = new Database(path.join(__dirname, 'booking.db'))
db.pragma('journal_mode = WAL')

// ========== DATABASE SCHEMA ==========
db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'homestay',
    phone TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    type TEXT,
    base_price REAL NOT NULL,
    weekend_price REAL,
    min_nights INTEGER DEFAULT 1,
    max_nights INTEGER,
    capacity INTEGER,
    bed_count INTEGER,
    bathroom_count INTEGER,
    size_m2 INTEGER,
    description TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS unit_gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    photo_url TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS unit_amenities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    amenity_name TEXT NOT NULL,
    icon TEXT,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    id_number TEXT,
    notes TEXT,
    total_bookings INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_code TEXT UNIQUE NOT NULL,
    property_id INTEGER NOT NULL DEFAULT 1,
    unit_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    nights INTEGER NOT NULL,
    base_price REAL NOT NULL,
    weekend_surcharge REAL DEFAULT 0,
    promo_discount REAL DEFAULT 0,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING','CONFIRMED','ONGOING','COMPLETED','CANCELLED','REJECTED')),
    payment_status TEXT DEFAULT 'UNPAID' CHECK(payment_status IN ('UNPAID','PARTIAL','PAID')),
    payment_amount REAL DEFAULT 0,
    payment_method TEXT,
    promo_code TEXT,
    notes TEXT,
    guest_count INTEGER,
    special_requests TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (unit_id) REFERENCES units(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    method TEXT,
    reference TEXT,
    updated_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER UNIQUE NOT NULL,
    unit_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (unit_id) REFERENCES units(id)
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
    discount_value REAL NOT NULL,
    min_booking_amount REAL DEFAULT 0,
    max_discount REAL,
    start_date DATE,
    end_date DATE,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS seasonal_pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_multiplier REAL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL DEFAULT 1,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

// ========== SEED DATA ==========
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count
if (userCount === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10)
  const users = [
    { email: 'admin@villakuningan.com', name: 'Budi Santoso', role: 'admin' },
    { email: 'manager@villakuningan.com', name: 'Siti Rahayu', role: 'manager' },
    { email: 'staff@villakuningan.com', name: 'Andi Wijaya', role: 'staff' },
    { email: 'resepsionis@villakuningan.com', name: 'Maya Putri', role: 'staff' },
  ]
  const insertUser = db.prepare('INSERT INTO users (property_id, email, password_hash, name, role) VALUES (1, ?, ?, ?, ?)')
  for (const u of users) insertUser.run(u.email, hashedPassword, u.name, u.role)
}

const propertyCount = db.prepare('SELECT COUNT(*) as count FROM properties').get().count
if (propertyCount === 0) {
  // Properties
  db.prepare('INSERT INTO properties (id, name, type, phone, address, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)').run(1, 'Villa Kuningan Indah', 'homestay', '6281234567890', 'Jl. Raya Kuningan No. 123, Kuningan, Jawa Barat', -6.9821, 108.4835)
  db.prepare('INSERT INTO properties (id, name, type, phone, address, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)').run(2, 'Villa Ciremai Resort', 'homestay', '6281234567891', 'Jl. Ciremai No. 45, Kuningan, Jawa Barat', -6.9750, 108.4900)
  db.prepare('INSERT INTO properties (id, name, type, phone, address, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)').run(3, 'Homestay Putri Gunung', 'homestay', '6281234567892', 'Jl. Putri Gunung No. 8, Kuningan, Jawa Barat', -6.9900, 108.4750)

  // Units with detailed info
  const allUnits = [
    // Property 1
    { pid: 1, name: 'Villa Putri Gunung', type: 'Villa', price: 850000, weekend: 1000000, capacity: 8, bed: 3, bath: 2, size: 120, desc: 'Villa mewah dengan pemandangan Gunung Ciremai, 3 kamar tidur, kolam renang pribadi, dan halaman luas.', img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC', 'Kolam Renang', 'Dapur', 'TV', 'Parking', 'BBQ'] },
    { pid: 1, name: 'Villa Ciremai View', type: 'Villa', price: 750000, weekend: 900000, capacity: 6, bed: 2, bath: 2, size: 90, desc: 'Villa modern dengan view Gunung Ciremai, 2 kamar tidur, dapur lengkap, dan teras santai.', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC', 'Dapur', 'TV', 'Parking'] },
    { pid: 1, name: 'Villa Alam Asri', type: 'Villa', price: 600000, weekend: 750000, capacity: 6, bed: 2, bath: 1, size: 75, desc: 'Villa semi-modern dikelilingi kebun, 2 kamar tidur, cocok untuk keluarga.', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC', 'TV', 'Parking', 'Garden'] },
    { pid: 1, name: 'Kamar Deluxe', type: 'Kamar', price: 350000, weekend: 450000, capacity: 2, bed: 1, bath: 1, size: 25, desc: 'Kamar deluxe AC, TV, kamar mandi dalam, dan WiFi gratis.', img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC', 'TV', 'Kamar Mandi Dalam'] },
    { pid: 1, name: 'Kamar Standard', type: 'Kamar', price: 250000, weekend: 300000, capacity: 2, bed: 1, bath: 1, size: 20, desc: 'Kamar nyaman dengan AC dan kamar mandi bersama.', img: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC', 'TV'] },
    { pid: 1, name: 'Kamar Family', type: 'Kamar', price: 500000, weekend: 600000, capacity: 4, bed: 2, bath: 1, size: 35, desc: 'Kamar luas untuk keluarga, 2 tempat tidur, AC, kamar mandi dalam.', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC', 'TV', 'Kamar Mandi Dalam', 'Extra Bed'] },
    // Property 2
    { pid: 2, name: 'Villa Danau', type: 'Villa', price: 950000, weekend: 1200000, capacity: 10, bed: 4, bath: 3, size: 150, desc: 'Villa premium tepi danau, 4 kamar tidur, private dock, dan pemandangan danau.', img: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC', 'Kolam Renang', 'Dapur', 'TV', 'Parking', 'Danau', 'Dock'] },
    { pid: 2, name: 'Villa Taman Sari', type: 'Villa', price: 700000, weekend: 850000, capacity: 6, bed: 2, bath: 2, size: 85, desc: 'Villa dengan taman tropis, 2 kamar tidur, kolam renang share, dan BBQ area.', img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC', 'TV', 'Parking', 'BBQ', 'Garden'] },
    { pid: 2, name: 'Villa Sunset', type: 'Villa', price: 650000, weekend: 800000, capacity: 4, bed: 1, bath: 1, size: 55, desc: 'Villa intimate untuk pasangan, 1 kamar tidur, view sunset, dan jacuzzi.', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC', 'TV', 'Jacuzzi', 'Sunset View'] },
    { pid: 2, name: 'Kamar Garden', type: 'Kamar', price: 300000, weekend: 380000, capacity: 2, bed: 1, bath: 1, size: 22, desc: 'Kamar dengan view taman, AC, kamar mandi dalam, dan sarapan included.', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC', 'TV', 'Sarapan', 'Garden View'] },
    { pid: 2, name: 'Kamar Pool Access', type: 'Kamar', price: 400000, weekend: 500000, capacity: 2, bed: 1, bath: 1, size: 28, desc: 'Kamar langsung akses kolam renang, AC, TV, dan kamar mandi dalam.', img: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC', 'TV', 'Kolam Renang', 'Kamar Mandi Dalam'] },
    // Property 3
    { pid: 3, name: 'Homestay Gunung View', type: 'Homestay', price: 450000, weekend: 550000, capacity: 4, bed: 2, bath: 1, size: 45, desc: 'Homestay sederhana dengan view gunung, 1 kamar tidur, dapur kecil, dan teras.', img: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&auto=format&fit=crop', amenities: ['WiFi', 'Dapur', 'Teras', 'Gunung View'] },
    { pid: 3, name: 'Homestay Teh Botol', type: 'Homestay', price: 350000, weekend: 420000, capacity: 3, bed: 1, bath: 1, size: 35, desc: 'Homestay tradisional dengan nuansa alam, 1 kamar tidur, dan halaman asri.', img: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&auto=format&fit=crop', amenities: ['WiFi', 'Garden', 'Teras', 'Tradisional'] },
    { pid: 3, name: 'Homestay Ciremai', type: 'Homestay', price: 500000, weekend: 620000, capacity: 5, bed: 2, bath: 2, size: 60, desc: 'Homestay modern minimalis, 2 kamar tidur, WiFi, dan dekat jalur pendakian.', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC', 'Dapur', 'TV', 'Dekat Pendakian'] },
    { pid: 3, name: 'Kamar Asri', type: 'Kamar', price: 200000, weekend: 250000, capacity: 2, bed: 1, bath: 1, size: 18, desc: 'Kamar budget friendly, bersih, nyaman, AC, dan kamar mandi bersama.', img: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC'] },
    { pid: 3, name: 'Kamar Merbabu', type: 'Kamar', price: 275000, weekend: 340000, capacity: 2, bed: 1, bath: 1, size: 22, desc: 'Kamar dengan dekorasi kayu, AC, TV, dan pemandangan kebun.', img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop', amenities: ['WiFi', 'AC', 'TV', 'Garden View'] },
  ]

  const insertUnit = db.prepare('INSERT INTO units (property_id, name, type, base_price, weekend_price, capacity, bed_count, bathroom_count, size_m2, description, photo_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)')
  const insertAmenity = db.prepare('INSERT INTO unit_amenities (unit_id, amenity_name) VALUES (?, ?)')
  const insertGallery = db.prepare('INSERT INTO unit_gallery (unit_id, photo_url, sort_order) VALUES (?, ?, ?)')

  for (const u of allUnits) {
    const result = insertUnit.run(u.pid, u.name, u.type, u.price, u.weekend, u.capacity, u.bed, u.bath, u.size, u.desc, u.img)
    const unitId = result.lastInsertRowid
    for (const a of u.amenities) insertAmenity.run(unitId, a)
    // Add 3 gallery images per unit (same image for demo)
    for (let i = 0; i < 3; i++) insertGallery.run(unitId, u.img, i)
  }

  // Promo codes
  const promos = [
    { code: 'WELCOME10', desc: 'Diskon 10% untuk pelanggan baru', type: 'percentage', value: 10, min: 500000, max: 100000, limit: 100 },
    { code: 'HEMAT50RB', desc: 'Diskon Rp 50.000', type: 'fixed', value: 50000, min: 300000, max: 50000, limit: 50 },
    { code: 'WEEKEND20', desc: 'Diskon 20% weekend', type: 'percentage', value: 20, min: 0, max: 200000, limit: 30 },
    { code: 'LONGSTAY', desc: 'Diskon 15% menginap 3+ malam', type: 'percentage', value: 15, min: 0, max: 150000, limit: 200 },
  ]
  const insertPromo = db.prepare('INSERT INTO promo_codes (code, description, discount_type, discount_value, min_booking_amount, max_discount, usage_limit) VALUES (?, ?, ?, ?, ?, ?, ?)')
  for (const p of promos) insertPromo.run(p.code, p.desc, p.type, p.value, p.min, p.max, p.limit)

  // Seed bookings
  const seedCustomers = [
    { name: 'Rudi Hartono', phone: '081234567890', email: 'rudi@gmail.com' },
    { name: 'Dewi Sari', phone: '081234567891', email: 'dewi@gmail.com' },
    { name: 'Ahmad Fauzi', phone: '081234567892', email: 'ahmad@gmail.com' },
    { name: 'Rina Wulandari', phone: '081234567893', email: 'rina@gmail.com' },
    { name: 'Bambang Setiawan', phone: '081234567894', email: 'bambang@gmail.com' },
    { name: 'Siti Nurhaliza', phone: '081234567895', email: 'siti@gmail.com' },
    { name: 'Dodi Sunaryo', phone: '081234567896', email: 'dodi@gmail.com' },
    { name: 'Ani Susanti', phone: '081234567897', email: 'ani@gmail.com' },
    { name: 'Hendra Kusuma', phone: '081234567898', email: 'hendra@gmail.com' },
    { name: 'Linda Agustina', phone: '081234567899', email: 'linda@gmail.com' },
  ]

  const insertCustomer = db.prepare('INSERT INTO customers (property_id, name, phone, email) VALUES (1, ?, ?, ?)')
  const customerIds = []
  for (const c of seedCustomers) { const r = insertCustomer.run(c.name, c.phone, c.email); customerIds.push(r.lastInsertRowid) }

  const today = new Date()
  const formatDate = (d) => d.toISOString().split('T')[0]
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

  const seedBookings = [
    { unitId: 1, custIdx: 0, daysAgo: 5, nights: 3, status: 'COMPLETED', payment: 'PAID', amount: 2550000 },
    { unitId: 1, custIdx: 1, daysAgo: 2, nights: 2, status: 'CONFIRMED', payment: 'PARTIAL', amount: 850000 },
    { unitId: 2, custIdx: 2, daysAgo: 0, nights: 2, status: 'PENDING', payment: 'UNPAID', amount: 0 },
    { unitId: 3, custIdx: 3, daysAgo: 1, nights: 3, status: 'ONGOING', payment: 'PAID', amount: 1800000 },
    { unitId: 4, custIdx: 4, daysAgo: -1, nights: 2, status: 'PENDING', payment: 'UNPAID', amount: 0 },
    { unitId: 5, custIdx: 5, daysAgo: -2, nights: 1, status: 'CONFIRMED', payment: 'PAID', amount: 250000 },
    { unitId: 6, custIdx: 6, daysAgo: -3, nights: 2, status: 'PENDING', payment: 'UNPAID', amount: 0 },
    { unitId: 7, custIdx: 7, daysAgo: 3, nights: 4, status: 'COMPLETED', payment: 'PAID', amount: 3800000 },
    { unitId: 8, custIdx: 0, daysAgo: 0, nights: 1, status: 'ONGOING', payment: 'PAID', amount: 700000 },
    { unitId: 9, custIdx: 2, daysAgo: -1, nights: 3, status: 'CONFIRMED', payment: 'PARTIAL', amount: 650000 },
    { unitId: 10, custIdx: 4, daysAgo: 1, nights: 2, status: 'COMPLETED', payment: 'PAID', amount: 600000 },
    { unitId: 11, custIdx: 6, daysAgo: -2, nights: 2, status: 'PENDING', payment: 'UNPAID', amount: 0 },
    { unitId: 12, custIdx: 1, daysAgo: 4, nights: 2, status: 'CANCELLED', payment: 'UNPAID', amount: 0 },
    { unitId: 13, custIdx: 3, daysAgo: -1, nights: 1, status: 'CONFIRMED', payment: 'PAID', amount: 350000 },
    { unitId: 14, custIdx: 5, daysAgo: 0, nights: 2, status: 'PENDING', payment: 'UNPAID', amount: 0 },
    { unitId: 15, custIdx: 8, daysAgo: -3, nights: 3, status: 'CONFIRMED', payment: 'PAID', amount: 1350000 },
    { unitId: 16, custIdx: 9, daysAgo: 2, nights: 2, status: 'COMPLETED', payment: 'PAID', amount: 550000 },
  ]

  const insertBooking = db.prepare('INSERT INTO bookings (booking_code, property_id, unit_id, customer_id, start_date, end_date, nights, base_price, total_price, status, payment_status, payment_amount, guest_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')

  for (let i = 0; i < seedBookings.length; i++) {
    const b = seedBookings[i]
    const start = addDays(today, b.daysAgo)
    const end = addDays(start, b.nights)
    const unit = db.prepare('SELECT base_price FROM units WHERE id = ?').get(b.unitId)
    const price = unit ? unit.base_price : 0
    const code = `BK-${String(1000 + i).padStart(4, '0')}`
    insertBooking.run(code, 1, b.unitId, customerIds[b.custIdx], formatDate(start), formatDate(end), b.nights, price, b.status === 'CANCELLED' ? 0 : price * b.nights, b.status, b.payment, b.amount, Math.floor(Math.random() * 4) + 1)
  }

  // Seed reviews
  const seedReviews = [
    { bookingIdx: 0, unitId: 1, name: 'Rudi Hartono', rating: 5, comment: 'Villa luar biasa! View Gunung Ciremai sangat indah. Fasilitas lengkap dan bersih. Pasti akan kembali lagi.' },
    { bookingIdx: 7, unitId: 7, name: 'Ani Susanti', rating: 5, comment: 'Villa Danau sempurna untuk family gathering. Anak-anak senang berenang di danau. Pelayanan ramah.' },
    { bookingIdx: 9, unitId: 10, name: 'Ahmad Fauzi', rating: 4, comment: 'Kamar nyaman, akses pool langsung. Sayang air agak dingin. Overall bagus.' },
    { bookingIdx: 10, unitId: 10, name: 'Bambang Setiawan', rating: 4, comment: 'Kamar Garden view taman asri. Sarapan enak. Harga worth it.' },
    { bookingIdx: 15, unitId: 15, name: 'Hendra Kusuma', rating: 5, comment: 'Homestay terbaik di Kuningan! Dekat jalur pendakian Ciremai. WiFi kencang.' },
    { bookingIdx: 16, unitId: 16, name: 'Linda Agustina', rating: 4, comment: 'Kamar Merbabu unik dengan dekorasi kayu. Bersih dan nyaman.' },
  ]

  const insertReview = db.prepare('INSERT INTO reviews (booking_id, unit_id, customer_name, rating, comment) VALUES (?, ?, ?, ?, ?)')
  const allBookings = db.prepare('SELECT id FROM bookings ORDER BY id').all()
  for (const r of seedReviews) {
    if (allBookings[r.bookingIdx]) insertReview.run(allBookings[r.bookingIdx].id, r.unitId, r.name, r.rating, r.comment)
  }

  // Seasonal pricing
  const insertSeason = db.prepare('INSERT INTO seasonal_pricing (unit_id, name, start_date, end_date, price_multiplier) VALUES (?, ?, ?, ?, ?)')
  insertSeason.run(1, 'Peak Season Natal/Tahun Baru', '2026-12-20', '2027-01-05', 1.5)
  insertSeason.run(1, 'High Season Libur Sekolah', '2026-06-15', '2026-07-31', 1.3)
}

// ========== HELPERS ==========
function generateBookingCode() {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `BK-${timestamp}${random}`
}

function calculatePrice(unitId, startDate, endDate, promoCode) {
  const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(unitId)
  if (!unit) return null

  const start = new Date(startDate)
  const end = new Date(endDate)
  const nights = Math.ceil((end - start) / 86400000)
  let totalBase = 0
  let weekendSurcharge = 0

  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(start)
    currentDate.setDate(currentDate.getDate() + i)
    const day = currentDate.getDay()
    if (day === 5 || day === 6 || day === 0) {
      weekendSurcharge += (unit.weekend_price || unit.base_price) - unit.base_price
      totalBase += unit.weekend_price || unit.base_price
    } else {
      totalBase += unit.base_price
    }
  }

  // Check seasonal pricing
  const seasonal = db.prepare('SELECT * FROM seasonal_pricing WHERE unit_id = ? AND is_active = 1 AND start_date <= ? AND end_date >= ?').all(unitId, endDate, startDate)
  let seasonalSurcharge = 0
  for (const s of seasonal) {
    if (s.price_multiplier > 1) {
      seasonalSurcharge += totalBase * (s.price_multiplier - 1)
    }
  }

  // Apply promo
  let promoDiscount = 0
  if (promoCode) {
    const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1').get(promoCode)
    if (promo && promo.usage_limit > promo.used_count) {
      if (totalBase >= promo.min_booking_amount) {
        if (promo.discount_type === 'percentage') {
          promoDiscount = Math.min(totalBase * promo.discount_value / 100, promo.max_discount || Infinity)
        } else {
          promoDiscount = Math.min(promo.discount_value, promo.max_discount || Infinity)
        }
      }
    }
  }

  const totalPrice = totalBase + weekendSurcharge + seasonalSurcharge - promoDiscount

  return {
    nights,
    base_price: unit.base_price,
    weekend_price: unit.weekend_price,
    total_base: totalBase,
    weekend_surcharge: weekendSurcharge,
    seasonal_surcharge: seasonalSurcharge,
    promo_discount: promoDiscount,
    total_price: totalPrice,
    price_per_night: totalBase / nights
  }
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// ========== PUBLIC API ==========

app.get('/api/units', (req, res) => {
  try {
    const units = db.prepare(`
      SELECT u.*, p.name as property_name,
        (SELECT AVG(rating) FROM reviews WHERE unit_id = u.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE unit_id = u.id) as review_count
      FROM units u LEFT JOIN properties p ON u.property_id = p.id 
      WHERE u.is_active = 1 ORDER BY u.id
    `).all()
    res.json({ units })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch units' })
  }
})

app.get('/api/units/:id', (req, res) => {
  try {
    const unit = db.prepare(`
      SELECT u.*, p.name as property_name, p.phone as property_phone, p.address as property_address, p.latitude, p.longitude,
        (SELECT AVG(rating) FROM reviews WHERE unit_id = u.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE unit_id = u.id) as review_count
      FROM units u LEFT JOIN properties p ON u.property_id = p.id WHERE u.id = ?
    `).get(req.params.id)
    if (!unit) return res.status(404).json({ error: 'Unit not found' })

    const gallery = db.prepare('SELECT * FROM unit_gallery WHERE unit_id = ? ORDER BY sort_order').all(req.params.id)
    const amenities = db.prepare('SELECT * FROM unit_amenities WHERE unit_id = ?').all(req.params.id)
    const reviews = db.prepare('SELECT * FROM reviews WHERE unit_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id)

    res.json({ unit: { ...unit, gallery, amenities, reviews } })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unit' })
  }
})

app.get('/api/availability', (req, res) => {
  try {
    const { unit_id, start_date, end_date } = req.query
    if (!unit_id || !start_date || !end_date) return res.status(400).json({ error: 'Missing required parameters' })

    const overlapping = db.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE unit_id = ? AND status IN ('PENDING', 'CONFIRMED', 'ONGOING')
      AND start_date <= ? AND end_date >= ?
    `).get(unit_id, end_date, start_date)

    const priceInfo = calculatePrice(parseInt(unit_id), start_date, end_date)

    res.json({ available: overlapping.count === 0, price: priceInfo })
  } catch (error) {
    res.status(500).json({ error: 'Failed to check availability' })
  }
})

// Calendar availability for public
app.get('/api/calendar/:unitId', (req, res) => {
  try {
    const { unitId } = req.params
    const { month, year } = req.query
    
    const m = parseInt(month) || new Date().getMonth() + 1
    const y = parseInt(year) || new Date().getFullYear()
    
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`
    const endDate = `${y}-${String(m).padStart(2, '0')}-31`
    
    // Get bookings for this unit in the month
    const bookings = db.prepare(`
      SELECT start_date, end_date, status FROM bookings 
      WHERE unit_id = ? AND status IN ('PENDING', 'CONFIRMED', 'ONGOING')
      AND start_date <= ? AND end_date >= ?
    `).all(unitId, endDate, startDate)
    
    // Get unit info for weekend pricing
    const unit = db.prepare('SELECT base_price, weekend_price FROM units WHERE id = ?').get(unitId)
    
    // Build availability map for each day
    const daysInMonth = new Date(y, m, 0).getDate()
    const calendar = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const date = new Date(y, m - 1, day)
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0
      
      // Check if this date is booked
      const isBooked = bookings.some(b => dateStr >= b.start_date && dateStr < b.end_date)
      
      // Get price for this day
      const price = isWeekend ? (unit?.weekend_price || unit?.base_price || 0) : (unit?.base_price || 0)
      
      calendar.push({
        date: dateStr,
        day,
        dayOfWeek,
        isWeekend,
        isAvailable: !isBooked,
        price,
        status: isBooked ? 'booked' : 'available'
      })
    }
    
    res.json({ calendar, month: m, year: y, unit: { base_price: unit?.base_price, weekend_price: unit?.weekend_price } })
  } catch (error) {
    console.error('Calendar error:', error)
    res.status(500).json({ error: 'Failed to fetch calendar' })
  }
})

app.post('/api/bookings', (req, res) => {
  try {
    const { unit_id, start_date, end_date, customer_name, customer_phone, customer_email, guest_count, special_requests, promo_code } = req.body
    if (!unit_id || !start_date || !end_date || !customer_name || !customer_phone) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const overlapping = db.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE unit_id = ? AND status IN ('PENDING', 'CONFIRMED', 'ONGOING')
      AND start_date <= ? AND end_date >= ?
    `).get(unit_id, end_date, start_date)

    if (overlapping.count > 0) return res.status(400).json({ error: 'Unit tidak tersedia pada tanggal tersebut' })

    const priceInfo = calculatePrice(parseInt(unit_id), start_date, end_date, promo_code)
    if (!priceInfo) return res.status(404).json({ error: 'Unit not found' })

    let customer = db.prepare('SELECT id FROM customers WHERE phone = ?').get(customer_phone)
    if (!customer) {
      const r = db.prepare('INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)').run(customer_name, customer_phone, customer_email || null)
      customer = { id: r.lastInsertRowid }
    }

    // Update promo usage
    if (promo_code && priceInfo.promo_discount > 0) {
      db.prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ?').run(promo_code)
    }

    const booking_code = generateBookingCode()
    const result = db.prepare(`
      INSERT INTO bookings (booking_code, property_id, unit_id, customer_id, start_date, end_date, nights, base_price, weekend_surcharge, promo_discount, total_price, status, promo_code, guest_count, special_requests)
      VALUES (?, (SELECT property_id FROM units WHERE id = ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
    `).run(booking_code, unit_id, unit_id, customer.id, start_date, end_date, priceInfo.nights, priceInfo.base_price, priceInfo.weekend_surcharge, priceInfo.promo_discount, priceInfo.total_price, promo_code || null, guest_count || null, special_requests || null)

    // Update customer total bookings
    db.prepare('UPDATE customers SET total_bookings = total_bookings + 1 WHERE id = ?').run(customer.id)

    const booking = db.prepare(`
      SELECT b.*, u.name as unit_name, p.name as property_name, c.name as customer_name, c.phone as customer_phone
      FROM bookings b LEFT JOIN units u ON b.unit_id = u.id LEFT JOIN properties p ON u.property_id = p.id LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({ booking })
  } catch (error) {
    console.error('Booking error:', error)
    res.status(500).json({ error: 'Failed to create booking' })
  }
})

// Validate promo code
app.post('/api/promo/validate', (req, res) => {
  try {
    const { code, amount } = req.body
    const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1').get(code)
    if (!promo) return res.status(404).json({ error: 'Kode promo tidak valid' })
    if (promo.usage_limit <= promo.used_count) return res.status(400).json({ error: 'Kode promo sudah habis' })
    if (promo.start_date && new Date(promo.start_date) > new Date()) return res.status(400).json({ error: 'Kode promo belum aktif' })
    if (promo.end_date && new Date(promo.end_date) < new Date()) return res.status(400).json({ error: 'Kode promo sudah kedaluwarsa' })
    if (amount < promo.min_booking_amount) return res.status(400).json({ error: `Minimal booking ${promo.min_booking_amount}` })

    let discount = 0
    if (promo.discount_type === 'percentage') {
      discount = Math.min(amount * promo.discount_value / 100, promo.max_discount || Infinity)
    } else {
      discount = Math.min(promo.discount_value, promo.max_discount || Infinity)
    }

    res.json({ valid: true, promo: { ...promo, discount } })
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate promo' })
  }
})

// ========== AUTH API ==========

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '24h' })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (error) {
    res.status(500).json({ error: 'Login failed' })
  }
})

// ========== ADMIN API ==========

app.get('/api/admin/stats', authMiddleware, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const m = String(new Date().getMonth() + 1).padStart(2, '0')
    const y = new Date().getFullYear()

    const todayCheckins = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE start_date = ? AND status IN ('CONFIRMED','ONGOING')`).get(today)
    const pendingBookings = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE status = 'PENDING'`).get()
    const monthlyRevenue = db.prepare(`SELECT COALESCE(SUM(total_price),0) as total FROM bookings WHERE status IN ('CONFIRMED','ONGOING','COMPLETED') AND strftime('%m',start_date)=? AND strftime('%Y',start_date)=?`).get(m, String(y))
    const totalBookings = db.prepare(`SELECT COUNT(*) as count FROM bookings`).get()
    const totalUnits = db.prepare(`SELECT COUNT(*) as count FROM units WHERE is_active = 1`).get()
    const avgRating = db.prepare(`SELECT AVG(rating) as avg FROM reviews`).get()
    const recentBookings = db.prepare(`SELECT b.*, u.name as unit_name, c.name as customer_name FROM bookings b LEFT JOIN units u ON b.unit_id = u.id LEFT JOIN customers c ON b.customer_id = c.id ORDER BY b.created_at DESC LIMIT 5`).all()

    // Monthly revenue for chart (last 6 months)
    const monthlyChart = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const cm = String(d.getMonth() + 1).padStart(2, '0')
      const cy = d.getFullYear()
      const rev = db.prepare(`SELECT COALESCE(SUM(total_price),0) as total FROM bookings WHERE status IN ('CONFIRMED','ONGOING','COMPLETED') AND strftime('%m',start_date)=? AND strftime('%Y',start_date)=?`).get(cm, String(cy))
      const cnt = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE strftime('%m',start_date)=? AND strftime('%Y',start_date)=?`).get(cm, String(cy))
      monthlyChart.push({ month: `${cy}-${cm}`, revenue: rev.total, bookings: cnt.count })
    }

    // Bookings by status
    const statusChart = db.prepare(`SELECT status, COUNT(*) as count FROM bookings GROUP BY status`).all()

    res.json({
      todayCheckins: todayCheckins.count,
      pendingBookings: pendingBookings.count,
      monthlyRevenue: monthlyRevenue.total,
      totalBookings: totalBookings.count,
      totalUnits: totalUnits.count,
      avgRating: avgRating.avg ? Math.round(avgRating.avg * 10) / 10 : 0,
      recentBookings,
      monthlyChart,
      statusChart
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

app.get('/api/admin/bookings', authMiddleware, (req, res) => {
  try {
    const { status, search } = req.query
    let query = `SELECT b.*, u.name as unit_name, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, p.name as property_name FROM bookings b LEFT JOIN units u ON b.unit_id = u.id LEFT JOIN customers c ON b.customer_id = c.id LEFT JOIN properties p ON b.property_id = p.id`
    const conditions = []
    const params = []
    if (status && status !== 'all') { conditions.push('b.status = ?'); params.push(status) }
    if (search) { conditions.push('(c.name LIKE ? OR b.booking_code LIKE ? OR u.name LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`) }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ')
    res.json({ bookings: db.prepare(query + ' ORDER BY b.created_at DESC').all(...params) })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' })
  }
})

app.get('/api/admin/bookings/:id', authMiddleware, (req, res) => {
  try {
    const booking = db.prepare(`SELECT b.*, u.name as unit_name, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.total_bookings as customer_total_bookings, p.name as property_name, p.phone as property_phone, p.address as property_address FROM bookings b LEFT JOIN units u ON b.unit_id = u.id LEFT JOIN customers c ON b.customer_id = c.id LEFT JOIN properties p ON b.property_id = p.id WHERE b.id = ?`).get(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    const payments = db.prepare('SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC').all(req.params.id)
    const review = db.prepare('SELECT * FROM reviews WHERE booking_id = ?').get(req.params.id)
    res.json({ booking: { ...booking, payments, review } })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking' })
  }
})

app.patch('/api/admin/bookings/:id', authMiddleware, (req, res) => {
  try {
    const { status, notes, payment_status, payment_amount, payment_method } = req.body
    if (status) {
      const valid = ['PENDING','CONFIRMED','ONGOING','COMPLETED','CANCELLED','REJECTED']
      if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' })
      db.prepare('UPDATE bookings SET status = ?, notes = COALESCE(?, notes) WHERE id = ?').run(status, notes || null, req.params.id)
    }
    if (payment_status) {
      db.prepare('UPDATE bookings SET payment_status = ?, payment_amount = COALESCE(?, payment_amount), payment_method = COALESCE(?, payment_method) WHERE id = ?').run(payment_status, payment_amount || null, payment_method || null, req.params.id)
    }
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id)
    res.json({ message: 'Updated', booking })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' })
  }
})

// Customer history
app.get('/api/admin/customers', authMiddleware, (req, res) => {
  try {
    const customers = db.prepare('SELECT * FROM customers ORDER BY total_bookings DESC').all()
    res.json({ customers })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

app.get('/api/admin/customers/:id', authMiddleware, (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id)
    if (!customer) return res.status(404).json({ error: 'Customer not found' })
    const bookings = db.prepare(`SELECT b.*, u.name as unit_name FROM bookings b LEFT JOIN units u ON b.unit_id = u.id WHERE b.customer_id = ? ORDER BY b.created_at DESC`).all(req.params.id)
    res.json({ customer: { ...customer, bookings } })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' })
  }
})

// Units CRUD
app.get('/api/admin/units', authMiddleware, (req, res) => {
  try {
    const units = db.prepare(`SELECT u.*, p.name as property_name, (SELECT AVG(rating) FROM reviews WHERE unit_id = u.id) as avg_rating FROM units u LEFT JOIN properties p ON u.property_id = p.id ORDER BY u.id`).all()
    res.json({ units })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch units' })
  }
})

app.post('/api/admin/units', authMiddleware, (req, res) => {
  try {
    const { name, type, base_price, weekend_price, capacity, bed_count, bathroom_count, size_m2, description, photo_url, is_active, property_id, amenities, min_nights, max_nights } = req.body
    if (!name || !base_price) return res.status(400).json({ error: 'Name and price are required' })
    const result = db.prepare('INSERT INTO units (property_id, name, type, base_price, weekend_price, capacity, bed_count, bathroom_count, size_m2, description, photo_url, is_active, min_nights, max_nights) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(property_id || 1, name, type || null, base_price, weekend_price || null, capacity || null, bed_count || null, bathroom_count || null, size_m2 || null, description || null, photo_url || null, is_active !== false ? 1 : 0, min_nights || 1, max_nights || null)
    if (amenities && Array.isArray(amenities)) {
      const insertA = db.prepare('INSERT INTO unit_amenities (unit_id, amenity_name) VALUES (?, ?)')
      for (const a of amenities) insertA.run(result.lastInsertRowid, a)
    }
    const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ message: 'Unit created', unit })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create unit' })
  }
})

app.put('/api/admin/units/:id', authMiddleware, (req, res) => {
  try {
    const { name, type, base_price, weekend_price, capacity, bed_count, bathroom_count, size_m2, description, photo_url, is_active, min_nights, max_nights } = req.body
    db.prepare('UPDATE units SET name=COALESCE(?,name), type=COALESCE(?,type), base_price=COALESCE(?,base_price), weekend_price=COALESCE(?,weekend_price), capacity=COALESCE(?,capacity), bed_count=COALESCE(?,bed_count), bathroom_count=COALESCE(?,bathroom_count), size_m2=COALESCE(?,size_m2), description=COALESCE(?,description), photo_url=COALESCE(?,photo_url), is_active=COALESCE(?,is_active), min_nights=COALESCE(?,min_nights), max_nights=COALESCE(?,max_nights) WHERE id=?')
      .run(name, type, base_price, weekend_price, capacity, bed_count, bathroom_count, size_m2, description, photo_url, is_active !== undefined ? (is_active ? 1 : 0) : null, min_nights, max_nights, req.params.id)
    res.json({ message: 'Unit updated', unit: db.prepare('SELECT * FROM units WHERE id = ?').get(req.params.id) })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update unit' })
  }
})

app.delete('/api/admin/units/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM units WHERE id = ?').run(req.params.id)
    res.json({ message: 'Unit deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete unit' })
  }
})

// Gallery
app.get('/api/admin/units/:id/gallery', authMiddleware, (req, res) => {
  try {
    const gallery = db.prepare('SELECT * FROM unit_gallery WHERE unit_id = ? ORDER BY sort_order').all(req.params.id)
    res.json({ gallery })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gallery' })
  }
})

app.post('/api/admin/units/:id/gallery', authMiddleware, (req, res) => {
  try {
    const { photo_url, caption } = req.body
    if (!photo_url) return res.status(400).json({ error: 'Photo URL required' })
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM unit_gallery WHERE unit_id = ?').get(req.params.id)
    const result = db.prepare('INSERT INTO unit_gallery (unit_id, photo_url, caption, sort_order) VALUES (?, ?, ?, ?)').run(req.params.id, photo_url, caption || null, (maxOrder?.max || 0) + 1)
    res.status(201).json({ message: 'Photo added', id: result.lastInsertRowid })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add photo' })
  }
})

app.delete('/api/admin/gallery/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM unit_gallery WHERE id = ?').run(req.params.id)
    res.json({ message: 'Photo deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' })
  }
})

// Amenities
app.post('/api/admin/units/:id/amenities', authMiddleware, (req, res) => {
  try {
    const { amenity_name } = req.body
    if (!amenity_name) return res.status(400).json({ error: 'Amenity name required' })
    db.prepare('INSERT INTO unit_amenities (unit_id, amenity_name) VALUES (?, ?)').run(req.params.id, amenity_name)
    res.status(201).json({ message: 'Amenity added' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add amenity' })
  }
})

app.delete('/api/admin/amenities/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM unit_amenities WHERE id = ?').run(req.params.id)
    res.json({ message: 'Amenity deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete amenity' })
  }
})

// Promo codes
app.get('/api/admin/promos', authMiddleware, (req, res) => {
  try {
    const promos = db.prepare('SELECT * FROM promo_codes ORDER BY created_at DESC').all()
    res.json({ promos })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promos' })
  }
})

app.post('/api/admin/promos', authMiddleware, (req, res) => {
  try {
    const { code, description, discount_type, discount_value, min_booking_amount, max_discount, start_date, end_date, usage_limit } = req.body
    if (!code || !discount_type || !discount_value) return res.status(400).json({ error: 'Missing required fields' })
    const result = db.prepare('INSERT INTO promo_codes (code, description, discount_type, discount_value, min_booking_amount, max_discount, start_date, end_date, usage_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(code, description || null, discount_type, discount_value, min_booking_amount || 0, max_discount || null, start_date || null, end_date || null, usage_limit || null)
    res.status(201).json({ message: 'Promo created', id: result.lastInsertRowid })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create promo' })
  }
})

app.put('/api/admin/promos/:id', authMiddleware, (req, res) => {
  try {
    const { code, description, discount_type, discount_value, min_booking_amount, max_discount, start_date, end_date, usage_limit, is_active } = req.body
    db.prepare('UPDATE promo_codes SET code=COALESCE(?,code), description=COALESCE(?,description), discount_type=COALESCE(?,discount_type), discount_value=COALESCE(?,discount_value), min_booking_amount=COALESCE(?,min_booking_amount), max_discount=COALESCE(?,max_discount), start_date=COALESCE(?,start_date), end_date=COALESCE(?,end_date), usage_limit=COALESCE(?,usage_limit), is_active=COALESCE(?,is_active) WHERE id=?')
      .run(code, description, discount_type, discount_value, min_booking_amount, max_discount, start_date, end_date, usage_limit, is_active !== undefined ? (is_active ? 1 : 0) : null, req.params.id)
    res.json({ message: 'Promo updated' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update promo' })
  }
})

app.delete('/api/admin/promos/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM promo_codes WHERE id = ?').run(req.params.id)
    res.json({ message: 'Promo deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete promo' })
  }
})

// Reviews
app.get('/api/admin/reviews', authMiddleware, (req, res) => {
  try {
    const reviews = db.prepare('SELECT r.*, u.name as unit_name FROM reviews r LEFT JOIN units u ON r.unit_id = u.id ORDER BY r.created_at DESC').all()
    res.json({ reviews })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' })
  }
})

// Export CSV
app.get('/api/admin/export/bookings', authMiddleware, (req, res) => {
  try {
    const bookings = db.prepare(`SELECT b.booking_code, c.name as customer_name, c.phone as customer_phone, u.name as unit_name, b.start_date, b.end_date, b.nights, b.total_price, b.status, b.payment_status, b.created_at FROM bookings b LEFT JOIN units u ON b.unit_id = u.id LEFT JOIN customers c ON b.customer_id = c.id ORDER BY b.created_at DESC`).all()

    let csv = 'Booking Code,Customer Name,Phone,Unit,Check-in,Check-out,Nights,Total Price,Status,Payment Status,Created At\n'
    for (const b of bookings) {
      csv += `${b.booking_code},"${b.customer_name}","${b.customer_phone}","${b.unit_name}",${b.start_date},${b.end_date},${b.nights},${b.total_price},${b.status},${b.payment_status},${b.created_at}\n`
    }

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=bookings.csv')
    res.send(csv)
  } catch (error) {
    res.status(500).json({ error: 'Failed to export' })
  }
})

// Invoice
app.get('/api/admin/bookings/:id/invoice', authMiddleware, (req, res) => {
  try {
    const booking = db.prepare(`SELECT b.*, u.name as unit_name, u.type as unit_type, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, p.name as property_name, p.phone as property_phone, p.address as property_address FROM bookings b LEFT JOIN units u ON b.unit_id = u.id LEFT JOIN customers c ON b.customer_id = c.id LEFT JOIN properties p ON b.property_id = p.id WHERE b.id = ?`).get(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    res.json({ invoice: booking })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice' })
  }
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
