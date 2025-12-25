import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Sparkles, Download, RefreshCw, User, Gift, Snowflake, Star, Menu, X, MessageCircle, Frame } from 'lucide-react';
import { toPng } from 'html-to-image';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
export type CardTone = 'Heartfelt' | 'Funny' | 'Professional' | 'Poetic' | 'Short & Sweet';
export type FrameStyle = 'Classic' | 'Candy Cane' | 'Winter Frost';

export interface CardData {
  recipient: string;
  sender: string;
  tone: CardTone;
  frameStyle: FrameStyle;
  message: string;
  imageUrl: string;
  isGeneratingMessage: boolean;
  isGeneratingImage: boolean;
}

// --- AI Services ---
// Re-initializing for every request as per the guidelines to ensure the latest key is used.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

async function generateWishAI(recipient: string, sender: string, tone: CardTone): Promise<string> {
  const ai = getAI();
  const prompt = `Write a ${tone} Christmas wish for ${recipient} from ${sender}. Keep it under 50 words. Focus on the joy of the holiday season. Do not use any markdown formatting, asterisks, or hashtags. Just the plain text.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "May your holiday be filled with magic and your new year with dreams coming true.";
  } catch (error) {
    console.error("Error generating wish:", error);
    return "Wishing you a season filled with light and laughter. Merry Christmas!";
  }
}

async function generateCardImageAI(tone: CardTone): Promise<string | null> {
  const ai = getAI();
  const prompt = `A high-quality Christmas illustration. Style: ${tone === 'Funny' ? 'Whimsical high-detail Pixar style' : 'Elegant painterly aesthetic'}. Scene: cozy winter landscape, glowing lit pine tree, Santa's sleigh in the sky, soft falling snow. Warm candles. 1:1 aspect ratio. No text. Ultra high resolution.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: prompt }],
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}

// --- Components ---

const SnowEffect = () => {
  useEffect(() => {
    const container = document.body;
    const createSnowflake = () => {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      
      const size = Math.random() * 5 + 2 + 'px';
      snowflake.style.width = size;
      snowflake.style.height = size;
      snowflake.style.left = Math.random() * 100 + 'vw';
      
      const duration = Math.random() * 5 + 5;
      snowflake.style.animation = `snowfall ${duration}s linear forwards`;
      snowflake.style.opacity = (Math.random() * 0.5 + 0.3).toString();
      
      container.appendChild(snowflake);
      
      setTimeout(() => {
        snowflake.remove();
      }, duration * 1000);
    };

    const interval = setInterval(createSnowflake, 200);
    return () => clearInterval(interval);
  }, []);

  return null;
};

const INITIAL_CARD: CardData = {
  recipient: '',
  sender: '',
  tone: 'Heartfelt',
  frameStyle: 'Classic',
  message: 'Enter names below to create your magical Christmas wish...',
  imageUrl: 'https://images.unsplash.com/photo-1543589077-47d816067f70?auto=format&fit=crop&q=80&w=1000',
  isGeneratingMessage: false,
  isGeneratingImage: false,
};

const CardGenerator = () => {
  const [card, setCard] = useState<CardData>(INITIAL_CARD);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleGenerateText = async () => {
    if (!card.recipient || !card.sender) {
      alert("Please enter both recipient and sender names!");
      return;
    }
    setCard(prev => ({ ...prev, isGeneratingMessage: true }));
    const wish = await generateWishAI(card.recipient, card.sender, card.tone);
    setCard(prev => ({ ...prev, message: wish, isGeneratingMessage: false }));
    if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
  };

  const handleGenerateImage = async () => {
    setCard(prev => ({ ...prev, isGeneratingImage: true }));
    const img = await generateCardImageAI(card.tone);
    if (img) {
      setCard(prev => ({ ...prev, imageUrl: img, isGeneratingImage: false }));
    } else {
      setCard(prev => ({ ...prev, isGeneratingImage: false }));
    }
  };

  const downloadPNG = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      // Small delay to ensure any transient states (hovers etc) are settled
      await new Promise(r => setTimeout(r, 200));
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3, 
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `christmas-card-${(card.recipient || 'gift').replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Could not download image. Try taking a screenshot or use "Print".');
    } finally {
      setIsDownloading(false);
    }
  };

  const shareToWhatsApp = () => {
    const siteUrl = window.location.origin;
    const text = `🎄 Christmas Card for ${card.recipient || 'you'}! 🎅\n\n"${card.message}"\n\nCreate yours: ${siteUrl}\n\nGenerated by Infinity Team ✨`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const CardFrame = ({ style }: { style: FrameStyle }) => {
    if (style === 'Candy Cane') {
      return (
        <div className="absolute inset-0 pointer-events-none z-10 border-[14px] m-2 rounded-[1.5rem] border-red-600/10 flex flex-col overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, #ffffff 10px, #ffffff 20px)' }} />
          <div className="relative h-full flex flex-col justify-between p-2">
            <div className="flex justify-between"><Star className="text-red-500/40 animate-pulse" size={18} fill="currentColor" /><Star className="text-red-500/40 animate-pulse" size={18} fill="currentColor" /></div>
            <div className="flex justify-between"><Star className="text-red-500/40 animate-pulse" size={18} fill="currentColor" /><Star className="text-red-500/40 animate-pulse" size={18} fill="currentColor" /></div>
          </div>
        </div>
      );
    }
    if (style === 'Winter Frost') {
      return (
        <div className="absolute inset-0 pointer-events-none z-10 border-[16px] border-white/40 backdrop-blur-[2px] m-2 rounded-[1.5rem] flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-30" />
          <div className="flex justify-between p-4"><Snowflake className="text-blue-400/50 animate-spin-slow" size={22} /><Snowflake className="text-blue-400/50 animate-spin-slow" size={14} /><Snowflake className="text-blue-400/50 animate-spin-slow" size={22} /></div>
          <div className="flex-1" />
          <div className="flex justify-between p-4"><Snowflake className="text-blue-400/50 animate-spin-slow" size={22} /><Snowflake className="text-blue-400/50 animate-spin-slow" size={14} /><Snowflake className="text-blue-400/50 animate-spin-slow" size={22} /></div>
        </div>
      );
    }
    return (
      <div className="absolute inset-0 pointer-events-none z-10 border-[12px] border-white/10 m-2 rounded-[1.5rem] flex flex-col">
        <div className="flex justify-between p-4"><Snowflake className="text-white/20" size={20} /><Star className="text-red-500/30" size={24} /><Snowflake className="text-white/20" size={20} /></div>
        <div className="flex-1 flex items-center justify-between px-2">
          <div className="w-px h-1/4 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="w-px h-1/4 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        </div>
        <div className="flex justify-between p-4"><Snowflake className="text-white/20" size={20} /><Gift className="text-emerald-500/30" size={24} /><Snowflake className="text-white/20" size={20} /></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center relative bg-transparent">
      <SnowEffect />
      
      <header className="w-full max-w-7xl px-4 py-4 sm:py-6 flex justify-between items-center no-print relative z-[20]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 -rotate-6">
            <Sparkles className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl sm:text-2xl tracking-tighter uppercase leading-none italic">Infinity</h1>
            <p className="text-[8px] sm:text-[10px] tracking-[0.3em] font-bold text-red-500 uppercase">Christmas Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={shareToWhatsApp} className="p-2 sm:px-4 sm:py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full transition-all shadow-xl flex items-center gap-2">
            <MessageCircle size={18} /><span className="hidden md:inline">WhatsApp</span>
          </button>
          <button onClick={downloadPNG} disabled={isDownloading} className="p-2 sm:px-4 sm:py-2 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all shadow-xl flex items-center gap-2 disabled:opacity-50">
            {isDownloading ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
            <span className="hidden md:inline">PNG</span>
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 bg-zinc-800 rounded-full text-white">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-4 mb-12 flex-1 relative z-[20]">
        <div className={`fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] lg:hidden transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          <div className="flex justify-end p-6"><button onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-zinc-800 rounded-full text-white"><X size={24} /></button></div>
          <div className="px-6 pb-20 overflow-y-auto h-full">
             <h2 className="text-3xl font-black mb-8 text-white text-center">Designer</h2>
             <ControlsSection card={card} setCard={setCard} onGenerateText={handleGenerateText} onGenerateImage={handleGenerateImage} />
          </div>
        </div>

        <section className="hidden lg:block lg:col-span-4 space-y-6 no-print sticky top-24">
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-[3rem] shadow-2xl">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><User size={20} className="text-red-500" />Studio</h2>
            <ControlsSection card={card} setCard={setCard} onGenerateText={handleGenerateText} onGenerateImage={handleGenerateImage} />
          </div>
        </section>

        <section className="lg:col-span-8 flex justify-center items-center py-4 w-full">
          <div className="relative w-full max-w-[480px]">
            <div ref={cardRef} className="card-to-print relative bg-white text-zinc-900 w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] flex flex-col">
              <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 z-20"><div className="text-4xl text-center">🎅</div></div>
              <div className="relative h-[42%] overflow-hidden">
                <CardFrame style={card.frameStyle} />
                <img src={card.imageUrl} className="w-full h-full object-cover" alt="Festive" crossOrigin="anonymous" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-80" />
              </div>
              <div className="flex-1 px-8 py-10 flex flex-col items-center justify-between text-center bg-white">
                <div className="space-y-6 w-full">
                  <h3 className="font-christmas text-4xl sm:text-5xl md:text-6xl text-red-600">Merry Christmas</h3>
                  <div className="min-h-[100px] flex items-center justify-center">
                    {card.isGeneratingMessage ? <div className="animate-pulse text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Summoning Wish...</div> :
                      <p className="font-serif-elegant text-lg sm:text-xl leading-relaxed italic text-zinc-800">{card.message}</p>
                    }
                  </div>
                </div>
                <div className="w-full space-y-1">
                  <div className="flex items-center gap-4 justify-center">
                    <div className="h-px w-8 bg-zinc-200" />
                    <p className="font-script text-2xl sm:text-3xl text-emerald-700">With love, {card.sender || 'Santa'}</p>
                    <div className="h-px w-8 bg-zinc-200" />
                  </div>
                  <p className="text-[8px] uppercase tracking-widest font-black text-zinc-300">Specially for {card.recipient || 'Everyone'}</p>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-200">INF-PRO-2024</div>
              <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-yellow-400 to-emerald-600" />
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-10 text-center no-print relative z-[20]">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-zinc-600 text-[10px] tracking-[0.4em] uppercase font-black opacity-80 mb-2">credits - generated by infinity team</p>
          <p className="text-zinc-800 text-[8px] uppercase font-bold tracking-[0.2em]">Powered by Gemini & Infinity Card Studio</p>
        </div>
      </footer>
      <style>{`.animate-spin-slow { animation: spin 10s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const ControlsSection = ({ card, setCard, onGenerateText, onGenerateImage }: any) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Card For</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
          <input type="text" placeholder="Recipient's Name" className="w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-red-500 transition-all text-sm font-bold text-white" value={card.recipient} onChange={(e) => setCard({ ...card, recipient: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">From</label>
        <div className="relative">
          <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
          <input type="text" placeholder="Your Name" className="w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-red-500 transition-all text-sm font-bold text-white" value={card.sender} onChange={(e) => setCard({ ...card, sender: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Style</label>
        <div className="grid grid-cols-2 gap-2">
          {(['Heartfelt', 'Funny', 'Professional', 'Poetic', 'Short & Sweet'] as CardTone[]).map(t => (
            <button key={t} onClick={() => setCard({ ...card, tone: t })} className={`px-2 py-3 text-[9px] uppercase font-black rounded-xl border transition-all ${card.tone === t ? 'bg-red-600 border-red-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Frame</label>
        <div className="grid grid-cols-3 gap-2">
          {(['Classic', 'Candy Cane', 'Winter Frost'] as FrameStyle[]).map(fs => (
            <button key={fs} onClick={() => setCard({ ...card, frameStyle: fs })} className={`px-2 py-3 text-[9px] uppercase font-black rounded-xl border transition-all flex flex-col items-center gap-1 ${card.frameStyle === fs ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}><Frame size={14} />{fs}</button>
          ))}
        </div>
      </div>
    </div>
    <div className="pt-4 space-y-3">
      <button onClick={onGenerateText} disabled={card.isGeneratingMessage} className="w-full flex items-center justify-center gap-3 bg-white text-black font-black py-4 rounded-3xl transition-all disabled:opacity-50">
        {card.isGeneratingMessage ? <RefreshCw className="animate-spin" /> : <Sparkles size={20} />}Summon AI Wish
      </button>
      <button onClick={onGenerateImage} disabled={card.isGeneratingImage} className="w-full flex items-center justify-center gap-3 bg-zinc-800 border border-zinc-700 text-white text-sm font-bold py-4 rounded-3xl transition-all disabled:opacity-50">
        {card.isGeneratingImage ? <RefreshCw className="animate-spin" size={18} /> : <Snowflake size={18} />}New Magic Art
      </button>
    </div>
  </div>
);

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<CardGenerator />);
}