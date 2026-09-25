import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { WorkspaceProvider } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DEPLOYX | Deployment operations",
    template: "%s | DEPLOYX",
  },
  description: "Environment discovery, integration, deployment, and incident operations for complex enterprise estates.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#eceee8",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WorkspaceProvider>
          <AppShell>{children}</AppShell>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
