import type { Metadata } from "next";
import { Toaster } from "sonner";
import { SupportButton } from "@/components/support-button";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} — PDV Online`,
  description: APP_DESCRIPTION,
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <SupportButton />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
