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
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${orbitron.variable} ${archivo.variable}`}>
      <body>
        {children}
        <SupportButton />
        <Toaster
          theme="dark"
          richColors
          position="top-right"
          toastOptions={{
            style: {
              background: "#121216",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#f3f5f8",
            },
          }}
        />
      </body>
    </html>
  );
}
