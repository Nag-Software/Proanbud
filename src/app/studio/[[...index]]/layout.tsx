/**
 * Metadata for Sanity Studio route
 * Viktig for å unngå indeksering av Studio i søkemotorer
 */
export const metadata = {
  robots: {
    index: false,
  },
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
