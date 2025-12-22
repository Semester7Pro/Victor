"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useUser,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import {
  Menu,
  X,
  MessageSquare,
  Search,
  UploadCloud,
  ChevronRight,
} from "lucide-react";
import gsap from "gsap";

export default function Header() {
  const { user, isLoaded } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  /* ---------------- Scroll detection ---------------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------------- Smooth load animation ---------------- */
  useLayoutEffect(() => {
    if (!isLoaded || !headerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Header shell
      tl.fromTo(
        headerRef.current,
        {
          opacity: 0,
          y: -12,
          scale: 0.98,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
          ease: "power3.out",
        }
      );

      // Inner items (brand, nav, actions)
      tl.fromTo(
        ".header-item",
        {
          opacity: 0,
          y: -6,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
        },
        "-=0.45"
      );
    }, headerRef);

    return () => ctx.revert();
  }, [isLoaded]);

  const navLinks = [
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Search", href: "/search", icon: Search },
    { name: "Upload", href: "/upload", icon: UploadCloud },
  ];

  if (!isLoaded) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 md:p-6 pointer-events-none">
      <header
        ref={headerRef}
        className={`
          pointer-events-auto
          flex items-center justify-between
          transition-[width,backdrop-filter,box-shadow] duration-500 ease-out
          ${scrolled ? "w-full md:w-[90%] lg:w-[80%]" : "w-full md:w-[95%] lg:w-[85%]"}
          h-16 px-4 md:px-6 rounded-2xl md:rounded-full
          bg-white/70 backdrop-blur-xl border border-white/40
          shadow-[0_8px_32px_rgba(0,0,0,0.05)]
        `}
      >
        {/* ---------- LEFT: Brand ---------- */}
        <Link href="/" className="header-item flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Victor Logo"
            width={32}
            height={32}
            className="rounded-full bg-black"
          />
          <span className="text-md font-bold tracking-tight text-slate-900">
            Victor
          </span>
        </Link>

        {/* ---------- CENTER: Desktop Nav ---------- */}
        <nav className="header-item hidden md:flex items-center bg-slate-100/60 p-1 rounded-full border border-slate-200/50">
          <SignedIn>
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-5 py-2 rounded-full text-xs font-semibold transition-all
                    ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-900"
                    }
                  `}
                >
                  {item.name}
                </Link>
              );
            })}
          </SignedIn>

          <SignedOut>
            <div className="px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Official Regulatory Portal
            </div>
          </SignedOut>
        </nav>

        {/* ---------- RIGHT: Actions ---------- */}
        <div className="header-item flex items-center gap-3">
          <SignedIn>
            <div className="hidden lg:flex items-center gap-2 mr-2 border-r border-slate-200 pr-4">
              <span className="text-xs font-bold text-slate-700">
                {user?.fullName ?? "User"}
              </span>
            </div>

            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    "w-9 h-9 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-200",
                  userButtonPopoverCard:
                    "rounded-2xl border border-slate-200 shadow-xl",
                },
              }}
              afterSignOutUrl="/"
            />

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 transition">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="h-10 px-6 rounded-full bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition-all flex items-center">
                Get Started
                <ChevronRight className="ml-1 w-3 h-3" />
              </button>
            </SignUpButton>
          </SignedOut>
        </div>

        {/* ---------- MOBILE MENU ---------- */}
        {isMobileMenuOpen && (
          <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-2xl p-4 shadow-2xl md:hidden animate-in fade-in zoom-in-95 duration-200">
            <SignedIn>
              <div className="flex flex-col gap-2">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <item.icon size={18} />
                      </div>
                      <span className="font-bold text-slate-900">
                        {item.name}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </Link>
                ))}
              </div>
            </SignedIn>
          </div>
        )}
      </header>
    </div>
  );
}
