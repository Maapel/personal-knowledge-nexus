import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Personal Knowledge Nexus',
  description: 'A local, gamified documentation library',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-background flex">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
