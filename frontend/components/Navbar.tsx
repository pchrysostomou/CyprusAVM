"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="logo" id="nav-logo">
          <div className="logo-mark">AV</div>
          <span className="logo-text">
            Cyprus<span>AVM</span>
          </span>
        </Link>

        <div className="nav-links">
          <Link
            href="/"
            id="nav-home"
            className={`nav-link ${pathname === "/" ? "active" : ""}`}
          >
            Αρχική
          </Link>
          <Link
            href="/estimate"
            id="nav-estimate"
            className={`nav-link ${pathname === "/estimate" ? "active" : ""}`}
          >
            Εκτίμηση
          </Link>
          <Link
            href="/market"
            id="nav-market"
            className={`nav-link ${pathname === "/market" ? "active" : ""}`}
          >
            Αγορά
          </Link>
        </div>

        <Link href="/estimate" className="btn btn-primary" id="nav-cta" style={{ fontSize: '14px', padding: '9px 20px' }}>
          Δωρεάν Εκτίμηση
        </Link>
      </div>
    </nav>
  );
}
