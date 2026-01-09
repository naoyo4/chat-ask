import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ChatAsk - AI対話型アンケート",
    description: "AIを活用した対話型アンケート・インタビューアプリケーション",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
