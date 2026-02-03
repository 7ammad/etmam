'use client'

import { Flex, Box, Text, Tooltip } from '@radix-ui/themes'
import { FileText, BarChart3, Sparkle } from 'lucide-react'

export interface AiPriceBlockProps {
  /** Official booklet price if available */
  bookletPrice: number | null
  /** Tender estimate (from tender or effective value) */
  tenderEstimate: number | null
  /** AI predicted value (predicted_value_sar) */
  predictedValueSar: number | null
  locale: string
  labels: {
    financials: string
    officialBooklet: string
    tenderEstimate: string
    aiModelEstimate: string
    tooltip: string
  }
}

function formatSar(value: number, locale: string): string {
  const numberLocale = locale === 'ar' ? 'ar-SA' : 'en'
  return (
    new Intl.NumberFormat(numberLocale, {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' SAR'
  )
}

export function AiPriceBlock({
  bookletPrice,
  tenderEstimate,
  predictedValueSar,
  locale,
  labels,
}: AiPriceBlockProps) {
  const reference = bookletPrice ?? tenderEstimate
  const financialsLabel = labels.financials ?? 'Financials'
  const showVariance =
    reference != null &&
    reference > 0 &&
    predictedValueSar != null &&
    Math.abs((predictedValueSar - reference) / reference) > 0.2
  const variancePct =
    reference != null && reference > 0 && predictedValueSar != null
      ? Math.round(((predictedValueSar - reference) / reference) * 100)
      : null

  return (
    <Box
      style={{
        marginTop: 'var(--space-4)',
        paddingTop: 'var(--space-3)',
        borderTop: '1px solid var(--border-default)',
      }}
    >
      <Text size="1" weight="bold" style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)', display: 'block' }}>
        {financialsLabel}
      </Text>
      <Flex direction="column" gap="2">
        {bookletPrice != null && (
          <Flex justify="between" align="center" gap="2">
            <Flex align="center" gap="2">
              <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />
              <Text size="2" style={{ color: 'var(--text-secondary)' }}>{labels.officialBooklet}</Text>
            </Flex>
            <Text size="2" weight="medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatSar(bookletPrice, locale)}</Text>
          </Flex>
        )}
        {tenderEstimate != null && (
          <Flex justify="between" align="center" gap="2">
            <Flex align="center" gap="2">
              <BarChart3 size={14} style={{ color: 'var(--text-tertiary)' }} />
              <Text size="2" style={{ color: 'var(--text-secondary)' }}>{labels.tenderEstimate}</Text>
            </Flex>
            <Text size="2" weight="medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatSar(tenderEstimate, locale)}</Text>
          </Flex>
        )}
        {predictedValueSar != null && (
          <Flex justify="between" align="center" gap="2">
            <Tooltip content={labels.tooltip}>
              <Flex align="center" gap="2">
                <Sparkle size={14} style={{ color: 'var(--color-primary-500)' }} />
                <Text size="2" style={{ color: 'var(--text-secondary)' }}>{labels.aiModelEstimate}</Text>
              </Flex>
            </Tooltip>
            <Text size="2" weight="bold" style={{ color: 'var(--color-primary-500)', fontVariantNumeric: 'tabular-nums' }}>{formatSar(predictedValueSar, locale)}</Text>
          </Flex>
        )}
        {showVariance && variancePct != null && (
          <Text size="1" style={{ color: 'var(--color-conditional-text)' }}>
            Variance: {variancePct > 0 ? '+' : ''}{variancePct}% from estimate
          </Text>
        )}
      </Flex>
    </Box>
  )
}
