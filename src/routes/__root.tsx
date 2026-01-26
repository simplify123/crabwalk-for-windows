import React from 'react'
import { HeadContent, Scripts, createRootRoute, Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { motion } from 'framer-motion'
import appCss from '../styles.css?url'
import { Header } from '../components/Header'
import { QueryProvider } from '../integrations/query/provider'
import { queryDevtoolsPlugin } from '../integrations/query/devtools'
import { dbDevtoolsPlugin } from '../integrations/db/devtools'

const devtoolsPlugins = [
  queryDevtoolsPlugin,
  dbDevtoolsPlugin,
]

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Crabwalk' },
      { name: 'theme-color', content: '#0a0a0f' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

// Crab silhouette for 404
function CrabSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 60" className={className} fill="currentColor">
      <ellipse cx="50" cy="35" rx="25" ry="18" />
      <path d="M15 30 Q5 25 8 18 Q12 12 20 15 Q25 18 25 25 Q22 30 15 30Z" />
      <circle cx="8" cy="15" r="5" />
      <path d="M85 30 Q95 25 92 18 Q88 12 80 15 Q75 18 75 25 Q78 30 85 30Z" />
      <circle cx="92" cy="15" r="5" />
      <circle cx="42" cy="25" r="4" fill="#0a0a0f" />
      <circle cx="58" cy="25" r="4" fill="#0a0a0f" />
    </svg>
  )
}

function NotFound() {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-shell-950 texture-grid flex items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-96 h-96 bg-crab-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center px-4"
      >
        {/* Crab icon */}
        <motion.div
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <CrabSilhouette className="w-24 h-24 text-crab-500 crab-icon-glow mx-auto mb-6" />
        </motion.div>

        {/* Arcade 404 */}
        <h1 className="font-arcade text-5xl text-crab-400 glow-red mb-4">
          404
        </h1>

        <p className="font-display text-lg text-gray-400 mb-2 tracking-wide uppercase">
          Page Not Found
        </p>

        <p className="font-console text-shell-500 text-xs mb-8">
          <span className="text-crab-600">&gt;</span> error: the crab wandered off...
        </p>

        <Link to="/" className="btn-retro inline-block rounded-lg text-sm">
          Return Home
        </Link>
      </motion.div>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-shell-950 text-gray-100">
        <QueryProvider>
          <Header />
          {children}
          <TanStackRouterDevtools />
          {devtoolsPlugins.map((plugin, i) => (
            <React.Fragment key={i}>{plugin.render}</React.Fragment>
          ))}
        </QueryProvider>
        <Scripts />
      </body>
    </html>
  )
}
