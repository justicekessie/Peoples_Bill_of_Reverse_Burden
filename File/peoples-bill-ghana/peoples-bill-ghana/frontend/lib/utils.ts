import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function getRegionColor(region: string): string {
  const colors: { [key: string]: string } = {
    'Greater Accra': 'bg-blue-100 text-blue-800',
    'Ashanti': 'bg-yellow-100 text-yellow-800',
    'Western': 'bg-green-100 text-green-800',
    'Eastern': 'bg-purple-100 text-purple-800',
    'Central': 'bg-red-100 text-red-800',
    'Volta': 'bg-indigo-100 text-indigo-800',
    'Northern': 'bg-orange-100 text-orange-800',
    'Upper East': 'bg-pink-100 text-pink-800',
    'Upper West': 'bg-teal-100 text-teal-800',
    'Bono': 'bg-cyan-100 text-cyan-800',
    'Bono East': 'bg-lime-100 text-lime-800',
    'Ahafo': 'bg-amber-100 text-amber-800',
    'Western North': 'bg-emerald-100 text-emerald-800',
    'Oti': 'bg-violet-100 text-violet-800',
    'North East': 'bg-fuchsia-100 text-fuchsia-800',
    'Savannah': 'bg-rose-100 text-rose-800',
  }
  
  return colors[region] || 'bg-gray-100 text-gray-800'
}

export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}
