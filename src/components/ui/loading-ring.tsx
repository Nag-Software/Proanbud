import React from 'react';

interface LoadingRingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const LoadingRing: React.FC<LoadingRingProps> = ({
  size = 'md',
  color = 'blue',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    white: 'border-white',
    green: 'border-green-600',
    red: 'border-red-600'
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-transparent border-t-2 ${colorClasses[color as keyof typeof colorClasses]} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};