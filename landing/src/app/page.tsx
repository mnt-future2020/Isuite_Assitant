"use client";

import { useState } from "react";
import Script from "next/script";
import { Check, Terminal, Cpu, Shield, ArrowRight, Code, Layers, Download } from "lucide-react";
import Cursor from "../components/Cursor";

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
  { name: "VS Code", icon: "💻" },
  { name: "GitHub", icon: "🐙" },
  { name: "Slack", icon: "💬" },
  { name: "Notion", icon: "📝" },
  { name: "Gmail", icon: "📧" },
  { name: "Figma", icon: "🎨" },
  { name: "Linear", icon: "🔷" },
  { name: "Discord", icon: "🎮" },
];

// --- Components ---

function Orbiter({ duration, size, reverse = false }: { duration: number; size: number; reverse?: boolean }) {
  return (
    <div
      className="absolute border border-white/10 rounded-full animate-[spin_linear_infinite]"
      style={{
        width: size,
        height: size,
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

  // Handle Payment
  const handlePurchase = async (plan: (typeof PLANS)[0]) => {
    if (!email) {
      alert("Please enter your email address first.");
      document.getElementById("email-input")?.focus();
      return;
    }

    setIsProcessing(true);

    if (!window.Razorpay) {
      alert("Razorpay SDK is still loading or failed to load. Please try again in a moment.");
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
              alert(verifyData.error || "Payment verification failed.");
            }
          } catch {
            alert("Payment verification failed. Please contact support.");
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
      alert(error.message || "Something went wrong.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative selection:bg-white selection:text-black overflow-x-hidden">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Cursor />
      {/* Texture Overlay */}
      <div className="bg-grain" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tighter">iSuite_</div>
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
              <span className="text-xs font-[var(--font-mono)] uppercase tracking-wider text-white/80">System Online v2.0</span>
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
                <Terminal className="w-5 h-5" />
                <span>npm install isuite</span>
              </div>
            </div>
          </div>

          {/* Abstract Visual (Simulated UI) */}
          <div className="md:col-span-4 relative h-[400px] fade-in delay-300">
             <div className="absolute inset-0 border border-white/10 bg-white/5 backdrop-blur-lg p-6 font-[var(--font-mono)] text-xs leading-relaxed text-white/60 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  <span className="ml-auto opacity-50">user@isuite:~</span>
                </div>
                <div className="space-y-2">
                  <p><span className="text-[var(--accent-highlight)]">➜</span> <span className="text-white">analyze_screen.exe</span></p>
                  <p className="text-white/40">[PROCESS] Capturing context...</p>
                  <p className="text-white/40">[PROCESS] Analyzing visual elements...</p>
                  <p className="text-[var(--accent-highlight)]">✔ Context identified: React Component (App.tsx)</p>
                  <p><span className="text-[var(--accent-highlight)]">➜</span> <span className="text-white">generate_refactor</span></p>
                  <p className="text-white"> Generating optimization plan...</p>
                  <div className="mt-4 p-3 bg-black/50 border border-white/10 rounded">
                    <span className="text-blue-400">function</span> <span className="text-yellow-400">optimize</span>() {"{"}
                    <br />&nbsp;&nbsp;<span className="text-purple-400">return</span> <span className="text-green-400">&quot;Efficiency +100%&quot;</span>;
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
                <div className="absolute w-16 h-16 bg-white rounded-full flex items-center justify-center z-20 shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                  <span className="font-bold text-black text-xl">Ai</span>
                </div>

                {/* Rings */}
                <Orbiter duration={20} size={300} />
                <Orbiter duration={30} size={450} reverse />
                <Orbiter duration={40} size={600} />

                {/* Floating Apps */}
                {INTEGRATIONS.map((app, i) => {
                  const angle = (i / INTEGRATIONS.length) * 360;
                  const radius = 225; // Middle ring
                  return (
                    <div
                      key={app.name}
                      className="orbit-item"
                      style={{
                        transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`,
                      }}
                    >
                      <span className="text-2xl">{app.icon}</span>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Right: Content */}
          <div>
            <h2 className="text-display-large mb-8">
              Connected<br />
              <span className="text-white/40">Everything.</span>
            </h2>
            <p className="text-xl text-white/60 mb-12">
              Your workflow isn&apos;t isolated. iSuite bridges the gap between your 
              local environment and your favorite tools.
            </p>
            
            <div className="space-y-6">
               <div className="group editorial-card p-6 flex items-center gap-6">
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-lg">
                    <Code className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Codebase Aware</h3>
                    <p className="text-sm text-white/50">Reads your local git repositories and understands context.</p>
                  </div>
               </div>
               
               <div className="group editorial-card p-6 flex items-center gap-6">
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-lg">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Cross-App Drag & Drop</h3>
                    <p className="text-sm text-white/50">Pull a Linear ticket into a VS Code instruction instantly.</p>
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
                  <span>Running System Check...</span>
                  <span className="text-[var(--accent-highlight)]">{'/// CONNECTED'}</span>
                  <span>VS Code Integration Active</span>
                  <span>Fetching Github PRs...</span>
                  <span className="text-[var(--accent-highlight)]">{'/// SYNC COMPLETE'}</span>
                  <span>Slack Threads Imported</span>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* --- FEATURES (Coding Focus) --- */}
      <section id="features" className="py-32 px-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
          <h2 className="text-display-large max-w-2xl">
            Born to <br />
            <span className="text-[var(--accent-highlight)]">Write Code.</span>
          </h2>
          <p className="text-xl text-white/60 max-w-md font-[var(--font-mono)] border-l border-white/20 pl-6">
            {'// Start coding 10x faster.'}<br />
            {'// No context switching.'}<br />
            {'// Pure flow state.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
           {/* Card 1 */}
           <div className="editorial-card min-h-[400px] flex flex-col justify-between group">
              <Cpu className="w-10 h-10 text-white/40 group-hover:text-white transition-colors" />
              <div>
                <h3 className="text-2xl font-bold mb-4">Local Execution</h3>
                <p className="text-white/60">Scripts run on your machine, not in the cloud. Access files, ports, and localhost servers directly.</p>
              </div>
           </div>
           
           {/* Card 2 */}
           <div className="editorial-card min-h-[400px] flex flex-col justify-between group bg-white/5">
              <Terminal className="w-10 h-10 text-[var(--accent-highlight)]" />
              <div>
                <h3 className="text-2xl font-bold mb-4 text-[var(--accent-highlight)]">Terminal Integ.</h3>
                <p className="text-white/60">Execute commands, installing packages, and debug errors without leaving the chat interface.</p>
              </div>
           </div>
           
           {/* Card 3 */}
           <div className="editorial-card min-h-[400px] flex flex-col justify-between group">
              <Shield className="w-10 h-10 text-white/40 group-hover:text-white transition-colors" />
              <div>
                <h3 className="text-2xl font-bold mb-4">Privacy First</h3>
                <p className="text-white/60">Your codebase never leaves your machine. Training data is opted-out by default.</p>
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
                placeholder="developer@example.com"
                className="w-full bg-transparent border-b border-white/20 py-4 text-xl focus:outline-none focus:border-white transition-colors placeholder:text-white/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <div className="text-2xl font-bold tracking-tighter mb-4">iSuite_</div>
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
    </div>
  );
}
