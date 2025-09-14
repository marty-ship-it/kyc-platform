import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Login | Kycira",
  description: "Login to Kycira platform",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}