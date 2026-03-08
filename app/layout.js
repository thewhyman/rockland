import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Rockland - Grant Discovery & Pipeline Tracker',
  description: 'Grant Discovery & Pipeline Tracker for FQHCs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <nav className="bg-slate-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center font-bold text-sm">R</div>
                <span className="font-semibold text-lg tracking-tight">Rockland</span>
                <span className="text-slate-400 text-sm ml-1 hidden sm:block">Grant Tracker</span>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href="/profile"
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Org Profile
                </Link>
                <Link
                  href="/discovery"
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Discovery
                </Link>
                <Link
                  href="/pipeline"
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Pipeline
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
