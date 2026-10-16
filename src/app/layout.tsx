import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Antico Burger – Prenotazioni",
    template: "%s · Antico Burger",
  },
  description: "Prenota il tuo tavolo da Antico Burger in pochi secondi.",
  applicationName: "Antico Burger",
  appleWebApp: {
    capable: true,
    title: "Antico Burger",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  referrer: "strict-origin-when-cross-origin",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF6F0",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={geistSans.variable}>
      <body className="min-h-dvh">
        <Providers>
          <OfflineBanner />
          {children}
          <Toaster position="top-center" offset={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }} />
          <ServiceWorkerRegistrar />
        </Providers>
      </body>
    </html>
  );
}
