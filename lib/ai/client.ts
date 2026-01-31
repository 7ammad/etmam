import { createOpenAI } from '@ai-sdk/openai'
import { generateObject, APICallError, NoObjectGeneratedError } from 'ai'
import { oracleOutputSchema, type OracleOutput } from './schemas'

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

/**
 * Generate Oracle output using AI SDK's generateObject
 * This function uses structured outputs to ensure the AI returns
 * data matching the oracleOutputSchema.
 * 
 * Includes proper error handling per ai-sdk-core best practices:
 * - Handles AI_APICallError (rate limits, network, auth)
 * - Handles AI_NoObjectGeneratedError (schema validation failures)
 * - Implements retry logic with exponential backoff
 */
export async function generateOracleOutput(
  prompt: string,
  systemPrompt?: string,
  maxRetries: number = 3
): Promise<OracleOutput> {
  const model = getAIModel()
  let lastError: unknown = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await generateObject({
        model,
        schema: oracleOutputSchema,
        prompt,
        system: systemPrompt,
        temperature: 0.3, // Lower temperature for consistent structured output
        maxRetries: 0, // We handle retries manually
      })
      return result.object
    } catch (error: unknown) {
      lastError = error

      // Handle specific AI SDK errors per ai-sdk-core skill
      if (error instanceof APICallError) {
        const statusCode = error.statusCode
        // Rate limit (429) - exponential backoff
        if (statusCode === 429) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000) // Max 10s
          console.warn(`[Oracle] Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        // Server errors (5xx) - retry with backoff
        if (statusCode && statusCode >= 500) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          console.warn(`[Oracle] Server error ${statusCode}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        // Auth errors (401) - don't retry
        if (statusCode === 401) {
          throw new Error(`AI API authentication failed: ${error.message}`)
        }

        // Other 4xx errors - don't retry
        throw new Error(`AI API call failed: ${error.message}${statusCode ? ` (status: ${statusCode})` : ''}`)
      }

      // Handle schema validation failures
      if (error instanceof NoObjectGeneratedError) {
        console.error('[Oracle] Model failed to generate valid object matching schema')
        // Don't retry - schema issues won't be fixed by retrying
        throw new Error(`AI failed to generate valid Oracle output: ${error.message}. Consider simplifying the schema or providing more context in the prompt.`)
      }

      // Network/timeout errors - retry with backoff
      if (error instanceof Error && (
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT')
      )) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
        console.warn(`[Oracle] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // Unknown error - don't retry
      throw error
    }
  }

  // All retries exhausted
  const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error'
  throw new Error(`Failed to generate Oracle output after ${maxRetries} attempts: ${errorMessage}`)
}
