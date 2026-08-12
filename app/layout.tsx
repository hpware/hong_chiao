import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import LayoutClient from "./layoutClient";
import { cn } from "@/lib/utils";
import MainSidebar from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import HeadClient from "./headClient";
import AiSidebar from "@/components/ai_sidebar";

const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME ?? "";

export const metadata: Metadata = {
  title: {
    default: `${schoolName}校務系統反代`,
    template: `%s | ${schoolName}校務系統反代`,
  },
};

const themeInitScript = `
(() => {
  try {
    const storageKey = "hong-chiao-theme";
    const storedTheme = window.localStorage.getItem(storageKey);
    const theme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }
})();
`;

const geistHeading = Geist({ subsets: ["latin"], variable: "--font-heading" });

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh_Hans"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
        geistHeading.variable,
      )}
    >
      <HeadClient />
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>
          <LayoutClient sidebar={<MainSidebar />}>{children}</LayoutClient>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
