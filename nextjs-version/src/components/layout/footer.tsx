import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} Thai Population Density Map. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link 
            href="https://nextjs.org" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium underline underline-offset-4 hover:text-primary"
          >
            Next.js
          </Link>
          <Link 
            href="https://leafletjs.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium underline underline-offset-4 hover:text-primary"
          >
            Leaflet
          </Link>
        </div>
      </div>
    </footer>
  );
}
