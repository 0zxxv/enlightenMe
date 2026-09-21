import { useWindowDimensions } from 'react-native';

export type LayoutBreakpoint = 'mobile' | 'tablet' | 'desktop';

/**
 * Shared responsive breakpoints for web + native window sizes.
 * mobile  < 768
 * tablet  768–1023
 * desktop ≥ 1024
 */
export function useLayout() {
  const { width, height } = useWindowDimensions();

  const breakpoint: LayoutBreakpoint =
    width >= 1024 ? 'desktop' : width >= 768 ? 'tablet' : 'mobile';

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop';

  const contentMaxWidth = isDesktop ? 1120 : isTablet ? 840 : undefined;
  const contentPadding = isDesktop ? 32 : isTablet ? 28 : 20;

  const courseColumns = isDesktop ? 4 : isTablet ? 3 : 2;
  const subjectColumns = isDesktop ? 8 : isTablet ? 6 : 4;

  return {
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    contentMaxWidth,
    contentPadding,
    courseColumns,
    subjectColumns,
  };
}
