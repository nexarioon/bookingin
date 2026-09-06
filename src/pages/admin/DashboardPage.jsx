import { useState, useEffect } from 'react'
import { Calendar, ClipboardList, DollarSign, TrendingUp, Clock, Star, Package, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AdminLayout from '@/components/admin/AdminLayout'
import { formatCurrency } from '@/utils/whatsapp'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const token = localStorage.getItem('admin_token')
    window.open(`/api/admin/export/bookings?token=${token}`, '_blank')
  }

  const statCards = [
    { title: "Check-in Hari Ini", value: stats?.todayCheckins || 0, icon: Calendar, color: "text-blue-500 bg-blue-500/10" },
    { title: "Booking Pending", value: stats?.pendingBookings || 0, icon: Clock, color: "text-yellow-500 bg-yellow-500/10" },
    { title: "Revenue Bulan Ini", value: stats?.monthlyRevenue || 0, icon: DollarSign, color: "text-green-500 bg-green-500/10", isCurrency: true },
    { title: "Total Unit", value: stats?.totalUnits || 0, icon: Package, color: "text-purple-500 bg-purple-500/10" },
    { title: "Rating Rata-rata", value: stats?.avgRating || '-', icon: Star, color: "text-yellow-500 bg-yellow-500/10" },
    { title: "Total Booking", value: stats?.totalBookings || 0, icon: ClipboardList, color: "text-primary bg-primary/10" },
  ]

  const maxRevenue = Math.max(...(stats?.monthlyChart?.map(m => m.revenue) || [1]))

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Selamat datang di admin panel</p>
          </div>
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{stat.title}</span>
                  <div className={`p-2 rounded-lg ${stat.color}`}><stat.icon className="h-4 w-4" /></div>
                </div>
                <p className="text-2xl font-bold">
                  {loading ? <span className="inline-block h-6 w-12 bg-muted animate-pulse rounded" /> : stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue 6 Bulan Terakhir</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-48 bg-muted animate-pulse rounded" />
              ) : (
                <div className="h-48 flex items-end gap-2">
                  {stats?.monthlyChart?.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{formatCurrency(m.revenue).replace('Rp', '')}</span>
                      <div className="w-full bg-primary/20 rounded-t relative" style={{ height: `${Math.max((m.revenue / maxRevenue) * 120, 4)}px` }}>
                        <div className="absolute bottom-0 w-full bg-primary rounded-t" style={{ height: '100%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{m.month.split('-')[1]}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">Status Booking</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-48 bg-muted animate-pulse rounded" />
              ) : (
                <div className="space-y-3">
                  {stats?.statusChart?.map((s, i) => {
                    const colors = { PENDING: 'bg-yellow-500', CONFIRMED: 'bg-green-500', ONGOING: 'bg-blue-500', COMPLETED: 'bg-gray-500', CANCELLED: 'bg-red-500', REJECTED: 'bg-red-300' }
                    const total = stats.statusChart.reduce((a, b) => a + b.count, 0) || 1
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <Badge variant="outline" className="text-xs">{s.status}</Badge>
                          <span className="text-muted-foreground">{s.count} booking ({Math.round(s.count / total * 100)}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${colors[s.status] || 'bg-gray-400'}`} style={{ width: `${(s.count / total) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader><CardTitle>Booking Terbaru</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="flex items-center gap-4"><div className="h-10 w-10 bg-muted animate-pulse rounded-full" /><div className="flex-1"><div className="h-4 bg-muted animate-pulse rounded w-1/4 mb-2" /><div className="h-3 bg-muted animate-pulse rounded w-1/3" /></div></div>)}</div>
            ) : stats?.recentBookings?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center"><span className="text-sm font-medium text-primary">{b.customer_name?.charAt(0) || '?'}</span></div>
                      <div>
                        <p className="font-medium text-sm">{b.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{b.unit_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(b.total_price)}</p>
                      <Badge variant={b.status === 'PENDING' ? 'warning' : b.status === 'CONFIRMED' ? 'success' : 'secondary'} className="text-[10px]">{b.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground"><ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Belum ada booking</p></div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
