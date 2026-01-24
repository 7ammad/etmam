'use client'

import { useTranslations } from '@/components/providers/i18n-provider'
import { Link } from '@/i18n/routing'
import {
  Settings2,
  Palette,
  Globe,
  Bell,
  Database,
  User,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react'

interface SettingsClientProps {
  locale: string
}

export function SettingsClient({ locale }: SettingsClientProps) {
  const t = useTranslations('settings')

  const settingsCards = [
    {
      title: 'General Settings',
      description: 'Manage your account preferences',
      icon: Settings2,
      href: '#general',
      gradient: 'from-slate-900 via-slate-800 to-slate-700',
      accentColor: 'rgb(148, 163, 184)',
      delay: '0ms',
    },
    {
      title: 'CRM Integration',
      description: 'Connect your CRM system',
      icon: Database,
      href: `/${locale}/settings/crm`,
      gradient: 'from-emerald-900 via-emerald-700 to-emerald-600',
      accentColor: 'rgb(52, 211, 153)',
      delay: '100ms',
    },
    {
      title: 'Language',
      description: 'Select your preferred language',
      icon: Globe,
      href: '#language',
      gradient: 'from-purple-900 via-purple-700 to-purple-600',
      accentColor: 'rgb(192, 132, 252)',
      delay: '200ms',
    },
    {
      title: 'Theme',
      description: 'Customize your interface',
      icon: Palette,
      href: '#theme',
      gradient: 'from-amber-900 via-amber-700 to-amber-600',
      accentColor: 'rgb(251, 191, 36)',
      delay: '300ms',
    },
    {
      title: 'Account',
      description: 'Update your profile',
      icon: User,
      href: '#account',
      gradient: 'from-pink-900 via-pink-700 to-pink-600',
      accentColor: 'rgb(244, 114, 182)',
      delay: '400ms',
    },
    {
      title: 'Notifications',
      description: 'Manage alerts and emails',
      icon: Bell,
      href: '#notifications',
      gradient: 'from-orange-900 via-orange-700 to-orange-600',
      accentColor: 'rgb(251, 146, 60)',
      delay: '500ms',
    },
  ]

  return (
    <div className="relative min-h-screen">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-amber-50/20 dark:from-slate-950 dark:via-emerald-950/30 dark:to-amber-950/20" />
        <div className="absolute top-0 -left-4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        
        {/* Geometric Pattern Overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.015] dark:opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative">
        {/* Hero Header with Dramatic Typography */}
        <div className="mb-16 pt-8">
          <div className="relative">
            {/* Decorative Element */}
            <div className="absolute -top-8 -left-8 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-amber-500/20 rounded-full blur-2xl" />
            
            <div className="relative">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-emerald-900 to-amber-900 dark:from-slate-100 dark:via-emerald-100 dark:to-amber-100"
                  style={{ 
                    fontFamily: locale === 'ar' ? '"Noto Kufi Arabic", sans-serif' : '"Playfair Display", serif',
                    lineHeight: '0.9',
                    textShadow: '0 1px 2px rgb(0 0 0 / 0.05)'
                  }}>
                Settings
              </h1>
              
              <div className="flex items-center gap-4 mt-6">
                <div className="h-1 w-16 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full" />
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl" style={{ fontFamily: locale === 'ar' ? '"IBM Plex Sans Arabic", sans-serif' : 'system-ui, sans-serif' }}>
                  Manage your account preferences and application settings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Asymmetric Grid - Breaking Convention */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          {/* Featured CRM Card - Spans 2 columns */}
          <Link href={settingsCards[1].href} className="lg:col-span-5 group block" style={{ animationDelay: settingsCards[1].delay }}>
            <div className="relative h-full overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:rotate-[-0.5deg] hover:shadow-2xl"
                 style={{ 
                   background: `linear-gradient(135deg, ${settingsCards[1].gradient.split(' ').join(', ')})`,
                   border: '1px solid rgba(255,255,255,0.1)'
                 }}>
              {/* Noise Texture */}
              <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")' }} />
              
              <div className="relative p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-6">
                    <Sparkles className="w-3 h-3 text-emerald-200" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">Featured</span>
                  </div>
                  
                  <Database className="w-16 h-16 text-white mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500" />
                  
                  <h3 className="text-3xl font-black text-white mb-3 group-hover:tracking-wide transition-all duration-300">
                    {settingsCards[1].title}
                  </h3>
                  <p className="text-emerald-100 leading-relaxed">{settingsCards[1].description}</p>
                </div>
                
                <div className="flex items-center text-white font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  <span>{locale === 'ar' ? 'إعداد الآن' : 'Configure Now'}</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
                  </svg>
                </div>
              </div>
              
              {/* Animated Border Gradient */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{ background: 'linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.3), transparent)', backgroundSize: '200% 100%' }}>
                <div className="absolute inset-[1px] rounded-3xl" style={{ background: 'inherit' }} />
              </div>
            </div>
          </Link>

          {/* Other Cards in Asymmetric Layout */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {settingsCards.filter((_, i) => i !== 1).map((setting, idx) => {
              const Icon = setting.icon
              
              return (
                <Link 
                  key={setting.title} 
                  href={setting.href}
                  className="group block"
                  style={{ 
                    animationDelay: setting.delay,
                    gridColumn: idx === 0 ? 'span 2' : 'span 1'
                  }}
                >
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1 h-full">
                    {/* Gradient Accent Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                         style={{ backgroundImage: `linear-gradient(90deg, ${setting.gradient.split(' ').join(', ')})` }} />
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`}
                             style={{ backgroundColor: `${setting.accentColor}15` }}>
                          <Icon className="w-6 h-6 transition-colors duration-300" style={{ color: setting.accentColor }} />
                        </div>
                        
                        <Zap className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:translate-x-1 transition-transform duration-300">
                        {setting.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {setting.description}
                      </p>
                    </div>
                    
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-3xl"
                           style={{ backgroundColor: `${setting.accentColor}20` }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Interactive Settings Panel with Brutalist Design */}
        <div id="general" className="relative mb-12">
          <div className="absolute -left-12 top-0 bottom-0 w-2 bg-gradient-to-b from-emerald-500 via-amber-500 to-pink-500 rounded-full" />
          
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-2xl">
            {/* Bold Header Bar */}
            <div className="relative h-24 bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 dark:from-slate-800 dark:via-emerald-800 dark:to-slate-800 flex items-center px-8">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }} />
              <Shield className="w-8 h-8 text-emerald-400 mr-4" />
              <h2 className="text-2xl font-black text-white tracking-tight">General Settings</h2>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Language Selection with Dramatic Buttons */}
              <div id="language" className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <div className="w-1 h-4 bg-purple-500 rounded-full" />
                  Language
                </label>
                <div className="flex gap-3">
                  {[
                    { code: 'ar', label: 'العربية', active: locale === 'ar' },
                    { code: 'en', label: 'English', active: locale === 'en' }
                  ].map((lang) => (
                    <Link key={lang.code} href={`/${lang.code}/settings`} className="flex-1">
                      <button className={`w-full relative overflow-hidden px-6 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                        lang.active 
                          ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}>
                        <span className="relative z-10">{lang.label}</span>
                        {lang.active && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        )}
                      </button>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Theme Selection */}
              <div id="theme" className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <div className="w-1 h-4 bg-amber-500 rounded-full" />
                  Theme
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border-l-4 border-amber-500">
                  💡 Use the theme toggle in the header to switch between light and dark modes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CRM Quick Access with Floating Design */}
        <Link href={`/${locale}/settings/crm`} className="block group">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-8 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:scale-[1.02]">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Database className="w-8 h-8 text-emerald-200" />
                  <h3 className="text-3xl font-black text-white">CRM Integration</h3>
                </div>
                <p className="text-emerald-100 text-lg mb-6 max-w-xl">Connect your CRM system to automatically push evaluated tenders</p>
                
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-900 rounded-full font-bold hover:bg-emerald-50 transition-colors duration-300 group-hover:gap-4">
                  <span>Configure CRM</span>
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={locale === 'ar' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
                  </svg>
                </div>
              </div>
              
              {/* Floating Icon */}
              <div className="hidden lg:block">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 bg-white/10 rounded-3xl rotate-12 group-hover:rotate-45 transition-transform duration-700" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Database className="w-16 h-16 text-white group-hover:scale-125 transition-transform duration-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
