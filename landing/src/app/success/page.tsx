"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const licenseKey = searchParams.get("key") || "";
  const email = searchParams.get("email") || "";
  const plan = searchParams.get("plan") || "";
  const duration = searchParams.get("duration") || "";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = licenseKey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="glass-card rounded-2xl p-10 text-center glow-strong animate-fade-up">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-8 bg-[var(--success)]/10 border-2 border-[var(--success)]/30 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-[var(--text-secondary)] mb-8">
            Thank you for purchasing the <strong>{plan}</strong> plan.
          </p>

          {/* License Key Display */}
          <div className="bg-[var(--bg-primary)] border-2 border-dashed border-[var(--accent)] rounded-xl p-6 mb-6">
            <p className="text-[11px] uppercase tracking-[2px] text-[var(--accent-light)] font-semibold mb-3 letter-spacing-2">
              Your License Key
            </p>
            <p className="text-2xl font-mono font-bold text-[var(--text-primary)] tracking-wider break-all">
              {licenseKey}
            </p>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="w-full py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-light)] transition-all mb-6 flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy License Key
              </>
            )}
          </button>

          {/* Info */}
          <div className="space-y-3 text-left bg-[var(--bg-secondary)] rounded-xl p-5 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Email</span>
              <span className="text-[var(--text-primary)]">{email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Plan</span>
              <span className="text-[var(--text-primary)]">{plan}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Duration</span>
              <span className="text-[var(--text-primary)]">{duration}</span>
            </div>
          </div>

          {/* Email Notice */}
          <div className="text-sm text-[var(--text-secondary)] bg-[var(--accent-glow)] border border-[var(--accent)]/20 rounded-lg p-4 mb-6">
            📧 A copy of your license key has also been sent to <strong>{email}</strong>
          </div>

          {/* Download Link */}
          <a
            href="/isuite-setup.exe"
            download
            className="w-full py-3 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-xl text-sm font-semibold hover:bg-[var(--bg-card-hover)] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download iSuite App
          </a>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-light)] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="animate-pulse text-[var(--text-muted)]">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
