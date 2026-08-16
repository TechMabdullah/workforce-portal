import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b flex items-center px-6">
        <Link href="/" className="font-semibold text-sm">KKGS Portal</Link>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">{children}</main>
    </div>
  );
}