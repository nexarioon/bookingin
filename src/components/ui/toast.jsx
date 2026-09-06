import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"
import { useState, useEffect, createContext, useContext, useCallback } from "react"

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration || 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

const toastVariants = cva(
  "relative flex items-start gap-3 w-full rounded-lg border p-4 shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        success: "bg-green-50 text-green-800 border-green-200",
        destructive: "bg-red-50 text-red-800 border-red-200",
        warning: "bg-orange-50 text-orange-800 border-orange-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Toast({ id, title, description, variant = "default", onClose }) {
  const [visible, setVisible] = useState(false)
  
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div 
      className={cn(toastVariants({ variant }), "transition-all duration-300", visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8")}
    >
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {description && <p className="text-sm mt-1 opacity-90">{description}</p>}
      </div>
      <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
