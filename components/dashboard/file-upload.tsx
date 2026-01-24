'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, X, Loader2 } from 'lucide-react'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Button, Flex, Text, Box, IconButton, Card } from '@radix-ui/themes'
import { isFileSupported, getFileType } from '@/lib/parser'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  isUploading?: boolean
  disabled?: boolean
}

export function FileUpload({ onFileSelect, isUploading, disabled }: FileUploadProps) {
  const t = useTranslations('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null)
      const file = acceptedFiles[0]
      
      if (!file) return

      if (!isFileSupported(file)) {
        setError('Unsupported file type. Please upload CSV or Excel files.')
        return
      }

      setSelectedFile(file)
      onFileSelect(file)
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: disabled || isUploading,
  })

  const clearFile = () => {
    setSelectedFile(null)
    setError(null)
  }

  return (
    <Flex direction="column" gap="4">
      <Box
        {...getRootProps()}
        style={{
          cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
          borderRadius: 'var(--radius-4)',
          border: `2px dashed ${isDragActive ? 'var(--iris-9)' : 'var(--gray-a6)'}`,
          backgroundColor: isDragActive ? 'var(--iris-3)' : 'transparent',
          padding: '32px',
          textAlign: 'center',
          transition: 'all 0.2s',
          opacity: disabled || isUploading ? 0.5 : 1,
        }}
      >
        <input {...getInputProps()} />
        
        <Flex direction="column" align="center" gap="3">
          {isUploading ? (
            <Loader2 size={40} className="animate-spin" style={{ color: 'var(--iris-9)' }} />
          ) : (
            <Upload size={40} style={{ color: 'var(--gray-9)' }} />
          )}
          
          <Box>
            <Text size="4" weight="medium" style={{ display: 'block' }}>
              {isDragActive ? t('dragActive') : t('dropzone')}
            </Text>
            <Text size="2" color="gray">{t('supportedFormats')}</Text>
          </Box>
        </Flex>
      </Box>

      {error && (
        <Box 
          style={{ 
            backgroundColor: 'var(--red-3)', 
            color: 'var(--red-11)', 
            padding: '12px', 
            borderRadius: 'var(--radius-3)',
            fontSize: 'var(--font-size-2)'
          }}
        >
          {error}
        </Box>
      )}

      {selectedFile && !error && (
        <Card variant="surface">
          <Flex align="center" gap="3">
            <FileSpreadsheet size={32} style={{ color: 'var(--iris-9)' }} />
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text weight="medium" truncate style={{ display: 'block' }}>{selectedFile.name}</Text>
              <Text size="2" color="gray">
                {formatFileSize(selectedFile.size)} • {getFileType(selectedFile).toUpperCase()}
              </Text>
            </Box>
            {!isUploading && (
              <IconButton variant="ghost" color="gray" onClick={(e) => { e.stopPropagation(); clearFile(); }}>
                <X size={16} />
              </IconButton>
            )}
          </Flex>
        </Card>
      )}
    </Flex>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
