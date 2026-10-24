import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Anti Logic — Trading Intelligence", template: "%s | Anti Logic" },
  description: "A focused workspace for binary trading research, strategy design, backtesting, and risk-aware automation.",
  applicationName: "Anti Logic",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
