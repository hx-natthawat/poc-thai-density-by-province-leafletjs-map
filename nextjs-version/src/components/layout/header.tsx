import Link from 'next/link';
import { MapIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSelector } from '@/components/ui/language-selector';
import { MobileMenu } from './mobile-menu';

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon className="h-6 w-6 text-primary" />
          <Link 
            href="/" 
            className="flex items-center text-lg font-semibold tracking-tight"
          >
            Thai Density Map
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link 
            href="https://github.com/apisit/thailand.json" 
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Data Source
          </Link>
          <Link 
            href="https://leafletjs.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Leaflet
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
