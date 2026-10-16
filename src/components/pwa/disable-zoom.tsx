"use client";

import { useEffect } from "react";

/**
 * iOS Safari ignora `user-scalable=no` del viewport: il pinch-zoom si blocca intercettando
 * gli eventi gesture (solo WebKit) e i pinch con più dita.
 */
export function DisableZoom() {
  useEffect(() => {
    const preventGesture = (event: Event) => event.preventDefault();
    const preventPinch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);
    document.addEventListener("touchmove", preventPinch, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("touchmove", preventPinch);
    };
  }, []);

  return null;
}
