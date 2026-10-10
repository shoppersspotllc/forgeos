'use client';

/**
 * FreshTurn JsGuard — marks <html> when JS runs so CSS reveal animations
 * only hide content when the JS that reveals it is actually present.
 */
import { useEffect } from 'react';

export default function JsGuard() {
  useEffect(() => {
    document.documentElement.classList.add('ft-js');
  }, []);
  return null;
}
