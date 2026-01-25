'use client'

import type { ReactNode } from 'react'
import { FileText, Search, Upload, AlertCircle, FolderOpen, Inbox } from 'lucide-react'

type EmptyStateVariant = 'default' | 'search' | 'upload' | 'error' | 'folder' | 'inbox'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

const variantIcons: Record<EmptyStateVariant, typeof FileText> = {
  default: FileText,
  search: Search,
  upload: Upload,
  error: AlertCircle,
  folder: FolderOpen,
  inbox: Inbox,
}

export function EmptyState({
  variant = 'default',
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const DefaultIcon = variantIcons[variant]

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-12) var(--space-6)',
        minHeight: '300px',
      }}
    >
      {/* Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--surface-muted)',
          color: 'var(--text-tertiary)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {icon || <DefaultIcon size={32} />}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            maxWidth: '360px',
            marginBottom: action ? 'var(--space-6)' : 0,
            lineHeight: 'var(--leading-relaxed)',
          }}
        >
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div style={{ marginTop: 'var(--space-2)' }}>
          {action}
        </div>
      )}
    </div>
  )
}

// Convenience components for common use cases

export function NoDataEmptyState({ 
  title, 
  description, 
  action 
}: { 
  title?: string
  description?: string
  action?: ReactNode 
}) {
  return (
    <EmptyState
      variant="inbox"
      title={title || 'No data yet'}
      description={description || 'Start by adding some data to see it here.'}
      action={action}
    />
  )
}

export function SearchEmptyState({ 
  searchTerm 
}: { 
  searchTerm?: string 
}) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={
        searchTerm 
          ? `We couldn't find any results for "${searchTerm}". Try adjusting your search.`
          : "We couldn't find any results matching your criteria."
      }
    />
  )
}

export function UploadEmptyState({ 
  onUpload,
  title,
  description,
  acceptedFormats,
}: { 
  onUpload?: () => void
  title?: string
  description?: string
  acceptedFormats?: string
}) {
  return (
    <EmptyState
      variant="upload"
      title={title || 'No files uploaded'}
      description={description || `Drag and drop files here, or click to browse. ${acceptedFormats ? `Accepts: ${acceptedFormats}` : ''}`}
      action={
        onUpload ? (
          <button
            onClick={onUpload}
            className="focus-ring"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-6)',
              backgroundColor: 'var(--color-primary-500)',
              color: 'var(--text-inverted)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              transition: 'var(--transition-all)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-500)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Upload size={16} />
            Upload Files
          </button>
        ) : undefined
      }
    />
  )
}

export function ErrorEmptyState({ 
  title,
  description,
  onRetry,
}: { 
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState
      variant="error"
      title={title || 'Something went wrong'}
      description={description || 'We encountered an error while loading this content. Please try again.'}
      action={
        onRetry ? (
          <button
            onClick={onRetry}
            className="focus-ring"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-6)',
              backgroundColor: 'transparent',
              color: 'var(--color-primary-600)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-primary-500)',
              cursor: 'pointer',
              transition: 'var(--transition-all)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-50)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Try Again
          </button>
        ) : undefined
      }
    />
  )
}
