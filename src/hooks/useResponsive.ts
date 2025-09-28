import { useState, useEffect } from 'react';

interface BreakpointValues {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  xxl: boolean;
}

interface ViewportSize {
  width: number;
  height: number;
}

export const useBreakpoint = (): BreakpointValues => {
  const [breakpoints, setBreakpoints] = useState<BreakpointValues>({
    xs: false,
    sm: false,
    md: false,
    lg: false,
    xl: false,
    xxl: false,
  });

  useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      setBreakpoints({
        xs: width < 480,
        sm: width >= 480 && width < 768,
        md: width >= 768 && width < 1024,
        lg: width >= 1024 && width < 1280,
        xl: width >= 1280 && width < 1536,
        xxl: width >= 1536,
      });
    };

    updateBreakpoints();
    window.addEventListener('resize', updateBreakpoints);
    return () => window.removeEventListener('resize', updateBreakpoints);
  }, []);

  return breakpoints;
};

export const useViewportSize = (): ViewportSize => {
  const [size, setSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
};

export const useIsMobile = (): boolean => {
  const breakpoints = useBreakpoint();
  return breakpoints.xs || breakpoints.sm;
};

export const useIsTablet = (): boolean => {
  const breakpoints = useBreakpoint();
  return breakpoints.md;
};

export const useIsDesktop = (): boolean => {
  const breakpoints = useBreakpoint();
  return breakpoints.lg || breakpoints.xl || breakpoints.xxl;
};

// Dashboard-specific layout hooks
export const useKpiLayout = (itemCount: number = 4) => {
  const breakpoints = useBreakpoint();
  
  if (breakpoints.xs) return '1x4'; // Mobile: stack vertically
  if (breakpoints.sm) return '2x2'; // Small tablet: 2x2 grid
  if (breakpoints.md) return itemCount <= 2 ? '2x1' : '2x2'; // Medium: adaptive
  return '4x1'; // Large screens: horizontal
};

export const useGridCols = (maxCols: number = 4) => {
  const breakpoints = useBreakpoint();
  
  if (breakpoints.xs) return 1;
  if (breakpoints.sm) return Math.min(2, maxCols);
  if (breakpoints.md) return Math.min(2, maxCols);
  if (breakpoints.lg) return Math.min(3, maxCols);
  return Math.min(4, maxCols);
};

export const useChartHeight = () => {
  const breakpoints = useBreakpoint();
  
  if (breakpoints.xs) return 200;
  if (breakpoints.sm) return 250;
  if (breakpoints.md) return 300;
  return 350;
};

// Utility function to get responsive class names
export const useResponsiveClasses = (
  baseClasses: string,
  responsiveMap: Partial<Record<keyof BreakpointValues, string>>
) => {
  const breakpoints = useBreakpoint();
  let classes = baseClasses;
  
  Object.entries(responsiveMap).forEach(([breakpoint, classNames]) => {
    if (breakpoints[breakpoint as keyof BreakpointValues] && classNames) {
      classes += ` ${classNames}`;
    }
  });
  
  return classes;
};

// Dashboard layout detector
export const useDashboardLayout = () => {
  const breakpoints = useBreakpoint();
  const { width } = useViewportSize();
  
  return {
    isMobile: breakpoints.xs || breakpoints.sm,
    isTablet: breakpoints.md,
    isDesktop: breakpoints.lg || breakpoints.xl || breakpoints.xxl,
    canEdit: width >= 768, // Edit mode only available on tablet and up
    preferCompact: width < 1024, // Use compact layouts on smaller screens
    sidebarMode: width < 1024 ? 'overlay' : 'side', // Sidebar behavior
    cardPadding: width < 768 ? 'p-3' : 'p-4', // Adaptive padding
    textSize: width < 768 ? 'text-sm' : 'text-base', // Adaptive text
  };
};