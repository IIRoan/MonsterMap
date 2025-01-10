import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MonsterMap',
  description: 'A user submitted map for where to get Monster Energy',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
