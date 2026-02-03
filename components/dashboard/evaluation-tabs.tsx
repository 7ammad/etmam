'use client'

import { useState } from 'react'
import { Flex, Box, Text, Tabs } from '@radix-ui/themes'
import { FileText, CheckCircle, AlertTriangle, XCircle, ListChecks } from 'lucide-react'
import { EvaluationListCard } from './evaluation-list-card'

export type EvaluationTabId = 'summary' | 'strengths' | 'risks' | 'requirements' | 'actions'

export interface EvaluationTabsProps {
  summary: string | null
  strengths: string[] | null
  risks: string[] | null
  missingRequirements: string[] | null
  actionItems: string[] | null
  labels: {
    summary: string
    strengths: string
    risks: string
    requirements: string
    actions: string
    noDataAvailable: string
  }
}

export function EvaluationTabs({
  summary,
  strengths,
  risks,
  missingRequirements,
  actionItems,
  labels,
}: EvaluationTabsProps) {
  const [value, setValue] = useState<EvaluationTabId>('summary')

  const summaryText = summary != null && String(summary).trim() !== '' ? String(summary).trim() : null
  const strengthsList = strengths && Array.isArray(strengths) && strengths.length > 0 ? strengths.map(String) : null
  const risksList = risks && Array.isArray(risks) && risks.length > 0 ? risks.map(String) : null
  const missingList = missingRequirements && Array.isArray(missingRequirements) && missingRequirements.length > 0 ? missingRequirements.map(String) : null
  const actionList = actionItems && Array.isArray(actionItems) && actionItems.length > 0 ? actionItems.map(String) : null

  function renderTabContent() {
    switch (value) {
      case 'summary':
        return summaryText ? (
          <Text size="2" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {summaryText}
          </Text>
        ) : (
          <Text size="2" style={{ color: 'var(--text-tertiary)' }}>{labels.noDataAvailable}</Text>
        )
      case 'strengths':
        return strengthsList ? (
          <EvaluationListCard title={labels.strengths} items={strengthsList} icon={CheckCircle} variant="success" />
        ) : (
          <Text size="2" style={{ color: 'var(--text-tertiary)' }}>{labels.noDataAvailable}</Text>
        )
      case 'risks':
        return risksList ? (
          <EvaluationListCard title={labels.risks} items={risksList} icon={AlertTriangle} variant="warning" />
        ) : (
          <Text size="2" style={{ color: 'var(--text-tertiary)' }}>{labels.noDataAvailable}</Text>
        )
      case 'requirements':
        return missingList ? (
          <EvaluationListCard title={labels.requirements} items={missingList} icon={XCircle} variant="danger" />
        ) : (
          <Text size="2" style={{ color: 'var(--text-tertiary)' }}>{labels.noDataAvailable}</Text>
        )
      case 'actions':
        return actionList ? (
          <EvaluationListCard title={labels.actions} items={actionList} icon={ListChecks} variant="info" />
        ) : (
          <Text size="2" style={{ color: 'var(--text-tertiary)' }}>{labels.noDataAvailable}</Text>
        )
      default:
        return null
    }
  }

  return (
    <Tabs.Root value={value} onValueChange={(v) => setValue(v as EvaluationTabId)}>
      <Tabs.List style={{ marginBottom: 'var(--space-3)' }}>
        <Tabs.Trigger value="summary">
          <FileText size={14} style={{ marginInlineEnd: 6 }} />
          {labels.summary}
        </Tabs.Trigger>
        <Tabs.Trigger value="strengths">{labels.strengths}</Tabs.Trigger>
        <Tabs.Trigger value="risks">{labels.risks}</Tabs.Trigger>
        <Tabs.Trigger value="requirements">{labels.requirements}</Tabs.Trigger>
        <Tabs.Trigger value="actions">{labels.actions}</Tabs.Trigger>
      </Tabs.List>
      <Box style={{ padding: 'var(--space-3) 0', minHeight: 80 }}>
        {renderTabContent()}
      </Box>
    </Tabs.Root>
  )
}
