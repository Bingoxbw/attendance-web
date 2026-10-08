import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "支部活动签到统计",
  description: "导入签到签退 Excel，统计个人与支部到达率",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
