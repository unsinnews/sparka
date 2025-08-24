'use client';

import { useEffect } from 'react';

export function ViewportResizeObserver() {
  useEffect(() => {
    function updateAppHeight() {
      try {
        const height =
          typeof window !== 'undefined' &&
          'visualViewport' in window &&
          window.visualViewport
            ? window.visualViewport.height
            : window.innerHeight;
        document.documentElement.style.setProperty(
          '--app-height',
          `${height}px`,
        );
      } catch {}
    }

    updateAppHeight();
    const vv =
      typeof window !== 'undefined'
        ? (window as any).visualViewport
        : undefined;
    if (vv && typeof vv.addEventListener === 'function') {
      vv.addEventListener('resize', updateAppHeight);
      vv.addEventListener('scroll', updateAppHeight);
    }
    window.addEventListener('resize', updateAppHeight);

    return () => {
      if (vv && typeof vv.removeEventListener === 'function') {
        vv.removeEventListener('resize', updateAppHeight);
        vv.removeEventListener('scroll', updateAppHeight);
      }
      window.removeEventListener('resize', updateAppHeight);
    };
  }, []);

  return null;
}
