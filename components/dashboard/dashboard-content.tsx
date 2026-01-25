'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Play,
  Upload,
  Loader2,
  Info,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import { useTranslations, useI18n } from '@/components/providers/i18n-provider'
import {
  Button,
  Flex,
  Heading,
  Text,
  Box,
  Callout,
} from '@radix-ui/themes'
import { StatsCards } from './stats-cards'
import { TenderTable } from './tender-table'
import { FileUpload } from './file-upload'
import { EvaluationProgressModal } from '@/components/modals/evaluation-progress-modal'
import { UploadEmptyState } from '@/components/ui/data-display'
import { importTendersAction, deleteTenderAction } from '@/actions/tender'
import { runEvaluationAction } from '@/actions/evaluation'
import type { TenderStatus } from '@/types/tender'

interface Tender {
  id: string
  entity: string
  title: string
  reference_no: string
  deadline: string
  estimated_value: number | null
  status: TenderStatus
  evaluation?: {
    score: number
    recommendation: 'qualified' | 'conditional' | 'excluded'
  } | null
}

interface DashboardContentProps {
  locale: string
  stats: {
    totalTenders: number
    qualified: number
    conditional?: number
    excluded: number
    totalValue: number
    pendingEvaluation: number
    pushedToCRM: number
  }
  tenders: Tender[]
}

export function DashboardContent({ locale, stats, tenders }: DashboardContentProps) {
  const tTender = useTranslations('tender')
  const tCommon = useTranslations('common')
  const tDashboard = useTranslations('dashboard')
  const { locale: currentLocale } = useI18n()
  const router = useRouter()
  const isRTL = currentLocale === 'ar'
  
  const [showUpload, setShowUpload] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)

  const handleFileSelect = async (file: File) => {
    setIsUploading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await importTendersAction(formData)

      if (result.success) {
        setMessage({
          type: 'success',
          text: tTender('importSuccess', { count: result.data.created.toString() }),
        })
        setShowUpload(false)
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      setMessage({ type: 'error', text: tTender('importError') })
    } finally {
      setIsUploading(false)
    }
  }

  const handleView = (id: string) => {
    router.push(`/${locale}/dashboard/${id}`)
  }

  const handleEvaluate = (id: string) => {
    startTransition(async () => {
      const result = await runEvaluationAction(id)
      if (result.success) {
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  const handlePushToCRM = (id: string) => {
    router.push(`/${locale}/dashboard/${id}`)
  }

  const handleDelete = (id: string) => {
    if (!confirm(tCommon('confirm'))) return

    startTransition(async () => {
      const result = await deleteTenderAction(id)
      if (result.success) {
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <Flex direction="column" gap="6">
      {/* Evaluation Modal */}
      {showEvaluationModal && (
        <EvaluationProgressModal onClose={() => setShowEvaluationModal(false)} />
      )}

      {/* Message Alert */}
      {message && (
        <Callout.Root 
          color={message.type === 'success' ? 'green' : 'red'}
          style={{
            backgroundColor: message.type === 'success' 
              ? 'var(--color-success-50)' 
              : 'var(--color-error-50)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <Callout.Icon>
            <Info size={16} />
          </Callout.Icon>
          <Callout.Text>{message.text}</Callout.Text>
        </Callout.Root>
      )}

      {/* Stats Cards */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          {isRTL ? 'إحصائيات المناقصات' : 'Tender Statistics'}
        </h2>
        <StatsCards stats={stats} />
      </section>

      {/* Quick Action Panel */}
      <section aria-labelledby="action-heading">
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          {stats.totalTenders > 0 ? (
            <Flex 
              align="center" 
              justify="between" 
              gap="4"
              wrap="wrap"
            >
              <Box>
                <Heading 
                  size="4" 
                  style={{ 
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  {tDashboard('nextAction')}
                </Heading>
                <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                  {tDashboard('pendingEvaluation', { count: (stats.pendingEvaluation ?? 0).toString() })}
                </Text>
              </Box>
              <Flex gap="3" wrap="wrap">
                <Button
                  size="3"
                  variant="outline"
                  onClick={() => setShowUpload(true)}
                  style={{
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Upload size={16} />
                  {tTender('uploadFile')}
                </Button>
                <Button
                  size="3"
                  variant="solid"
                  onClick={() => setShowEvaluationModal(true)}
                  style={{
                    backgroundColor: 'var(--color-primary-500)',
                    color: 'var(--text-inverted)',
                  }}
                >
                  <Play size={16} />
                  {tDashboard('evaluateAll')}
                </Button>
              </Flex>
            </Flex>
          ) : (
            <UploadEmptyState
              onUpload={() => setShowUpload(true)}
              title={tDashboard('uploadFirstTitle')}
              description={tDashboard('uploadFirstDescription')}
              acceptedFormats="CSV, Excel"
            />
          )}
        </div>
      </section>

      {/* File Upload Panel */}
      {showUpload && (
        <section aria-labelledby="upload-heading">
          <div 
            className="glass-card animate-fade-in-up" 
            style={{ padding: 'var(--space-6)' }}
          >
            <Flex justify="between" align="center" style={{ marginBottom: 'var(--space-4)' }}>
              <Heading size="4" style={{ color: 'var(--text-primary)' }}>
                {tTender('uploadFile')}
              </Heading>
              <button
                onClick={() => setShowUpload(false)}
                className="focus-ring"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {isRTL ? 'إغلاق' : 'Close'}
              </button>
            </Flex>
            <FileUpload onFileSelect={handleFileSelect} isUploading={isUploading} />
          </div>
        </section>
      )}

      {/* Loading State */}
      {isPending && (
        <Flex 
          align="center" 
          gap="2" 
          style={{ color: 'var(--text-secondary)' }}
        >
          <Loader2 size={16} className="animate-spin" />
          <Text size="2">{tCommon('loading')}</Text>
        </Flex>
      )}

      {/* Recent Tenders Section */}
      <section aria-labelledby="tenders-heading">
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <Flex 
            justify="between" 
            align="center" 
            style={{ 
              padding: 'var(--space-5) var(--space-6)',
              borderBottom: '1px solid var(--border-default)',
            }}
          >
            <Heading 
              size="4" 
              id="tenders-heading"
              style={{ color: 'var(--text-primary)' }}
            >
              {tDashboard('recentTenders')}
            </Heading>
            <Button 
              variant="ghost" 
              size="2" 
              onClick={() => router.push(`/${locale}/tenders-list`)}
              style={{ color: 'var(--text-link)' }}
            >
              {tDashboard('viewAll')}
              <ChevronRight size={16} className={isRTL ? 'flip-rtl' : ''} />
            </Button>
          </Flex>
          
          <Box style={{ padding: '0' }}>
            <TenderTable
              tenders={tenders.slice(0, 6)}
              onView={handleView}
              onEvaluate={handleEvaluate}
              onPushToCRM={handlePushToCRM}
              onDelete={handleDelete}
            />
          </Box>
        </div>
      </section>
    </Flex>
  )
}
