import type React from "react"
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Michelle & Andres - Wedding Invitation</title>
        <meta name="description" content="Wedding invitation for Michelle and Andres" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}


import './globals.css'

export const metadata = {
      generator: 'v0.app'
    };
