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

function getInvalidEnvironmentVariables() {
  const environmentVariables = [
    { name: "API_URL", value: process.env.API_URL },
    { name: "NEXT_PUBLIC_APP_URL", value: process.env.NEXT_PUBLIC_APP_URL },
    {
      name: "NEXT_PUBLIC_OWNER_EMAIL",
      value: process.env.NEXT_PUBLIC_OWNER_EMAIL,
      placeholder: "changeme@example.com",
    },
  ];

  return environmentVariables.flatMap(({ name, value, placeholder }) => {
    const normalizedValue = value?.trim();
    return !normalizedValue || normalizedValue === placeholder ? [name] : [];
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const invalidEnvironmentVariables = getInvalidEnvironmentVariables();

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
          {invalidEnvironmentVariables.length > 0 ? (
            <main className="absolute inset-0 flex flex-col justify-center items-center gap-3 p-6">
              <h1 className="text-2xl text-center font-semibold">
                請更改系統 .env 與聯絡信箱 🙂
              </h1>
              <p className="text-sm text-muted-foreground">
                下列環境變數尚未設定或仍使用預設值：
              </p>
              <ul className="list-disc space-y-1 pl-5 font-mono text-sm">
                {invalidEnvironmentVariables.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </main>
          ) : (
            <LayoutClient sidebar={<MainSidebar />}>{children}</LayoutClient>
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
