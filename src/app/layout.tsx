import { WagmiProvider } from '@/providers/WagmiProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider>
          {children}
        </WagmiProvider>
      </body>
    </html>
  )
} 