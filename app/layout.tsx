import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { ThemeProvider, ThemeScript } from "@/components/theme-provider"
import { Toaster } from 'sonner';
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body suppressHydrationWarning className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
