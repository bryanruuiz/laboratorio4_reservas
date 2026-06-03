import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

const STYLES = {
  error: {
    container: 'bg-red-50 text-red-800 ring-red-200',
    Icon: AlertCircle,
  },
  success: {
    container: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    Icon: CheckCircle2,
  },
}

/**
 * Alerta reutilizable que se oculta automáticamente tras unos segundos.
 * @param {'error'|'success'} type
 * @param {string|string[]} message
 * @param {() => void} [onClose]
 * @param {number} [duration] - milisegundos antes de auto-cerrarse (0 para desactivar)
 */
export default function Alert({ type = 'error', message, onClose, duration = 5000 }) {
  const msgKey = Array.isArray(message) ? message.join('|') : message
  // En lugar de un booleano "visible", se recuerda qué mensaje fue descartado.
  // Así, cuando el mensaje cambia, la alerta vuelve a mostrarse automáticamente.
  const [dismissedKey, setDismissedKey] = useState(null)
  const visible = Boolean(msgKey) && dismissedKey !== msgKey

  // Auto-cierre tras "duration" ms. setState solo se llama en el callback diferido.
  useEffect(() => {
    if (!visible || !duration) return undefined
    const timer = setTimeout(() => {
      setDismissedKey(msgKey)
      onClose?.()
    }, duration)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, msgKey, duration])

  if (!visible) return null

  const { container, Icon } = STYLES[type] ?? STYLES.error
  const messages = Array.isArray(message) ? message : [message]

  return (
    <div
      role="alert"
      className={`flex animate-fade-in-up items-start gap-3 rounded-lg px-4 py-3 text-sm ring-1 ring-inset ${container}`}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        {messages.map((m, i) => (
          <p key={i}>{m}</p>
        ))}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={() => {
            setDismissedKey(msgKey)
            onClose()
          }}
          className="rounded p-0.5 hover:bg-black/5"
          aria-label="Cerrar alerta"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
