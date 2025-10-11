'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { navLinks } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/auth';
import * as Icons from 'lucide-react';
import { LogOut } from 'lucide-react';
import Logo from '../shared/Logo';
import { NotificationButton } from '../shared/NotificationButton';
import { LimitCounters } from '../subscription/LimitCounters';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';

type IconName = keyof typeof Icons;

interface NavLinkProps {
  href: string;
  label: string;
  icon: string;
}

const NavLink: React.FC<NavLinkProps> = ({ href, label, icon }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const Icon = Icons[icon as IconName] as React.ElementType;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-text hover:bg-gray-100'
      }`}
    >
      {Icon && <Icon className="h-5 w-5" />}
      <span className="font-medium">{label}</span>
    </Link>
  );
};

export const Sidebar = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>('');

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

  return (
    <aside className="hidden lg:flex w-[280px] bg-card border-r border-border flex-col h-screen">
      <div className="h-20 flex items-center justify-between px-6 border-b border-border">
        <Logo size="md"/>
        <div className="flex items-center gap-2">
          <NotificationButton />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navLinks.map((link) => (
          <NavLink key={link.href} {...link} />
        ))}
      </nav>

      {/* Limit Counters */}
      <LimitCounters />

      {/* User Card */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-primary">
              {getInitials()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-text">{getDisplayName()}</p>
              <p className="text-xs text-muted-text">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-muted-text hover:text-text transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};