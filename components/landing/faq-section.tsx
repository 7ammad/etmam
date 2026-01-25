'use client'

import { useState } from 'react'
import { useTranslations } from '@/components/providers/i18n-provider'
import { Section, Container, Flex, Heading, Text, Card, Box } from '@radix-ui/themes'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function FAQSection() {
  const t = useTranslations('landing')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: t('faq1Question'),
      answer: t('faq1Answer'),
    },
    {
      question: t('faq2Question'),
      answer: t('faq2Answer'),
    },
    {
      question: t('faq3Question'),
      answer: t('faq3Answer'),
    },
    {
      question: t('faq4Question'),
      answer: t('faq4Answer'),
    },
    {
      question: t('faq5Question'),
      answer: t('faq5Answer'),
    },
  ]

  return (
    <Section size="3" py="9" id="faq">
      <Container size="2">
        <Flex direction="column" align="center" gap="6">
          {/* Title */}
          <Heading size="8" weight="bold" align="center">
            {t('faqTitle')}
          </Heading>

          {/* FAQ Items */}
          <Flex direction="column" gap="4" width="100%">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index
              return (
                <Card key={index} className="glass-card" style={{ overflow: 'hidden' }}>
                  <Box
                    asChild
                    style={{
                      cursor: 'pointer',
                      padding: 'var(--space-5)',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'inherit',
                    }}
                  >
                    <button onClick={() => setOpenIndex(isOpen ? null : index)}>
                      <Flex justify="between" align="center" gap="4">
                        <Text size="3" weight="medium" style={{ flex: 1 }}>
                          {faq.question}
                        </Text>
                        {isOpen ? (
                          <ChevronUp style={{ width: '20px', height: '20px', color: 'var(--gray-11)' }} />
                        ) : (
                          <ChevronDown style={{ width: '20px', height: '20px', color: 'var(--gray-11)' }} />
                        )}
                      </Flex>
                    </button>
                  </Box>
                  <Box
                    style={{
                      maxHeight: isOpen ? '500px' : '0',
                      opacity: isOpen ? 1 : 0,
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease, opacity 0.3s ease',
                    }}
                  >
                    <Box style={{ padding: '0 var(--space-5) var(--space-5) var(--space-5)' }}>
                      <Text size="2" color="gray">
                        {faq.answer}
                      </Text>
                    </Box>
                  </Box>
                </Card>
              )
            })}
          </Flex>
        </Flex>
      </Container>
    </Section>
  )
}
