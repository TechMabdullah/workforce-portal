import Link from "next/link";

export function Footer() {
  return (
    <footer className="hidden md:flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
      <span>© {new Date().getFullYear()} KKGS Portal. All rights reserved.</span>
      <div className="flex gap-4">
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        <Link href="/terms" className="hover:underline">Terms of Service</Link>
        <Link href="/security" className="hover:underline">Security</Link>
        <Link href="/support" className="hover:underline">Support</Link>
        <span>v0.1.0</span>
      </div>
    </footer>
  );
}