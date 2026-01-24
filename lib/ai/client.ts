import { createOpenAI } from '@ai-sdk/openai'

// AI Provider types
export type AIProviderType = 'deepseek' | 'openai'

// Provider configurations
const providers = {
  deepseek: () =>
    createOpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    }),
  openai: () =>
    createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
}

// Model mappings for each provider
const modelMappings: Record<AIProviderType, string> = {
  deepseek: 'deepseek-chat',
  openai: 'gpt-4o-mini',
}

// Get the current AI provider from environment
export function getAIProvider(): AIProviderType {
  const provider = process.env.AI_PROVIDER as AIProviderType
  if (provider && providers[provider]) {
    return provider
  }
  return 'deepseek' // Default to DeepSeek
}

// Get the AI model instance
export function getAIModel() {
  const providerType = getAIProvider()
  const provider = providers[providerType]()
  const modelName = modelMappings[providerType]
  return provider(modelName)
}

// Get the model name for logging/storage
export function getModelName(): string {
  const providerType = getAIProvider()
  return modelMappings[providerType]
}

// Check if AI is configured
export function isAIConfigured(): boolean {
  const provider = getAIProvider()
  switch (provider) {
    case 'deepseek':
      return !!process.env.DEEPSEEK_API_KEY
    case 'openai':
      return !!process.env.OPENAI_API_KEY
    default:
      return false
  }
}
