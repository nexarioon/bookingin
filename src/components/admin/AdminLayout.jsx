import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Home, LayoutDashboard, Calendar, Package, ClipboardList, Tag, Users, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Bookings', href: '/admin/bookings', icon: ClipboardList },
  { name: 'Units', href: '/admin/units', icon: Package },
  { name: 'Calendar', href: '/admin/calendar', icon: Calendar },
  { name: 'Promo', href: '/admin/promos', icon: Tag },
  { name: 'Customers', href: '/admin/customers', icon: Users },
]

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => { logout(); navigate('/admin/login') }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 p-6 border-b"><Home className="h-6 w-6 text-primary" /><span className="text-xl font-bold">BookingKu</span></div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                  <item.icon className="h-5 w-5" />{item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-sm font-medium text-primary">{user?.name?.charAt(0) || 'A'}</span></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p><p className="text-xs text-muted-foreground truncate">{user?.email}</p></div>
            </div>
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></Button>
            <div className="flex items-center gap-2">
              <a href="/" target="_blank" rel="noopener"><Button variant="ghost" size="sm"><Home className="h-4 w-4 mr-1" />Lihat Website</Button></a>
              <span className="text-sm text-muted-foreground hidden sm:inline">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
