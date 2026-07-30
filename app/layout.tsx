import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cormorant-garamond/wght.css";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import "@fontsource-variable/manrope/wght.css";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Nataniel & Yasmin | Lista de Presentes",
  description:
    "A lista de presentes de casamento de Nataniel e Yasmin. Toda honra e toda glória a Deus. Nosso fundamento: Colossenses 3:17.",
  applicationName: "Nataniel & Yasmin",
  authors: [{ name: "Nataniel & Yasmin" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Nataniel & Yasmin",
    title: "Nataniel & Yasmin | Lista de Presentes",
    description:
      "Toda honra e toda glória a Deus. Nosso fundamento: Colossenses 3:17. Escolha um presente para o nosso novo lar.",
    images: [
      {
        url: "/og.png",
        width: 1736,
        height: 910,
        alt: "Nataniel & Yasmin — Lista de Presentes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nataniel & Yasmin | Lista de Presentes",
    description:
      "Toda honra e toda glória a Deus. Nosso fundamento: Colossenses 3:17. Escolha um presente para o nosso novo lar.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f2ea",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
