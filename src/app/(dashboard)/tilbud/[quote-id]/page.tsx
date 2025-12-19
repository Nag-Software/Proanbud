"use client";

import { useIsMobile } from '@/hooks/use-mobile';
import DesktopPage from './page.desktop';
import MobilePage from './page.mobile';

export default function Page() {
  if (useIsMobile()) {
    return <MobilePage />;
  }
  return <DesktopPage />;
}