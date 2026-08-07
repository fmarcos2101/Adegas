import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { Toaster } from "sonner";
import { SupportButton } from "@/components/support-button";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_NAME} — PDV Online`,
  description: APP_DESCRIPTION,
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        {children}
        <SupportButton />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
