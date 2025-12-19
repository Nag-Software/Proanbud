import { userAgent } from 'next/server';
import { headers } from 'next/headers';
import DesktopPage from './page.desktop';
import MobilePage from './page.mobile';

export default async function Page() {
  const headersList = await headers()
  const { device } = userAgent({ headers: headersList } as any)
  const isMobile = device.type === 'mobile'

  console.log('Is Mobile:', isMobile);

  if (isMobile) {
    return <MobilePage />;
  }
  return <DesktopPage />;
}