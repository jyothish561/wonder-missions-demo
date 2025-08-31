import "./globals.css";

export const metadata = {
  title: "Wonder Missions Demo",
  description: "Bite-size STEM adventures (ages 6–11)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
