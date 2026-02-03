'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslations } from '@/components/providers/i18n-provider'
import { uploadBookletAction, clearBookletMetadataAction } from '@/actions/booklet-upload'
import { Box, Flex, Text, Button, Badge, Table } from '@radix-ui/themes'
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Scale,
  Package,
  Building2,
} from 'lucide-react'
import type { BookletMetadata } from '@/lib/parsing'

type UploadState = 'idle' | 'dragover' | 'uploading' | 'success' | 'error'

interface BookletUploadCardProps {
  tenderId: string
  existingMetadata: BookletMetadata | null
  onSuccess?: (metadata: BookletMetadata) => void
}

export function BookletUploadCard({
  tenderId,
  existingMetadata,
  onSuccess,
}: BookletUploadCardProps) {
  const t = useTranslations('booklet')
  const [state, setState] = useState<UploadState>(existingMetadata ? 'success' : 'idle')
  const [metadata, setMetadata] = useState<BookletMetadata | null>(existingMetadata)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isClearing, setIsClearing] = useState(false)

  const handleUpload = useCallback(
    async (file: File) => {
      setState('uploading')
      setErrorMessage(null)

      const formData = new FormData()
      formData.append('file', file)

      const response = await uploadBookletAction(tenderId, formData)

      if (response.success && response.data) {
        setMetadata(response.data.metadata)
        setState('success')
        onSuccess?.(response.data.metadata)
      } else {
        setErrorMessage(response.success === false ? response.error : t('error'))
        setState('error')
      }
    },
    [tenderId, onSuccess, t]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles[0])
      }
    },
    [handleUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    disabled: state === 'uploading',
  })

  const handleClear = async () => {
    setIsClearing(true)
    const response = await clearBookletMetadataAction(tenderId)
    setIsClearing(false)

    if (response.success) {
      setMetadata(null)
      setState('idle')
    }
  }

  const handleReset = () => {
    setState('idle')
    setMetadata(null)
    setErrorMessage(null)
  }

  return (
    <Box
      style={{
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
      }}
    >
      <Flex direction="column" gap="3">
        {/* Header */}
        <Flex align="center" justify="between">
          <Flex align="center" gap="2">
            <FileText size={18} style={{ color: 'var(--color-primary-600)' }} />
            <Text size="2" weight="bold" style={{ color: 'var(--text-primary)' }}>
              {t('title')}
            </Text>
          </Flex>
          {metadata && (
            <Badge color="green" size="1">
              <CheckCircle size={12} />
              {t('verified')}
            </Badge>
          )}
        </Flex>

        {/* Success state with extracted data */}
        {state === 'success' && metadata && (
          <Flex direction="column" gap="3">
            {/* Confidence badge */}
            <Flex align="center" gap="2">
              <Text size="1" style={{ color: 'var(--text-secondary)' }}>
                {t('confidence')}:
              </Text>
              <Badge
                color={
                  metadata.extraction_confidence >= 80
                    ? 'green'
                    : metadata.extraction_confidence >= 50
                      ? 'yellow'
                      : 'red'
                }
                size="1"
              >
                {metadata.extraction_confidence}%
              </Badge>
            </Flex>

            {/* Evaluation Weights */}
            {metadata.evaluation_weights && (
              <Box
                style={{
                  padding: 'var(--space-2)',
                  background: 'var(--surface-muted)',
                  borderRadius: 'var(--radius-2)',
                }}
              >
                <Flex align="center" gap="2" mb="2">
                  <Scale size={14} style={{ color: 'var(--text-secondary)' }} />
                  <Text size="1" weight="medium" style={{ color: 'var(--text-secondary)' }}>
                    {t('evaluationWeights')}
                  </Text>
                </Flex>
                <Flex gap="3">
                  <Flex align="center" gap="1">
                    <Text size="1" style={{ color: 'var(--text-tertiary)' }}>
                      {t('financial')}:
                    </Text>
                    <Text size="1" weight="bold">
                      {metadata.evaluation_weights.financial_weight}%
                    </Text>
                  </Flex>
                  <Flex align="center" gap="1">
                    <Text size="1" style={{ color: 'var(--text-tertiary)' }}>
                      {t('technical')}:
                    </Text>
                    <Text size="1" weight="bold">
                      {metadata.evaluation_weights.technical_weight}%
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            )}

            {/* Local Content Target */}
            {metadata.local_content_target != null && (
              <Box
                style={{
                  padding: 'var(--space-2)',
                  background: 'var(--surface-muted)',
                  borderRadius: 'var(--radius-2)',
                }}
              >
                <Flex align="center" gap="2">
                  <Building2 size={14} style={{ color: 'var(--text-secondary)' }} />
                  <Text size="1" weight="medium" style={{ color: 'var(--text-secondary)' }}>
                    {t('localContent')}:
                  </Text>
                  <Text size="1" weight="bold">
                    {metadata.local_content_target}%
                  </Text>
                </Flex>
              </Box>
            )}

            {/* BoQ Items Preview */}
            {metadata.boq_items && metadata.boq_items.length > 0 && (
              <Box>
                <Flex align="center" gap="2" mb="2">
                  <Package size={14} style={{ color: 'var(--text-secondary)' }} />
                  <Text size="1" weight="medium" style={{ color: 'var(--text-secondary)' }}>
                    {t('boqItems')} ({metadata.boq_items.length})
                  </Text>
                </Flex>
                <Box
                  style={{
                    maxHeight: 150,
                    overflowY: 'auto',
                    fontSize: 'var(--font-size-1)',
                  }}
                >
                  <Table.Root size="1">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>{t('item')}</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>{t('qty')}</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>{t('unit')}</Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {metadata.boq_items.slice(0, 5).map((item, i) => (
                        <Table.Row key={i}>
                          <Table.Cell>
                            <Text
                              size="1"
                              style={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                              }}
                            >
                              {item.name}
                            </Text>
                          </Table.Cell>
                          <Table.Cell>{item.quantity ?? '—'}</Table.Cell>
                          <Table.Cell>{item.unit ?? '—'}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                  {metadata.boq_items.length > 5 && (
                    <Text
                      size="1"
                      style={{ color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}
                    >
                      +{metadata.boq_items.length - 5} {t('moreItems')}
                    </Text>
                  )}
                </Box>
              </Box>
            )}

            {/* Extraction notes */}
            {metadata.extraction_notes && (
              <Text size="1" style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                {metadata.extraction_notes}
              </Text>
            )}

            {/* Actions */}
            <Flex gap="2">
              <Button
                variant="soft"
                size="1"
                onClick={() => setState('idle')}
                style={{ flex: 1 }}
              >
                <Upload size={12} />
                {t('uploadNew')}
              </Button>
              <Button
                variant="soft"
                color="red"
                size="1"
                onClick={handleClear}
                disabled={isClearing}
              >
                {isClearing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                {t('clear')}
              </Button>
            </Flex>
          </Flex>
        )}

        {/* Error state */}
        {state === 'error' && (
          <Flex direction="column" gap="3" align="center" py="3">
            <AlertCircle style={{ width: 32, height: 32, color: 'var(--red-11)' }} />
            <Text size="2" weight="bold" style={{ color: 'var(--red-11)' }}>
              {t('error')}
            </Text>
            <Text size="1" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              {errorMessage}
            </Text>
            <Button variant="soft" size="1" onClick={handleReset}>
              {t('tryAgain')}
            </Button>
          </Flex>
        )}

        {/* Uploading state */}
        {state === 'uploading' && (
          <Flex direction="column" gap="2" align="center" py="3">
            <Loader2
              className="animate-spin"
              style={{ width: 32, height: 32, color: 'var(--color-primary-600)' }}
            />
            <Text size="2" weight="bold" style={{ color: 'var(--text-primary)' }}>
              {t('processing')}
            </Text>
            <Text size="1" style={{ color: 'var(--text-secondary)' }}>
              {t('extracting')}
            </Text>
          </Flex>
        )}

        {/* Dropzone (idle/dragover states) */}
        {(state === 'idle' || state === 'dragover') && (
          <Box
            {...getRootProps()}
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-2)',
              border: `2px dashed ${isDragActive ? 'var(--color-primary-500)' : 'var(--gray-6)'}`,
              background: isDragActive ? 'var(--color-primary-50)' : 'var(--gray-a2)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <input {...getInputProps()} />
            <Flex direction="column" align="center" gap="2">
              <FileText
                size={28}
                style={{ color: isDragActive ? 'var(--color-primary-600)' : 'var(--gray-9)' }}
              />
              <Text
                size="1"
                weight="medium"
                style={{ color: 'var(--text-primary)', textAlign: 'center' }}
              >
                {isDragActive ? t('dropHere') : t('dropzone')}
              </Text>
              <Text size="1" style={{ color: 'var(--gray-10)' }}>
                {t('pdfOnly')}
              </Text>
            </Flex>
          </Box>
        )}
      </Flex>
    </Box>
  )
}
