export const metadata = {
  title: 'Tennis Club',
  description: 'Club match log & fines tracker',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
