import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Speech-to-Code AI',
  description: 'Convert speech to code using AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}