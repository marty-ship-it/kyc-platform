import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)} 
    />
  )
}

interface LoadingCardProps {
  className?: string
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="bg-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-48"></div>
            <div className="h-3 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="h-8 bg-gray-300 rounded w-20"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 rounded w-full"></div>
          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
        </div>
        <div className="flex space-x-4">
          <div className="h-3 bg-gray-300 rounded w-24"></div>
          <div className="h-3 bg-gray-300 rounded w-24"></div>
          <div className="h-3 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    </div>
  )
}

interface LoadingSkeletonProps {
  lines?: number
  className?: string
}

export function LoadingSkeleton({ lines = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-gray-200 rounded" 
          style={{ 
            width: `${Math.random() * 40 + 60}%` 
          }} 
        />
      ))}
    </div>
  )
}

interface LoadingPageProps {
  title?: string
  description?: string
}

export function LoadingPage({ title = 'Loading...', description }: LoadingPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" className="mx-auto text-blue-600" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface LoadingButtonProps {
  children: React.ReactNode
  loading?: boolean
  className?: string
  [key: string]: any
}

export function LoadingButton({ 
  children, 
  loading = false, 
  className, 
  ...props 
}: LoadingButtonProps) {
  return (
    <button 
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'h-10 px-4 py-2',
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  )
}