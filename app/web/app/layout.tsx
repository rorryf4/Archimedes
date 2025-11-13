import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Archimedes";

export const metadata: Metadata = {
  title: appName,
  description: "Archimedes application shell",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Header />
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)]">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
