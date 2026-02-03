'use client'

import { useState } from 'react'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Button, Dialog } from '@radix-ui/themes'
import { Upload } from 'lucide-react'
import { UploadTenderForm } from './upload-tender-form'

interface UploadTenderTriggerProps {
  locale?: string
  /** Use distinct testid when multiple triggers on page (e.g. header vs dashboard tools strip). */
  testId?: string
}

/**
 * Toolbar button that opens a dialog with the upload form.
 * Keeps upload accessible when dashboard has tenders (no inline empty state).
 */
const DEFAULT_UPLOAD_TEST_ID = 'upload-tender-button'

export function UploadTenderTrigger({ locale = 'en', testId = DEFAULT_UPLOAD_TEST_ID }: UploadTenderTriggerProps) {
  const tTender = useTranslations('tender')
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="2"
        variant="soft"
        color="gray"
        onClick={() => setOpen(true)}
        data-testid={testId}
        aria-label={tTender('uploadFile')}
      >
        <Upload size={16} style={{ marginInlineEnd: 6 }} />
        {tTender('uploadFile')}
      </Button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content style={{ maxWidth: 520 }} data-testid="upload-tender-dialog">
          <UploadTenderForm
            locale={locale}
            onSuccess={() => setOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}
