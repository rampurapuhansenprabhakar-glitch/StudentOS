import "./globals.css";
import React from "react";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "StudentOS — AI-Powered Digital Twin for Personalized Student Success",
  description: "Track. Predict. Simulate. Improve. An interactive AI digital twin platform for college students.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
