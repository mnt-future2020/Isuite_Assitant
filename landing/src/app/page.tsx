"use client";

import { useState } from "react";
import Script from "next/script";
import { Check, Shield, ArrowRight, Layers, Download, AlertCircle, X } from "lucide-react";

// --- Types & Config ---

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 199,
    duration: "20 Days",
    durationDays: 20,
    features: ["Basic AI Chat", "50 Image Analyses", "Standard Support"],
    highlight: false,
  },
  {
    id: "monthly",
    name: "Monthly",
    price: 299,
    duration: "30 Days",
    durationDays: 30,
    features: ["Advanced AI Models", "Unlimited Chat", "Priority Support", "All Integrations"],
    highlight: true,
  },
  {
    id: "quarterly",
    name: "Quarterly",
    price: 799,
    duration: "90 Days",
    durationDays: 90,
    features: ["Everything in Monthly", "Save 12%", "Early Access Features"],
    highlight: false,
  },
  {
    id: "annual",
    name: "Annual",
    price: 2499,
    duration: "365 Days",
    durationDays: 365,
    features: ["Everything in Quarterly", "Save 30%", "Dedicated Account Manager"],
    highlight: false,
  },
];

const INTEGRATIONS = [
  { 
    name: "VS Code", 
    icon: <svg viewBox="0 0 256 256" className="w-8 h-8"><path fill="#0065A9" d="M184.72 0l-123.6 22.82-38.3 35 152.05 155.02L256 186.04z"/><path fill="#007ACC" d="M256 186.04L174.85 256l-9.15-5.27V124.67z"/><path fill="#1F9CF0" d="M184.72 0L256 69.96v116.08l-81.15-61.37z"/><path fill="#0065A9" d="M165.7 124.67v126.06l-47.5-35.45z"/><path fill="#007ACC" d="M22.82 57.82l95.38 74.34-95.38 74.57-22.82-16.74v-115.4z"/></svg> 
  },
  { 
    name: "GitHub", 
    icon: <svg viewBox="0 0 98 96" className="w-8 h-8"><path fill="#fff" fillRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/></svg> 
  },
  { 
    name: "Slack", 
    icon: <svg viewBox="0 0 244.8 244.8" className="w-8 h-8"><path fill="#e01e5a" d="M89.3 118.4V89.3c0-16-13-29-29-29s-29 13-29 29 13 29 29 29h29z"/><path fill="#e01e5a" d="M29 118.4c-16 0-29 13-29 29s13 29 29 29h29.2c16 0 29-13 29-29s-13-29-29-29H29z"/><path fill="#36c5f0" d="M126.5 89.3V59.2c0-16 13-29 29-29s29 13 29 29-13 29-29 29h-29z"/><path fill="#36c5f0" d="M126.5 29c0-16-13-29-29-29s-29 13-29 29v29.2c0 16 13 29 29 29s29-13 29-29V29z"/><path fill="#2eb67d" d="M156.4 126.5v29.1c0 16 13 29 29 29s29-13 29-29-13-29-29-29h-29z"/><path fill="#2eb67d" d="M216.7 126.5c16 0 29-13 29-29s-13-29-29-29h-29.1c-16 0-29 13-29 29s13 29 29 29h29.1z"/><path fill="#ecb22e" d="M118.4 156.4v29.1c0 16-13 29-29 29s-29-13-29-29 13-29 29-29h29z"/><path fill="#ecb22e" d="M118.4 216.7c0 16 13 29 29 29s29-13 29-29v-29.2c0-16-13-29-29-29s-29 13-29 29v29.2z"/></svg> 
  },
  { 
    name: "Notion", 
    icon: <svg viewBox="0 0 1024 1024" className="w-8 h-8"><path fill="#fff" d="M848.33 342.32c-3.1 3.2-12.27 4.19-15.02 4.19H501.9l-118.4-159.2h281.42s50.45 6.78 69.32 23.33 114.1 131.68 114.1 131.68zm-41.25 43v418.42c0 18.25-13.88 47-32.96 55.45-19.08 8.45-316.59 133.09-316.59 133.09v-543.83zM161.43 331.6s2.59-17.7 19.34-26.65c16.75-8.95 240-97.88 240-97.88v588.62l12.75 32c0 0 54.45 28.53 103.41 12.39v-623.63L336.87 141H256S182 147 167 155c-15 8-15 16-15 48L151.48 767.8s-7.15 67.55 49.6 42.71c56.75-24.84 230-98.37 230-98.37l-49.88-66.6H275.46v-345l81.46 123.6v.05zm142.06 63.85l112.56 169.1 27.65.65V410.82h-36V375.4zM475.25 801S742.85 687.2 787.49 668.3C804 661.32 809.52 642.43 809.52 626V538h.04v-112.9l-149.33 55.47v282l-15.55-14.99V487L501.5 433l-26.25 15.02z"/></svg> 
  },
  { 
    name: "Gmail", 
    icon: <svg viewBox="0 0 24 24" className="w-8 h-8"><path fill="#fbbc04" d="M19 14.5v-6L12 13 5 8.5v6c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3z"/><path fill="#ea4335" d="M19 8.5L12 13 5 8.5A2.99 2.99 0 0 1 7.6 5h8.8c1.19 0 2.22.71 2.72 1.74l-.12 1.76z"/><path fill="#34a853" d="M5 8.5V14.5c0 .35.06.69.17 1L5 15.5A2.99 2.99 0 0 1 2 12.5v-4A2.99 2.99 0 0 1 5 5.5v3z"/><path fill="#4285f4" d="M19 8.5V14.5c0 .35-.06.69-.17 1L19 15.5A2.99 2.99 0 0 0 22 12.5v-4A2.99 2.99 0 0 0 19 5.5v3z"/></svg> 
  },
  { 
    name: "Figma", 
    icon: <svg viewBox="0 0 38 57" className="w-8 h-8"><path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/><path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"/><path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"/><path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/><path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/></svg> 
  },
  { 
    name: "Linear", 
    icon: <svg viewBox="0 0 24 24" className="w-8 h-8"><path fill="#5e6ad2" d="M5.485 5.485C6.892 4.08 8.799 3.324 10.706 3.197H3V10.705C3.127 8.798 3.883 6.891 5.485 5.485zM5.485 18.514C6.892 19.92 8.799 20.676 10.706 20.803H3V13.295C3.127 15.202 3.883 17.109 5.485 18.514zM18.514 18.515C17.108 19.92 15.201 20.676 13.294 20.803H21V13.295C20.873 15.202 20.117 17.109 18.514 18.515zM21 3.197H13.294C15.201 3.324 17.108 4.08 18.514 5.485C20.117 6.891 20.873 8.798 21 10.705V3.197z"/><path fill="#fff" d="M17.03 6.968l-4.595 4.595 4.595 4.595-1.414 1.414L11.02 12.98 6.425 17.575 5.01 16.16 9.605 11.565 5.01 6.97 6.424 5.556l4.596 4.596L15.616 5.554l1.414 1.414z"/></svg> 
  },
  { 
    name: "Discord", 
    icon: <svg viewBox="0 0 127.14 96.36" className="w-8 h-8"><path fill="#5865F2" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77.89,77.89,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/></svg> 
  },
];

// --- Components ---

function Orbiter({ duration, size, reverse = false }: { duration: number; size: number; reverse?: boolean }) {
  return (
    <div
      className="absolute border border-white/10 rounded-full animate-[spin_linear_infinite]"
      style={{
        width: `${size}%`,
        height: `${size}%`,
        animationDuration: `${duration}s`,
        animationDirection: reverse ? "reverse" : "normal",
      }}
    />
  );
}

// --- Main Page ---

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<(typeof PLANS)[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Handle Payment
  const handlePurchase = async (plan: (typeof PLANS)[0]) => {
    if (!email) {
      setAlertMessage("Please enter your email address first.");
      document.getElementById("email-input")?.focus();
      return;
    }

    setIsProcessing(true);

    if (!window.Razorpay) {
      setAlertMessage("Razorpay SDK is still loading or failed to load. Please try again in a moment.");
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Create Order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.price * 100, // in paise
          plan: plan.id,
          email: email,
          durationDays: plan.durationDays,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) throw new Error(orderData.error);

      // 2. Open Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "iSuite AI",
        description: `${plan.name} License (${plan.duration})`,
        order_id: orderData.orderId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async function (response: any) {
          // 3. Verify Payment
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              window.location.href = `/success?key=${verifyData.licenseKey}&email=${encodeURIComponent(
                email.trim()
              )}&plan=${plan.name}&duration=${plan.duration}`;
            } else {
              setAlertMessage(verifyData.error || "Payment verification failed.");
            }
          } catch {
            setAlertMessage("Payment verification failed. Please contact support.");
          }
        },
        prefill: { email: email },
        theme: { color: "#ffffff" },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      setAlertMessage(error.message || "Something went wrong.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative selection:bg-white selection:text-black overflow-x-hidden">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      {/* Texture Overlay */}
      <div className="bg-grain" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold tracking-tighter">iSuite_</div>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-[var(--font-mono)] text-white/60">
            <a href="#features" className="hover:text-white transition-colors">FEATURES</a>
            <a href="#integrations" className="hover:text-white transition-colors">INTEGRATIONS</a>
            <a href="#pricing" className="hover:text-white transition-colors">PRICING</a>
          </div>
          <a href="/isuite-setup.exe" download className="bg-white text-black px-5 py-2 text-sm font-bold hover:bg-white/90 transition-colors uppercase tracking-wide inline-flex items-center gap-2">
            <Download className="w-4 h-4" /> Download App
          </a>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 max-w-[1400px] mx-auto overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
          <div className="md:col-span-8 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/20 rounded-full mb-8 bg-white/5 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-highlight)] animate-pulse" />
              <span className="text-xs font-[var(--font-mono)] uppercase tracking-wider text-white/80">iSuite Neural Engine</span>
            </div>
            
            <h1 className="text-display-giant fade-in">
              INTELLIGENCE
              <br />
              <span className="text-white/40">REDEFINED.</span>
            </h1>
            
            <p className="mt-8 text-xl md:text-2xl max-w-2xl text-white/70 leading-relaxed fade-in delay-100">
              Not just a chatbot. A fully integrated 
              <span className="text-white font-bold"> desktop neural layer </span> 
              that sees what you see, codes with you, and orchestrates your entire workflow.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 fade-in delay-200">
              <a href="#pricing" className="px-8 py-4 bg-white text-black font-bold text-lg hover:bg-white/90 transition-transform hover:scale-105 flex items-center justify-center gap-2">
                Get Access <ArrowRight className="w-5 h-5" />
              </a>
              <div className="px-8 py-4 border border-white/20 text-white/80 font-[var(--font-mono)] flex items-center justify-center gap-3">
                <Download className="w-5 h-5" />
                <span>Download App</span>
              </div>
            </div>
          </div>

          {/* Abstract Visual (Simulated UI) */}
          <div className="md:col-span-4 relative h-[400px] fade-in delay-300 mt-12 md:mt-0">
             <div className="absolute inset-0 border border-white/10 bg-white/5 backdrop-blur-lg p-6 font-[var(--font-mono)] text-[10px] sm:text-xs leading-relaxed text-white/60 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  <span className="ml-auto opacity-50">user@isuite:~</span>
                </div>
                <div className="space-y-2">
                  <p><span className="text-[var(--accent-highlight)]">➜</span> <span className="text-white">isuite_agent --task &quot;Build and run a payment webhook route&quot;</span></p>
                  <p className="text-white/40">[AGENT] Analyzing project structure...</p>
                  <p className="text-white/40">[AGENT] Creating route.ts...</p>
                  <p className="text-white/40">[AGENT] Installing stripe SDK...</p>
                  <p className="text-[var(--accent-highlight)]">✔ Dependencies installed and server restarted.</p>
                  <p><span className="text-[var(--accent-highlight)]">➜</span> <span className="text-white">route.ts</span></p>
                  <p className="text-white"> Writing webhook logic...</p>
                  <div className="mt-4 p-3 bg-black/50 border border-white/10 rounded">
                    <span className="text-blue-400">export async function</span> <span className="text-yellow-400">POST</span>(req: Request) {"{"}
                    <br />&nbsp;&nbsp;<span className="text-blue-400">const</span> body = <span className="text-purple-400">await</span> req.<span className="text-green-400">json()</span>;
                    <br />&nbsp;&nbsp;<span className="text-purple-400">await</span> db.insert(payments).values(body);
                    <br />&nbsp;&nbsp;<span className="text-purple-400">return new</span> <span className="text-yellow-400">Response</span>(<span className="text-green-400">&quot;Success&quot;</span>);
                    <br />{"}"}
                  </div>
                </div>
             </div>
             {/* Decorative element behind */}
             <div className="absolute -z-10 top-10 -right-10 w-full h-full border border-[var(--accent-highlight)]/30 opacity-50" />
          </div>
        </div>
      </section>

      {/* --- INTEGRATIONS (Orbit + Pipeline) --- */}
      <section id="integrations" className="py-32 border-t border-white/10 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          
          {/* Left: 3D Orbit Visualization */}
          <div className="relative flex items-center justify-center">
             <div className="orbit-container">
                {/* Core */}
                <div className="absolute w-24 h-24 bg-white rounded-full blur-[60px] opacity-20" />
                <div className="absolute w-20 h-20 bg-white rounded-full flex items-center justify-center z-20 shadow-[0_0_50px_rgba(255,255,255,0.3)] overflow-hidden">
                  <span className="text-3xl font-black text-black tracking-tighter">AI</span>
                </div>

                {/* Rings */}
                <Orbiter duration={20} size={50} />
                <Orbiter duration={30} size={75} reverse />
                <Orbiter duration={40} size={100} />

                {/* Floating Apps */}
                {INTEGRATIONS.map((app, i) => {
                  const angle = (i / INTEGRATIONS.length) * 2 * Math.PI;
                  const radiusPerc = 37.5; // Middle ring
                  const left = 50 + Math.cos(angle) * radiusPerc;
                  const top = 50 + Math.sin(angle) * radiusPerc;
                  return (
                    <div
                      key={app.name}
                      className="orbit-item bg-black border border-white/10 rounded-2xl flex items-center justify-center p-3 shadow-2xl absolute -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                      }}
                    >
                      {app.icon}
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Right: Content */}
          <div>
            <h2 className="text-display-large mb-8">
              Agentic App<br />
              <span className="text-white/40">Connections.</span>
            </h2>
            <p className="text-xl text-white/60 mb-12">
              Empower iSuite with actual reading and writing capabilities across your entire tech stack. Your agent does the heavily lifting.
            </p>
            
            <div className="space-y-6">
               <div className="group editorial-card p-6 flex items-center gap-6">
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-lg">
                    <Layers className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Omnichannel Execution</h3>
                    <p className="text-sm text-white/50">iSuite fetches Linear tasks, reads Slack threads, and drafts Gmail responses autonomously.</p>
                  </div>
               </div>
               
               <div className="group editorial-card p-6 flex items-center gap-6">
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-lg">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Secure Granular Auth</h3>
                    <p className="text-sm text-white/50">Connect 100+ tools instantly via OAuth. You control exactly what data your agent accesses.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Pipeline Marquee */}
        <div className="mt-32 border-y border-white/10 py-8 bg-white/5 backdrop-blur-sm overflow-hidden flex relative">
           <div className="flex gap-24 whitespace-nowrap marquee-content text-[var(--font-mono)] text-sm uppercase tracking-[0.2em] text-white/40">
              {/* Duplicated content for seamless loop */}
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-24">
                  <span>Authenticating Gmail...</span>
                  <span className="text-[var(--accent-highlight)]">{'/// FETCHING LINEAR ISSUES'}</span>
                  <span>Drafting Github PR...</span>
                  <span>Reading Notion Docs...</span>
                  <span className="text-[var(--accent-highlight)]">{'/// POSTING TO SLACK'}</span>
                  <span>Agent Action Complete</span>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* --- FEATURES (Neural Layer Focus) --- */}
      <section id="features" className="py-32 px-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
          <h2 className="text-display-large max-w-2xl">
            The Ultimate <br />
            <span className="text-[var(--accent-highlight)]">Neural Layer.</span>
          </h2>
          <p className="text-xl text-white/60 max-w-md font-[var(--font-mono)] border-l border-white/20 pl-6">
            {'// Context aware across apps.'}<br />
            {'// No more copying & pasting.'}<br />
            {'// Pure workflow automation.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
           {/* Card 1 */}
           <div className="editorial-card min-h-[400px] flex flex-col justify-between group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white/40 group-hover:text-white transition-colors">
                <path d="m18 16 4-4-4-4"/>
                <path d="m6 8-4 4 4 4"/>
                <path d="m14.5 4-5 16"/>
              </svg>
              <div>
                <h3 className="text-2xl font-bold mb-4">Autonomous Coding</h3>
                <p className="text-white/60">Simply describe your task. iSuite will autonomously write code, execute it locally, debug errors, and complete your development tasks.</p>
              </div>
           </div>
           
           {/* Card 2 */}
           <div className="editorial-card min-h-[400px] flex flex-col justify-between group bg-white/5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[var(--accent-highlight)]">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <div>
                <h3 className="text-2xl font-bold mb-4 text-[var(--accent-highlight)]">Workflow Automation</h3>
                <p className="text-white/60">Trigger complex, multi-step actions across your installed desktop applications with simple language commands.</p>
              </div>
           </div>
           
           {/* Card 3 */}
           <div className="editorial-card min-h-[400px] flex flex-col justify-between group">
              <Shield className="w-10 h-10 text-white/40 group-hover:text-white transition-colors" />
              <div>
                <h3 className="text-2xl font-bold mb-4">Local & Private</h3>
                <p className="text-white/60">Your context stays on your machine. iSuite operates locally, ensuring your sensitive data and proprietary code never leaks.</p>
              </div>
           </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-32 px-6 border-t border-white/10 bg-[#0A0A0A]">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-center text-4xl md:text-6xl font-bold mb-20">Secure Access</h2>
          
          <div className="max-w-md mx-auto mb-16 space-y-4">
             <label className="text-xs font-[var(--font-mono)] uppercase tracking-wider text-white/40 block">Enter Email to get started</label>
             <input 
                id="email-input"
                type="email" 
                placeholder="you@domain.com"
                className="w-full bg-transparent border-b border-white/20 py-4 text-xl focus:outline-none focus:border-white transition-colors placeholder:text-white/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
             />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {PLANS.map((plan) => (
               <button
                 key={plan.id}
                 onClick={() => {
                   setSelectedPlan(plan);
                   handlePurchase(plan);
                 }}
                 disabled={isProcessing}
                 className={`
                   editorial-card text-left flex flex-col h-full relative group
                   ${plan.highlight ? 'bg-white text-black border-white' : 'hover:bg-white/5'}
                 `}
               >
                 {plan.highlight && (
                   <span className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                     Best Value
                   </span>
                 )}

                 <div className="mb-8">
                   <h3 className={`text-sm font-[var(--font-mono)] uppercase tracking-widest ${plan.highlight ? 'text-black/60' : 'text-white/40'}`}>
                     {plan.name}
                   </h3>
                   <div className="mt-2 text-4xl font-bold">
                     ₹{plan.price}
                   </div>
                   <div className={`text-xs mt-1 ${plan.highlight ? 'text-black/50' : 'text-white/30'}`}>
                     / {plan.duration}
                   </div>
                 </div>

                 <ul className="space-y-3 mb-8 flex-1">
                   {plan.features.map((feature) => (
                     <li key={feature} className="flex items-start gap-2 text-sm opacity-80">
                       <Check className="w-4 h-4 mt-0.5 shrink-0" />
                       <span className="leading-snug">{feature}</span>
                     </li>
                   ))}
                 </ul>
                 
                 <div className={`
                    w-full py-4 text-center text-sm font-bold border border-current uppercase tracking-wider transition-all
                    ${plan.highlight ? 'bg-black text-white hover:bg-black/80' : 'group-hover:bg-white group-hover:text-black'}
                 `}>
                   {isProcessing && selectedPlan?.id === plan.id ? "Processing..." : "Select Plan"}
                 </div>
               </button>
             ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 border-t border-white/10 px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
           <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-2xl font-bold tracking-tighter">iSuite_</div>
              </div>
              <p className="text-white/40 max-w-xs text-sm">
                The intelligent layer for your desktop.
                <br />Built for those who build.
              </p>
           </div>
           
           <div className="flex gap-12 text-sm font-[var(--font-mono)] text-white/50">
              <div className="flex flex-col gap-4">
                 <span className="text-white uppercase tracking-widest">Product</span>
                 <a href="#features" className="hover:text-white">Features</a>
                 <a href="#integrations" className="hover:text-white">Changelog</a>
                 <a href="/isuite-setup.exe" download className="hover:text-white">Download</a>
              </div>
              <div className="flex flex-col gap-4">
                 <span className="text-white uppercase tracking-widest">Legal</span>
                 <a href="#" className="hover:text-white">Privacy</a>
                 <a href="#" className="hover:text-white">Terms</a>
                 <a href="#" className="hover:text-white">Licenses</a>
              </div>
           </div>
        </div>
        <div className="max-w-[1400px] mx-auto mt-20 pt-8 border-t border-white/5 text-xs text-white/20 font-[var(--font-mono)] flex justify-between">
           <span>© 2026 iSuite AI Inc.</span>
           <span>SYSTEM.STATUS: OPERATIONAL</span>
        </div>
      </footer>

      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAlertMessage(null)} />
          <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl relative z-10 flex flex-col">
            <div className="flex items-start justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3 text-red-500">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-base text-white uppercase tracking-wider">Notice</h3>
              </div>
              <button 
                onClick={() => setAlertMessage(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-white/70 text-sm leading-relaxed text-left">
                {alertMessage}
              </p>
            </div>
            <div className="p-4 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setAlertMessage(null)}
                className="px-6 py-2.5 bg-white text-black font-bold text-xs hover:bg-white/90 transition-colors uppercase tracking-widest"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
