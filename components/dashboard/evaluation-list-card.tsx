import { Flex, Box, Text, Card } from '@radix-ui/themes'
import type { LucideIcon } from 'lucide-react'

export type EvaluationListCardVariant = 'success' | 'warning' | 'danger' | 'info'

export interface EvaluationListCardProps {
  title: string
  items: string[]
  icon: LucideIcon
  variant: EvaluationListCardVariant
}

const variantStyles: Record<EvaluationListCardVariant, { iconBg: string; iconColor: string }> = {
  success: {
    iconBg: 'var(--color-qualified-bg)',
    iconColor: 'var(--color-qualified-text)',
  },
  warning: {
    iconBg: 'var(--color-conditional-bg)',
    iconColor: 'var(--color-conditional-text)',
  },
  danger: {
    iconBg: 'var(--color-excluded-bg)',
    iconColor: 'var(--color-excluded-text)',
  },
  info: {
    iconBg: 'var(--color-info-100, rgba(59, 130, 246, 0.1))',
    iconColor: 'var(--color-info-600, #2563eb)',
  },
}

export function EvaluationListCard({ title, items, icon: Icon, variant }: EvaluationListCardProps) {
  const style = variantStyles[variant]

  return (
    <Card
      className="evaluation-list-card"
      data-variant={variant}
      style={{ background: 'var(--surface-card)' }}
    >
      <Flex direction="column" gap="3">
        {/* Header with icon and title */}
        <Flex align="center" gap="3">
          <Box
            className="evaluation-list-card-icon"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: style.iconBg,
              color: style.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={16} strokeWidth={2} />
          </Box>
          <Text size="2" weight="medium" style={{ color: 'var(--text-primary)' }}>
            {title}
          </Text>
        </Flex>

        {/* Items list */}
        <ul style={{ margin: 0, paddingInlineStart: 20, listStyle: 'none' }}>
          {items.map((item, i) => (
            <li
              key={i}
              style={{
                position: 'relative',
                marginBottom: i === items.length - 1 ? 0 : 8,
                paddingInlineStart: 4,
              }}
            >
              {/* Custom bullet */}
              <Box
                style={{
                  position: 'absolute',
                  insetInlineStart: -16,
                  top: 8,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: style.iconColor,
                  opacity: 0.6,
                }}
              />
              <Text size="2" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {String(item ?? '')}
              </Text>
            </li>
          ))}
        </ul>
      </Flex>
    </Card>
  )
}
