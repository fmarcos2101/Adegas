import type { Metadata } from "next";
import { Archivo, Orbitron } from "next/font/google";
import { Toaster } from "sonner";
import { SupportButton } from "@/components/support-button";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_NAME} — PDV Online`,
  description: APP_DESCRIPTION,
  icons: { icon: "/logo-maf-icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${orbitron.variable} ${archivo.variable}`}>
      <body>
        {children}
        <SupportButton />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
