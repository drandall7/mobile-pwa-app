import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WorkoutSync",
  description: "Coordinate workouts with friends",
  keywords: ["fitness", "workout", "social", "friends", "gym", "exercise"],
  authors: [{ name: "WorkoutSync Team" }],
  creator: "WorkoutSync",
  publisher: "WorkoutSync",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WorkoutSync",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Mobile viewport configuration */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
        {/* PWA meta tags */}
        <meta name="theme-color" content="#4F46E5" />
        <meta name="application-name" content="WorkoutSync" />
        <meta name="apple-mobile-web-app-title" content="WorkoutSync" />
        <meta name="msapplication-TileColor" content="#4F46E5" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple mobile web app meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Manifest link */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.svg" />
        
        {/* Standard favicons */}
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/icons/icon-32x32.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/icons/icon-16x16.svg" />
        <link rel="shortcut icon" href="/icons/icon-32x32.svg" />
        
        {/* Prevent zoom on input focus (iOS) */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
