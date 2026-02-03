'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslations } from '@/components/providers/i18n-provider'
import { importTendersAction } from '@/actions/tender'
import { Box, Flex, Text, Button } from '@radix-ui/themes'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type UploadState = 'idle' | 'dragover' | 'uploading' | 'success' | 'error'

interface UploadResult {
  created: number
  errors: string[]
}

interface UploadTenderFormProps {
  onSuccess?: (result: UploadResult) => void
  locale?: string
}

export function UploadTenderForm({ onSuccess, locale = 'en' }: UploadTenderFormProps) {
  const t = useTranslations('upload')
  const tTender = useTranslations('tender')
  const [state, setState] = useState<UploadState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleUpload = useCallback(async (file: File) => {
    setState('uploading')
    setErrorMessage(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    const response = await importTendersAction(formData)

    if (response.success && response.data) {
      setResult(response.data)
      setState('success')
      onSuccess?.(response.data)
    } else {
      setErrorMessage(response.success === false ? response.error : t('error'))
      setState('error')
    }
  }, [onSuccess, t])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setSelectedFile(file)
      handleUpload(file)
    }
  }, [handleUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
    disabled: state === 'uploading',
  })

  const handleReset = () => {
    setState('idle')
    setSelectedFile(null)
    setResult(null)
    setErrorMessage(null)
  }

  return (
    <Box
      style={{
        padding: 'var(--space-5)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-card)',
        maxWidth: 480,
      }}
    >
      <Flex direction="column" gap="4">
        <Flex align="center" gap="2">
          <Upload size={20} style={{ color: 'var(--color-primary-600)' }} />
          <Text size="3" weight="bold" style={{ color: 'var(--text-primary)' }}>
            {tTender('uploadFile')}
          </Text>
        </Flex>

        {/* Success state */}
        {state === 'success' && result && (
          <Flex direction="column" gap="3" align="center" py="4" data-testid="upload-success">
            <CheckCircle style={{ width: 40, height: 40, color: 'var(--green-11)' }} />
            <Text size="3" weight="bold" style={{ color: 'var(--green-11)' }}>
              {t('success')}
            </Text>
            <Text size="2" style={{ color: 'var(--text-secondary)' }}>
              {tTender('importSuccess').replace('{count}', String(result.created))}
            </Text>
            {result.errors.length > 0 && (
              <Box style={{ marginTop: 'var(--space-2)', width: '100%' }}>
                <Text size="1" weight="medium" style={{ color: 'var(--yellow-11)' }}>
                  {result.errors.length} warnings:
                </Text>
                <Box
                  style={{
                    marginTop: 'var(--space-1)',
                    maxHeight: 80,
                    overflowY: 'auto',
                    fontSize: 'var(--font-size-1)',
                    color: 'var(--gray-10)',
                  }}
                >
                  {result.errors.slice(0, 5).map((err, i) => (
                    <Text key={i} size="1" style={{ display: 'block' }}>
                      {err}
                    </Text>
                  ))}
                  {result.errors.length > 5 && (
                    <Text size="1" style={{ color: 'var(--gray-9)' }}>
                      ...and {result.errors.length - 5} more
                    </Text>
                  )}
                </Box>
              </Box>
            )}
            <Button variant="soft" size="2" onClick={handleReset} style={{ marginTop: 'var(--space-2)' }}>
              Upload another file
            </Button>
          </Flex>
        )}

        {/* Error state */}
        {state === 'error' && (
          <Flex direction="column" gap="3" align="center" py="4" data-testid="upload-error">
            <AlertCircle style={{ width: 40, height: 40, color: 'var(--red-11)' }} />
            <Text size="3" weight="bold" style={{ color: 'var(--red-11)' }}>
              {t('error')}
            </Text>
            <Text size="2" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              {errorMessage}
            </Text>
            <Button variant="soft" size="2" onClick={handleReset} style={{ marginTop: 'var(--space-2)' }}>
              Try again
            </Button>
          </Flex>
        )}

        {/* Uploading state */}
        {state === 'uploading' && (
          <Flex direction="column" gap="3" align="center" py="4" data-testid="upload-processing">
            <Loader2 className="animate-spin" style={{ width: 40, height: 40, color: 'var(--color-primary-600)' }} />
            <Text size="3" weight="bold" style={{ color: 'var(--text-primary)' }}>
              {t('processing')}
            </Text>
            {selectedFile && (
              <Text size="2" style={{ color: 'var(--text-secondary)' }}>
                {selectedFile.name}
              </Text>
            )}
          </Flex>
        )}

        {/* Dropzone (idle/dragover states) */}
        {(state === 'idle' || state === 'dragover') && (
          <Box
            {...getRootProps()}
            data-testid="upload-tender-dropzone"
            style={{
              padding: 'var(--space-6)',
              borderRadius: 'var(--radius-3)',
              border: `2px dashed ${isDragActive ? 'var(--color-primary-500)' : 'var(--gray-6)'}`,
              background: isDragActive ? 'var(--color-primary-50)' : 'var(--gray-a2)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <input {...getInputProps()} />
            <Flex direction="column" align="center" gap="3">
              <FileSpreadsheet
                size={36}
                style={{ color: isDragActive ? 'var(--color-primary-600)' : 'var(--gray-9)' }}
              />
              <Text size="2" weight="medium" style={{ color: 'var(--text-primary)', textAlign: 'center' }}>
                {isDragActive ? t('dragActive') : t('dropzone')}
              </Text>
              <Text size="1" style={{ color: 'var(--gray-10)' }}>
                {t('supportedFormats')}
              </Text>
            </Flex>
          </Box>
        )}
      </Flex>
    </Box>
  )
}
