"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Play, Wand2 } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [prompt, setPrompt] = useState("");

  const templates = [
    {
      title: "For Teachers",
      description: "Turn this lesson plan into a 5-minute storyboarded recap.",
      icon: "📚",
      color: "from-blue-500/10 to-purple-500/10",
    },
    {
      title: "For Marketers",
      description: "Turn this product URL into a high-conversion TikTok ad.",
      icon: "🚀",
      color: "from-purple-500/10 to-pink-500/10",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center glow-purple">
              <Play className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-xl tracking-tight">VISIONARY AI</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Features</button>
            <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Pricing</button>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 rounded-full bg-accent text-sm font-semibold hover:bg-accent/90 transition-all glow-purple"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold mb-8"
          >
            <Sparkles className="w-3 h-3" />
            THE DIRECTOR'S CHAIR IS NOW YOURS
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500"
          >
            Imagine, Prompt, <br />
            <span className="text-accent underline decoration-accent/30">Animate</span>.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-12"
          >
            Visionary AI turns your ideas into cinematic videos in seconds. 
            Professional-grade motion for teachers, marketers, and creators.
          </motion.p>

          {/* Magic Input Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-3xl relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
            <div className="relative glass rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2">
              <div className="flex-1 w-full relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent">
                  <Wand2 className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Explain black holes to a 5-year old..."
                  className="w-full bg-transparent border-none focus:ring-0 py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 outline-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <Link 
                href="/dashboard"
                className="w-full md:w-auto px-8 py-4 bg-accent rounded-xl font-bold flex items-center justify-center gap-2 group hover:scale-[1.02] transition-all glow-purple-strong"
              >
                Create Video
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Quick Templates */}
          <div className="grid md:grid-cols-2 gap-6 mt-20 w-full max-w-4xl">
            {templates.map((template, idx) => (
              <motion.div
                key={template.title}
                initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className={`relative group cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left hover:border-accent/50 transition-colors`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <span className="text-3xl mb-4 block">{template.icon}</span>
                <h3 className="text-xl font-bold mb-2">{template.title}</h3>
                <p className="text-zinc-400 text-sm mb-4">{template.description}</p>
                <div className="flex items-center gap-2 text-accent text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                  Try template <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Trust Section */}
      <section className="py-20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mb-8">POWERING CREATIVE TEAMS AT</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale contrast-125">
            <span className="text-2xl font-bold">VERCEL</span>
            <span className="text-2xl font-bold">LINEAR</span>
            <span className="text-2xl font-bold">STRIPE</span>
            <span className="text-2xl font-bold">FIGMA</span>
          </div>
        </div>
      </section>
    </div>
  );
}
