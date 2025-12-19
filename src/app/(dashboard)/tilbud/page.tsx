"use client";

import DesktopPage from './page.desktop';
import MobilePage from './page.mobile';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Page() {
  if (useIsMobile()) {
    return <MobilePage />;
  }
  return <DesktopPage />;
}