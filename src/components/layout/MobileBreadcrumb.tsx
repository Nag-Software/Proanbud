'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { navLinks } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/auth';
import * as Icons from 'lucide-react';
import { ChevronRight, Menu, X, LogOut } from 'lucide-react';
import { NotificationButton } from '../shared/NotificationButton';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import Image from 'next/image';

type IconName = keyof typeof Icons;

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: string;
}

export const MobileBreadcrumb = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>('');

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Listen to user settings for name updates
  useEffect(() => {
    if (!user?.uid) {
      setDisplayName('');
      return;
    }

    // Set up real-time listener for user settings from database
    const userSettingsRef = ref(db, `users/${user.uid}/userSettings`);
    const unsubscribe = onValue(userSettingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settings = snapshot.val();
        // Use name from database if available
        setDisplayName(settings.name || user.displayName || user.email?.split('@')[0] || 'User');
      } else {
        // Fallback to Firebase Auth displayName
        setDisplayName(user.displayName || user.email?.split('@')[0] || 'User');
      }
    });

    // Cleanup listener on unmount
    return () => {
      off(userSettingsRef, 'value', unsubscribe);
    };
  }, [user]);

  const getCurrentPageInfo = () => {
    const currentNav = navLinks.find(link => link.href === pathname);
    return currentNav || { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' };
  };

  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: 'Dashbord', href: '/dashboard'},
    ];

    const currentPage = getCurrentPageInfo();
    if (currentPage.href !== '/dashboard') {
      items.push({
        label: currentPage.label,
        href: currentPage.href,
        icon: currentPage.icon
      });
    }

    return items;
  };

  const handleLogout = async () => {
    const { error } = await logout();
    if (!error) {
      router.push('/login');
    }
  };

  const getDisplayName = () => {
    return displayName || user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <>
      {/* Mobile Breadcrumb Header */}
      <div className="lg:hidden bg-card border-b border-border rounded-2xl px-4 py-3 shadow-sm mb-2">
        <div className="flex items-center justify-between">
          {/* Breadcrumb */}
          <Image className="w-7 h-7 mr-1" src="./logo/light/icon-primary.svg" alt="Proanbud Logo" width={32} height={32} preload/>
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {breadcrumbItems.map((item, index) => {
              const ItemIcon = Icons[item.icon as IconName] as React.ElementType;
              const isLast = index === breadcrumbItems.length - 1;
              
              return (
                <React.Fragment key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-1 ${
                      isLast 
                        ? 'text-primary font-medium' 
                        : 'text-muted-text hover:text-text'
                    } transition-colors duration-200`}
                  >
                    {ItemIcon && <ItemIcon className="h-4 w-4 flex-shrink-0" />}
                    <span className="text-sm truncate">{item.label}</span>
                  </Link>
                  {!isLast && (
                    <ChevronRight className="h-4 w-4 text-muted-text flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Notification and Menu Button */}
          <div className="flex items-center gap-2">
            <NotificationButton />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 text-muted-text hover:text-text hover:bg-gray-100 rounded-xl transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-105 active:scale-95 backdrop-blur-sm"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay - Apple-style smooth transitions */}
      <div className={`lg:hidden fixed inset-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop - ultra-subtle */}
        <div 
          className={`absolute inset-0 bg-black/8 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Sliding Menu Panel - Apple-like animation */}
        <div className={`fixed inset-y-0 left-0 w-80 max-w-[88vw] bg-white/95 backdrop-blur-xl border-r border-border/30 flex flex-col shadow-2xl transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isMobileMenuOpen 
            ? 'translate-x-0 opacity-100 scale-100' 
            : '-translate-x-full opacity-0 scale-[0.98]'
        }`}>
          {/* Header with enhanced blur */}
          <div className={`h-16 flex items-center justify-between px-5 border-b border-border/30 bg-white/80 backdrop-blur-xl transition-all duration-500 ${
            isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
          }`}
          style={{ transitionDelay: isMobileMenuOpen ? '100ms' : '0ms' }}>
            <div className="flex items-center gap-3">
              <Image src="./logo/light/logo-primary.svg" alt="Proanbud Logo" width={120} height={32} priority/>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2.5 text-muted-text hover:text-foreground hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation with staggered animations */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navLinks.map((link, index) => {
              const LinkIcon = Icons[link.icon as IconName] as React.ElementType;
              const isActive = pathname === link.href;
              
              return (
                <div
                  key={link.href}
                  className={`transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    isMobileMenuOpen 
                      ? 'translate-x-0 opacity-100' 
                      : '-translate-x-6 opacity-0'
                  }`}
                  style={{ 
                    transitionDelay: isMobileMenuOpen ? `${150 + index * 80}ms` : '0ms'
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] transform hover:scale-[1.02] active:scale-[0.98] ${
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
                        : 'text-muted-text hover:bg-gray-100 hover:text-foreground'
                    }`}
                  >
                    {LinkIcon && <LinkIcon className="h-5 w-5 flex-shrink-0" />}
                    <span className="font-medium">{link.label}</span>
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* User Section with slide-up animation */}
          <div className={`p-4 border-t border-border/30 bg-white/60 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          style={{ transitionDelay: isMobileMenuOpen ? '300ms' : '0ms' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center font-bold text-primary border-2 border-primary/10 shadow-sm">
                  {getInitials()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground truncate">{getDisplayName()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-muted-text hover:text-red-600 transition-all duration-200 p-2.5 hover:bg-red-50 rounded-xl hover:scale-105 active:scale-95"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};