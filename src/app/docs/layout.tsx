import { source } from '@/lib/source';
import type { ReactNode } from 'react';
import './style.css';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { RootProvider } from 'fumadocs-ui/provider/next';

export default function Layout({ children }: { children: ReactNode }) {
  return (
      <body
        // required styles
        className="flex flex-col min-h-screen"
        suppressHydrationWarning

      >
        <RootProvider>
          <DocsLayout tree={source.pageTree} {...baseOptions()}>
            {children}
          </DocsLayout>
        </RootProvider>
      </body>
  );
}