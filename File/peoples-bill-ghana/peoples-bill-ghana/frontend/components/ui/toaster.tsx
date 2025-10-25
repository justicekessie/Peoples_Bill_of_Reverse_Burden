'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
}

let toastId = 0
const toasts: Toast[] = []
const listeners: Set<() => void> = new Set()

function emitChange() {
  listeners.forEach(listener => listener())
}

export function useToast() {
  const toast = (props: Omit<Toast, 'id'>) => {
    const id = String(toastId++)
    toasts.push({ ...props, id })
    emitChange()
    
    setTimeout(() => {
      const index = toasts.findIndex(t => t.id === id)
      if (index > -1) {
        toasts.splice(index, 1)
        emitChange()
      }
    }, 5000)
  }
  
  return { toast }
}

export function Toaster() {
  const [, forceUpdate] = useState({})
  
  useEffect(() => {
    const listener = () => forceUpdate({})
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])
  
  const dismiss = (id: string) => {
    const index = toasts.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.splice(index, 1)
      emitChange()
    }
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            bg-white rounded-lg shadow-lg border p-4 animate-slide-in
            ${toast.variant === 'success' ? 'border-green-200' : ''}
            ${toast.variant === 'destructive' ? 'border-red-200' : ''}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{toast.title}</p>
              {toast.description && (
                <p className="text-sm text-gray-600 mt-1">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
