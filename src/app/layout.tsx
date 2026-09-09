import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kindred | Customer feedback, made human",
  description: "A simple, honest way to share the experiences that shape better businesses.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
