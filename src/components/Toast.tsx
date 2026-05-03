import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useId,
} from 'react'
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'loading'

interface Toast {
  id: string
  message: string
  type: ToastType
  link?: { label: string; href: string }
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, type: ToastType, link?: Toast['link']) => string
  removeToast: (id: string) => void
  success: (msg: string, link?: Toast['link']) => void
  error: (msg: string) => void
  info: (msg: string) => void
  loading: (msg: string) => string
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const baseId = useId()
  let counter = 0

  const addToast = useCallback(
    (message: string, type: ToastType, link?: Toast['link']): string => {
      const id = `${baseId}-${Date.now()}-${counter++}`
      setToasts((prev) => [...prev, { id, message, type, link }])
      if (type !== 'loading') {
        setTimeout(() => removeToast(id), 5000)
      }
      return id
    },
    [baseId],
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback(
    (msg: string, link?: Toast['link']) => addToast(msg, 'success', link),
    [addToast],
  )
  const error = useCallback(
    (msg: string) => addToast(msg, 'error'),
    [addToast],
  )
  const info = useCallback((msg: string) => addToast(msg, 'info'), [addToast])
  const loading = useCallback(
    (msg: string) => addToast(msg, 'loading'),
    [addToast],
  )

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, info, loading }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast
  onRemove: (id: string) => void
}) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    loading: (
      <Loader2 className="w-5 h-5 text-purple-400 shrink-0 animate-spin" />
    ),
  }

  const borders = {
    success: 'border-emerald-500/30',
    error: 'border-red-500/30',
    info: 'border-blue-500/30',
    loading: 'border-purple-500/30',
  }

  return (
    <div
      className={`flex items-start gap-3 bg-gray-900/95 backdrop-blur border ${borders[toast.type]} rounded-xl p-4 shadow-2xl text-white text-sm`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="leading-snug">{toast.message}</p>
        {toast.link && (
          <a
            href={toast.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline text-xs mt-1 block"
          >
            {toast.link.label}
          </a>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-500 hover:text-gray-300 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
