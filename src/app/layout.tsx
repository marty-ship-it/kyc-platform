import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Kycira | Premium AML/CTF Compliance Platform",
  description: "Intelligent compliance management for modern real estate agencies. Streamlined KYC, automated screening, and regulatory reporting.",
  keywords: ["AML", "CTF", "compliance", "KYC", "real estate", "AUSTRAC", "risk assessment"],
  authors: [{ name: "Kycira" }],
  creator: "Kycira",
  publisher: "Kycira",
  metadataBase: new URL('https://kycira.com'),
  openGraph: {
    title: "Kycira | Premium AML/CTF Compliance Platform",
    description: "Intelligent compliance management for modern real estate agencies",
    type: "website",
    locale: "en_AU",
    siteName: "Kycira",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kycira | Premium AML/CTF Compliance Platform",
    description: "Intelligent compliance management for modern real estate agencies",
    creator: "@kycira",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased min-h-screen">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
