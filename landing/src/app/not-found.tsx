import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-white selection:text-black font-[var(--font-body)]">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-12 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
        
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2" />

        <div className="font-[var(--font-mono)] text-indigo-500 text-6xl font-bold mb-6 tracking-tighter">
          404
        </div>
        
        <h1 className="text-3xl font-bold mb-4 font-[var(--font-display)]">Target Lost</h1>
        <p className="text-white/60 mb-10 leading-relaxed text-sm">
          The node you are attempting to access has been moved, deleted, or never existed within the current directory structure.
        </p>
        
        <div className="flex justify-center">
          <Link 
            href="/" 
            className="bg-white text-black px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-white/90 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
