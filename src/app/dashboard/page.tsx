"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic2, Music, Palette, Play, 
  ChevronRight, Layers, Layout, 
  Settings, Download, Plus, 
  PlayCircle, MoreHorizontal,
  Type, Image as ImageIcon,
  Sparkles, History, Users,
  Search, Loader2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("voices");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [images, setImages] = useState<{ url: string; title: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchImages = async (query: string) => {
    if (!query) return;
    setIsSearching(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      const cx = process.env.NEXT_PUBLIC_GOOGLE_CX;
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&searchType=image&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      if (data.items) {
        setImages(data.items.map((item: any) => ({
          url: item.link,
          title: item.title
        })));
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const startExport = () => {
    setIsExporting(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setExportProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setIsExporting(false), 1000);
      }
    }, 150);
  };

  const assetLibrary = {
    voices: [
      { name: "Sienna (Natural)", type: "Warm/Narrator", id: "1" },
      { name: "Marcus (Dyna)", type: "Deep/Energy", id: "2" },
      { name: "AI Echo", type: "Digital/Sci-Fi", id: "3" },
    ],
    music: [
      { name: "Cyberpunk Pulse", duration: "2:30", id: "m1" },
      { name: "Oceanic Waves", duration: "3:45", id: "m2" },
    ],
    styles: [
      { name: "Realistic", preview: "📷", id: "s1" },
      { name: "3D Animation", preview: "🎨", id: "s2" },
      { name: "Sketch", preview: "✏️", id: "s3" },
    ]
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden font-sans">
      {/* Sidebar (Asset Library) */}
      <aside className="w-80 border-r border-zinc-900 bg-[#0D0D0D] flex flex-col z-20">
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white/90">ASSET LIBRARY</span>
          </div>
          <button className="text-zinc-500 hover:text-white transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex items-center px-4 pt-4 border-b border-zinc-900 gap-4">
          {["voices", "music", "styles", "explore"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 text-xs font-bold uppercase tracking-wider transition-all relative",
                activeTab === tab ? "text-accent" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {activeTab === "voices" && assetLibrary.voices.map(voice => (
            <div key={voice.id} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-accent/40 transition-colors group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Mic2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/90">{voice.name}</p>
                    <p className="text-[10px] text-zinc-500">{voice.type}</p>
                  </div>
                </div>
                <PlayCircle className="w-5 h-5 text-zinc-600 group-hover:text-accent transition-colors" />
              </div>
            </div>
          ))}
          {activeTab === "music" && assetLibrary.music.map(track => (
            <div key={track.id} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-accent/40 transition-colors group cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-zinc-500 group-hover:text-accent transition-colors" />
                <span className="text-sm text-zinc-300">{track.name}</span>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono">{track.duration}</span>
            </div>
          ))}
          {activeTab === "styles" && assetLibrary.styles.map(style => (
            <div key={style.id} className="relative aspect-video rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden group cursor-pointer hover:border-accent/50 transition-all">
              <div className="absolute inset-0 flex items-center justify-center text-4xl grayscale group-hover:grayscale-0 transition-all scale-110 group-hover:scale-125">
                {style.preview}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <p className="absolute bottom-2 left-3 text-[10px] font-bold text-white uppercase tracking-widest">{style.name}</p>
            </div>
          ))}

          {activeTab === "explore" && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchImages(searchQuery)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {isSearching ? (
                  <div className="col-span-2 py-8 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-accent animate-spin" />
                  </div>
                ) : images.length > 0 ? (
                  images.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 hover:border-accent/50 transition-all cursor-pointer group relative">
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center">
                    <p className="text-xs text-zinc-600">Enter a search query to find images</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Studio Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-900 glass px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-400">Project:</span>
            <span className="text-sm font-bold border-b border-dashed border-zinc-700 pb-0.5">Black Hole Explained</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-400 hover:text-white transition-colors">
              <History className="w-5 h-5" />
            </button>
            <button className="p-2 text-zinc-400 hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </button>
            <div className="h-4 w-[1px] bg-zinc-800 mx-2" />
            
            <div className="relative">
              <button 
                onClick={startExport}
                disabled={isExporting}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                  isExporting ? "bg-accent/20 text-accent cursor-not-allowed" : "bg-accent text-white hover:bg-accent/90 glow-purple"
                )}
              >
                {isExporting ? `Rendering ${exportProgress}%` : <>Render & Export <Download className="w-4 h-4" /></>}
              </button>
              {isExporting && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${exportProgress}%` }}
                  className="absolute -bottom-1 left-0 h-[2px] bg-accent shadow-[0_0_10px_#A855F7]"
                />
              )}
            </div>
          </div>
        </header>

        {/* Studio Content */}
        <div className="flex-1 p-8 bg-[#070707] flex flex-col gap-8 overflow-hidden">
          {/* Live Canvas Preview */}
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-full max-w-4xl aspect-video rounded-3xl bg-black border border-white/5 shadow-2xl overflow-hidden relative group">
              {/* Fake Video Preview */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-60 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full glass flex items-center justify-center cursor-pointer hover:scale-110 transition-transform group-hover:border-accent/50 flex-col gap-1">
                  <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                </div>
              </div>

              {/* Overlay Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 rounded-full glass border-white/10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                <button className="p-2 text-zinc-300 hover:text-white"><Layers className="w-4 h-4" /></button>
                <button className="p-2 text-zinc-300 hover:text-white"><Type className="w-4 h-4" /></button>
                <div className="w-[1px] h-4 bg-zinc-800" />
                <button className="p-2 text-zinc-300 hover:text-white"><Settings className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Timeline Editor */}
          <section className="h-80 glass rounded-3xl border-white/5 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Timeline</span>
                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                  <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">00:42 / 02:30</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button className="p-1.5 text-zinc-500 hover:text-white transition-colors"><ChevronRight className="rotate-180 w-4 h-4" /></button>
                 <button className="p-1.5 text-zinc-500 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto p-6 scrollbar-hide">
              <div className="flex gap-4 min-w-max h-full">
                {/* Scene 1 (The Magic Input context) */}
                <div className="w-64 h-full flex flex-col gap-3 group">
                  <div className="flex-1 rounded-2xl border border-accent/30 bg-accent/5 overflow-hidden relative">
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-accent text-[8px] font-bold">SCENE 1</div>
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <p className="text-[10px] text-zinc-300 italic text-center">"A massive swirling vortex of light and darkness..."</p>
                    </div>
                  </div>
                  <div className="h-20 glass rounded-xl border-white/5 p-3 flex flex-col gap-2">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Script</p>
                    <textarea 
                      className="bg-transparent text-[11px] leading-relaxed resize-none p-0 outline-none border-none text-zinc-300 font-medium"
                      defaultValue="A black hole is not just a hole. It's a place with so much gravity..."
                    />
                  </div>
                </div>

                {/* Scene 2 */}
                <div className="w-64 h-full flex flex-col gap-3 opacity-60 hover:opacity-100 transition-opacity">
                   <div className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden relative">
                     <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-zinc-800 text-[8px] font-bold">SCENE 2</div>
                     <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614728263952-84ea206f99b6?auto=format&fit=crop&q=80')] bg-cover opacity-40" />
                   </div>
                   <div className="h-20 glass rounded-xl border-white/5 p-3 flex flex-col gap-2">
                     <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Script</p>
                     <textarea 
                       className="bg-transparent text-[11px] leading-relaxed resize-none p-0 outline-none border-none text-zinc-300/50"
                       defaultValue="Try to think of it as a slide that only goes one way. Down, down, down."
                     />
                   </div>
                </div>

                {/* New Scene Button */}
                <div className="w-20 h-full flex items-center justify-center">
                  <button className="w-12 h-12 rounded-full border border-dashed border-zinc-800 flex items-center justify-center text-zinc-700 hover:text-accent hover:border-accent transition-all">
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
