"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSelector } from "@/components/ui/language-selector";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-foreground hover:bg-accent rounded-md"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 right-0 bg-background border-b shadow-md z-50 animate-in slide-in-from-top-5 duration-200">
          <div className="container py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-foreground hover:text-primary transition-colors py-1"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="https://github.com/apisit/thailand.json"
                className="text-foreground/80 hover:text-primary transition-colors py-1"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
              >
                Data Source
              </Link>
              <Link
                href="https://leafletjs.com"
                className="text-foreground/80 hover:text-primary transition-colors py-1"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
              >
                Leaflet
              </Link>
              <div className="pt-2 flex items-center justify-between border-t">
                <span className="text-sm text-muted-foreground">Language</span>
                <LanguageSelector />
              </div>
              <div className="pt-2 flex items-center justify-between border-t">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
