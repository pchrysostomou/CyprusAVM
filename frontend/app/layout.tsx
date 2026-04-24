import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CyprusAVM — Automated Valuation Model | Εκτίμηση Αξίας Ακινήτων Κύπρος",
  description:
    "Το πρώτο αυτόματο σύστημα εκτίμησης αξίας ακινήτων για την Κύπρο. Βάλε τα χαρακτηριστικά του ακινήτου σου και πάρε επαγγελματική εκτίμηση σε δευτερόλεπτα.",
  keywords: ["εκτίμηση ακινήτων", "AVM", "Cyprus real estate", "property valuation", "Κύπρος"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="el">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Navbar />
        <main style={{ paddingTop: "64px" }}>{children}</main>
      </body>
    </html>
  );
}
