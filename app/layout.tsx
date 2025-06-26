import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Legal RAG AI - Asistente Legal Inteligente",
  description: "Tu asistente legal inteligente que te ayuda con consultas sobre leyes, regulaciones y documentos legales usando IA avanzada.",
  keywords: ["legal", "IA", "asistente", "leyes", "regulaciones", "consultoría legal"],
  authors: [{ name: "Legal RAG AI Team" }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "Legal RAG AI - Asistente Legal Inteligente",
    description: "Tu asistente legal inteligente que te ayuda con consultas sobre leyes, regulaciones y documentos legales.",
    type: "website",
    url: defaultUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Legal RAG AI - Asistente Legal Inteligente",
    description: "Tu asistente legal inteligente que te ayuda con consultas sobre leyes, regulaciones y documentos legales.",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
