import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConfigProvider } from "antd";
import AntdRenderProvider from "./providers"; 
import QueryProvider from '@/lib/providers/QueryProvider'; 
// HAPUS IMPORT AuthHydrator DARI SINI

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Lahan Pintar App", 
  description: "Aplikasi Manajemen Lahan Pintar", 
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          {/* HAPUS <AuthHydrator /> DARI SINI */}
          <ConfigProvider>
            <AntdRenderProvider>
              {children}
            </AntdRenderProvider>
          </ConfigProvider>
        </QueryProvider>
      </body>
    </html>
  );
}