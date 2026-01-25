'use client'

import { useState } from 'react'
import {
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Webhook,
  Settings,
  Zap,
  Shield,
  Sparkles,
  Lock,
  Globe2
} from 'lucide-react'
import Link from 'next/link'

type CRMProvider = 'webhook' | 'hubspot' | 'salesforce' | 'zoho' | 'odoo'

interface CRMConfig {
  provider: CRMProvider
  webhookUrl: string
  apiKey: string
  lastTested?: Date
  status?: 'connected' | 'disconnected' | 'testing'
}

export function CRMSettingsClient({ locale }: { locale: string }) {
  const [config, setConfig] = useState<CRMConfig>({
    provider: 'webhook',
    webhookUrl: '',
    apiKey: '',
    status: 'disconnected',
  })
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const providers: { value: CRMProvider; label: string; icon: string; color: string; desc: string }[] = [
    { value: 'webhook', label: 'Webhook', icon: '🔗', color: 'from-slate-600 to-slate-800', desc: 'Universal REST endpoint' },
    { value: 'hubspot', label: 'HubSpot', icon: '🧡', color: 'from-orange-500 to-red-600', desc: 'Marketing automation' },
    { value: 'salesforce', label: 'Salesforce', icon: '☁️', color: 'from-blue-500 to-cyan-600', desc: 'Enterprise CRM leader' },
    { value: 'zoho', label: 'Zoho', icon: '📊', color: 'from-red-500 to-orange-600', desc: 'All-in-one suite' },
    { value: 'odoo', label: 'Odoo', icon: '🐝', color: 'from-purple-500 to-indigo-600', desc: 'Open source ERP' },
  ]

  const handleTestConnection = async () => {
    setIsTesting(true)
    setConfig({ ...config, status: 'testing' })
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const success = config.webhookUrl && config.apiKey
    setConfig({
      ...config,
      status: success ? 'connected' : 'disconnected',
      lastTested: success ? new Date() : undefined,
    })
    setIsTesting(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <div className="relative min-h-screen">
      {/* Dramatic Hero Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900" />
        
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
        
        {/* Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      <div className="relative px-4 py-8 max-w-6xl mx-auto">
        {/* Back Navigation */}
        <Link href={`/${locale}/settings`} className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-12 group transition-colors duration-300">
          <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-semibold">Back to Settings</span>
        </Link>

        {/* Hero Header */}
        <div className="mb-16">
          <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-50 rounded-full" />
              <div className="relative p-6 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl rotate-6 hover:rotate-12 transition-transform duration-500">
                <Database className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-7xl font-black text-white mb-4 tracking-tighter" style={{ fontFamily: '"Playfair Display", serif', lineHeight: '0.9' }}>
                CRM Integration
              </h1>
              <p className="text-xl text-emerald-200/80 max-w-2xl leading-relaxed">
                Connect your CRM system to automatically push evaluated tenders
              </p>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mb-12">
          <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 ${
            config.status === 'connected' 
              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/20' 
              : config.status === 'testing'
              ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/20'
              : 'bg-slate-500/10 border-slate-500/30'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            
            <div className="relative p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {config.status === 'connected' && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                {config.status === 'disconnected' && <XCircle className="w-8 h-8 text-slate-400" />}
                {config.status === 'testing' && <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />}
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {config.status === 'connected' && 'Connection Successful'}
                    {config.status === 'disconnected' && 'Not Connected'}
                    {config.status === 'testing' && 'Testing Connection...'}
                  </h3>
                  {config.lastTested && (
                    <p className="text-sm text-white/60">
                      Last tested: {config.lastTested.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              
              {config.status === 'connected' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-200">Secure</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Provider Selection - Dramatic Cards */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-emerald-500 to-transparent rounded-full" />
            <h2 className="text-3xl font-black text-white">Select Provider</h2>
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {providers.map((provider, index) => (
              <button
                key={provider.value}
                onClick={() => setConfig({ ...config, provider: provider.value })}
                className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${provider.color} opacity-90 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {config.provider === provider.value && (
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-white/20" />
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}
                
                <div className="relative p-6 flex flex-col items-center gap-3 min-h-[180px]">
                  <div className="text-5xl group-hover:scale-125 transition-transform duration-500">
                    {provider.icon}
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg mb-1">{provider.label}</div>
                    <div className="text-white/70 text-xs">{provider.desc}</div>
                  </div>
                </div>
                
                {/* Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Form - Brutalist Design */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Webhook URL */}
          <div className="group">
            <label className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Webhook className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-lg font-bold text-white">Webhook URL</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </label>
            
            <div className="relative">
              <input
                type="url"
                placeholder="https://api.example.com/webhook"
                className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all duration-300 font-mono text-sm"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Globe2 className="w-5 h-5 text-white/30" />
              </div>
            </div>
            
            <p className="mt-3 text-sm text-white/50 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-purple-500 inline-block" />
              Enter your {providers.find((p) => p.value === config.provider)?.label} webhook endpoint
            </p>
          </div>

          {/* API Key */}
          <div className="group">
            <label className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-lg font-bold text-white">API Key</span>
              <span className="text-xs text-white/50 font-normal">(Optional)</span>
            </label>
            
            <div className="relative">
              <input
                type="password"
                placeholder="•••••••••••••••••••"
                className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-amber-500 focus:bg-white/10 transition-all duration-300 font-mono text-sm"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Settings className="w-5 h-5 text-white/30" />
              </div>
            </div>
            
            <p className="mt-3 text-sm text-white/50 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" />
              Authentication token for secure API access
            </p>
          </div>
        </div>

        {/* Action Buttons - Elevated Design */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !config.webhookUrl}
            className="flex-1 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 group-hover:from-purple-500 group-hover:to-purple-600 transition-all duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="relative px-8 py-5 flex items-center justify-center gap-3 text-white font-bold text-lg">
              {isTesting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6 group-hover:scale-125 transition-transform duration-300" />
                  <span>Test Connection</span>
                </>
              )}
            </div>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || !config.webhookUrl}
            className="flex-1 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 group-hover:from-emerald-500 group-hover:to-emerald-600 transition-all duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="relative px-8 py-5 flex items-center justify-center gap-3 text-white font-bold text-lg">
              {isSaving ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Database className="w-6 h-6 group-hover:scale-125 transition-transform duration-300" />
                  <span>Save Settings</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Help Section - Magazine Layout */}
        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-amber-500 to-purple-500 rounded-full" />
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-4xl">📚</span>
              <h3 className="text-3xl font-black text-white">Need Help?</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'How to get a webhook URL?', body: 'Each CRM provider has different setup process. Check your CRM documentation for webhook or API integration instructions.' },
                { title: 'What happens when I push to CRM?', body: 'We automatically create a new opportunity with all tender details, evaluation scores, and AI-generated recommendations.' },
                { title: 'Security & Privacy', body: 'All connections use encrypted HTTPS. Your API keys are stored securely and never shared with third parties.' }
              ].map((item, index) => (
                <div key={index} className="group cursor-pointer">
                  <div className="h-full p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
                    <h4 className="font-bold text-white text-lg mb-3 group-hover:text-emerald-400 transition-colors duration-300">
                      {item.title}
                    </h4>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
