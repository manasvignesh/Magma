import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Upload, Bookmark, RotateCcw, Accessibility,
  SlidersHorizontal, Trash2, CheckCircle2, Menu, X, ChevronUp, Sparkles,
  Wand2, Loader2,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface ClothingItem { id: string; name: string; img: string; }

const INIT_CLOTHING: Record<string, ClothingItem[]> = {
  topwear: [
    { id:'t1', name:'White Tee', img:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop' },
    { id:'t2', name:'Black Tee', img:'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&h=200&fit=crop' },
    { id:'t3', name:'Beige Tee', img:'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=200&h=200&fit=crop' },
    { id:'t4', name:'Black Polo', img:'https://images.unsplash.com/photo-1618354691229-88d47f285158?w=200&h=200&fit=crop' },
    { id:'t5', name:'Green Hoodie', img:'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=200&h=200&fit=crop' },
    { id:'t6', name:'Gray Sweatshirt', img:'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=200&h=200&fit=crop' },
    { id:'t7', name:'Denim Jacket', img:'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=200&h=200&fit=crop' },
    { id:'t8', name:'Flannel Shirt', img:'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=200&h=200&fit=crop' },
    { id:'t9', name:'Blue Shirt', img:'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=200&h=200&fit=crop' },
    { id:'t10', name:'Striped Tee', img:'https://images.unsplash.com/photo-1627225924765-552d49cf2b5d?w=200&h=200&fit=crop' },
    { id:'t11', name:'Olive Tee', img:'https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=200&h=200&fit=crop' },
    { id:'t12', name:'Navy Tee', img:'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=200&h=200&fit=crop' },
  ],
  bottomwear: [
    { id:'b1', name:'Black Cargo', img:'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200&h=200&fit=crop' },
    { id:'b2', name:'Blue Jeans', img:'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=200&h=200&fit=crop' },
    { id:'b3', name:'Khaki Chinos', img:'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=200&h=200&fit=crop' },
  ],
  footwear: [
    { id:'f1', name:'White Sneakers', img:'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&h=200&fit=crop' },
    { id:'f2', name:'Black Boots', img:'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=200&h=200&fit=crop' },
  ],
  cap: [
    { id:'a1', name:'Beige Cap', img:'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=200&h=200&fit=crop' },
    { id:'c2', name:'Black Cap', img:'https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=200&h=200&fit=crop' },
  ],
  goggles: [
    { id:'a2', name:'Sunglasses', img:'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&h=200&fit=crop' },
    { id:'g2', name:'Classic Shades', img:'https://images.unsplash.com/photo-1511499767350-a1590fdb7ca7?w=200&h=200&fit=crop' },
  ],
  accessories: [
    { id:'a3', name:'Watch', img:'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=200&h=200&fit=crop' },
  ],
};

type CatKey = keyof typeof INIT_CLOTHING;
const CATS: { key: string; label: string }[] = [
  { key:'topwear', label:'Top Wear' },
  { key:'bottomwear', label:'Bottom Wear' },
  { key:'footwear', label:'Foot Wear' },
  { key:'cap', label:'Cap' },
  { key:'goggles', label:'Goggles' },
  { key:'accessories', label:'Accessories' },
];

const VIBES = ['Gen Z','Minimal','Streetwear','Smart Casual','Wedding','Y2K','Vintage','Athleisure'];

interface SavedOutfit {
  id: number;
  selections: Record<string, string[]>;
  date: string;
  vibe?: string;
  aiNote?: string;
}

/* helpers */
const fileToBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res((r.result as string).split(',')[1]); r.onerror = rej; r.readAsDataURL(file);
});
const fileToDataUrl = (file: File): Promise<string> => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file);
});

const Wardrobe: React.FC = () => {
  const [wardrobeStore, setWardrobeStore] = useState<Record<string, ClothingItem[]>>({...INIT_CLOTHING});
  const [cat, setCat] = useState<string>('topwear');
  const [selections, setSelections] = useState<Record<string, string[]>>({
    topwear:[], bottomwear:[], footwear:[], cap:[], goggles:[], accessories:[],
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showOutfitGen, setShowOutfitGen] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState('Streetwear');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStylingNote, setAiStylingNote] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const items = wardrobeStore[cat] || [];
  const label = CATS.find(c => c.key === cat)?.label || '';
  const getCount = (key: string) => (selections[key] || []).length;
  const totalItems = Object.values(selections).reduce((sum, arr) => sum + arr.length, 0);

  // Find item by id across all categories
  const findItem = (id: string): ClothingItem | undefined => {
    for (const arr of Object.values(wardrobeStore)) {
      const found = arr.find(i => i.id === id);
      if (found) return found;
    }
    return undefined;
  };

  // Get first selected item for a category (for mannequin overlay)
  const getSelectedImg = (key: string): string | null => {
    const sel = selections[key];
    if (!sel || sel.length === 0) return null;
    const item = findItem(sel[0]);
    return item?.img || null;
  };

  const toggleItem = useCallback((itemId: string) => {
    setSelections(prev => {
      const current = prev[cat] || [];
      const exists = current.includes(itemId);
      return { ...prev, [cat]: exists ? current.filter(id => id !== itemId) : [...current, itemId] };
    });
  }, [cat]);

  const openDrawerTo = useCallback((category: string) => {
    setCat(category);
    setDrawerOpen(true);
  }, []);

  const saveOutfit = useCallback(() => {
    if (totalItems === 0) return;
    const outfit: SavedOutfit = {
      id: Date.now(), selections: { ...selections }, date: new Date().toLocaleDateString(),
      vibe: selectedVibe, aiNote: aiStylingNote,
    };
    setSavedOutfits(prev => [outfit, ...prev]);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2500);
  }, [selections, totalItems, selectedVibe, aiStylingNote]);

  const resetSelections = useCallback(() => {
    setSelections({ topwear:[], bottomwear:[], footwear:[], cap:[], goggles:[], accessories:[] });
    setAiStylingNote('');
  }, []);

  // ── UPLOAD + AI CATEGORIZATION ──
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const base64 = await fileToBase64(file);
      const apiKey = (import.meta as any).env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      let category = 'topwear'; // fallback
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { data: base64, mimeType: file.type } },
              { text: 'Classify this clothing item into one category only: topwear, bottomwear, footwear, cap, goggles, accessories. Return only the lowercase category name, nothing else.' },
            ],
          }],
        });
        const raw = (res as any).text?.trim?.() || (res as any).candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        const mapped = raw.toLowerCase().replace(/\s/g,'');
        if (['topwear','bottomwear','footwear','cap','goggles','accessories'].includes(mapped)) category = mapped;
      }
      const newItem: ClothingItem = { id: `u${Date.now()}`, name: file.name.split('.')[0], img: dataUrl };
      setWardrobeStore(prev => ({ ...prev, [category]: [...(prev[category] || []), newItem] }));
      setCat(category);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2000);
    } catch (err) { console.error('Upload error:', err); }
    setUploading(false);
    if (uploadRef.current) uploadRef.current.value = '';
  };

  // ── AI OUTFIT GENERATOR ──
  const generateOutfit = async () => {
    setAiGenerating(true);
    setAiStylingNote('');
    try {
      const apiKey = (import.meta as any).env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) { setAiStylingNote('Set GEMINI_API_KEY to use AI styling.'); setAiGenerating(false); return; }
      const ai = new GoogleGenAI({ apiKey });
      const inventory: Record<string, string[]> = {};
      for (const [k, arr] of Object.entries(wardrobeStore)) { inventory[k] = arr.map(i => `${i.id}:${i.name}`); }
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `You are a fashion stylist. Given this wardrobe inventory:\n${JSON.stringify(inventory)}\n\nCreate a ${selectedVibe} outfit. Pick exactly ONE item id from each available category (topwear, bottomwear, footwear). Optionally pick cap/goggles/accessories.\n\nReturn ONLY valid JSON:\n{"topwear":"id","bottomwear":"id","footwear":"id","cap":"id or null","goggles":"id or null","accessories":"id or null","note":"2-sentence styling explanation"}` }],
        }],
      });
      const raw = (res as any).text?.trim?.() || (res as any).candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      const jsonStr = raw.replace(/```json\n?/g,'').replace(/```/g,'').trim();
      const parsed = JSON.parse(jsonStr);
      const newSel: Record<string, string[]> = { topwear:[], bottomwear:[], footwear:[], cap:[], goggles:[], accessories:[] };
      for (const key of Object.keys(newSel)) {
        if (parsed[key] && parsed[key] !== 'null' && parsed[key] !== null) newSel[key] = [parsed[key]];
      }
      setSelections(newSel);
      setAiStylingNote(parsed.note || 'Outfit generated!');
    } catch (err) { console.error('AI gen error:', err); setAiStylingNote('Could not generate outfit. Try again.'); }
    setAiGenerating(false);
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) setDrawerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [drawerOpen]);

  return (
    <div className="relative flex flex-col w-full" style={{ height:'calc(100vh - 80px)', background:'linear-gradient(180deg,#eef2ff 0%,#f0f4ff 40%,#fff 100%)' }}>

      {/* ── HEADER ── */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between z-10 flex-shrink-0">
        <div>
          <h1 style={{ fontWeight:800, fontSize:'1.4rem', color:'#111', letterSpacing:'-0.02em', lineHeight:1.2 }}>Your Digital Wardrobe</h1>
          <p style={{ color:'#7c8db5', fontSize:'0.72rem', marginTop:2, fontWeight:500 }}>Organize, mix, and match your collection.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowOutfitGen(true)} title="AI Stylist"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105"
            style={{ background:'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow:'0 2px 10px rgba(99,102,241,0.4)' }}>
            <Wand2 className="w-4 h-4" />
          </button>
          <button onClick={resetSelections} title="Clear all"
            className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
            style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #e8eaf0' }}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── MANNEQUIN AREA ── */}
      <div className="flex-1 relative overflow-hidden mx-3 rounded-3xl"
        style={{ background:'linear-gradient(180deg,#eef2ff 0%,#f5f7ff 100%)', border:'1px solid #dde3f0', minHeight:0 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/manequin.png" alt="Mannequin" className="h-full w-full object-contain" />
        </div>

        {/* Clothing overlays on mannequin */}
        {getSelectedImg('cap') && (
          <div className="absolute" style={{ top:'2%', left:'35%', width:'30%', height:'12%', transition:'all 0.5s ease', animation:'fadeZoom 0.5s ease' }}>
            <img src={getSelectedImg('cap')!} alt="" className="w-full h-full object-contain rounded-lg" style={{ filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }} />
          </div>
        )}
        {getSelectedImg('goggles') && (
          <div className="absolute" style={{ top:'12%', left:'33%', width:'34%', height:'8%', transition:'all 0.5s ease', animation:'fadeZoom 0.5s ease' }}>
            <img src={getSelectedImg('goggles')!} alt="" className="w-full h-full object-contain rounded-lg" style={{ filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }} />
          </div>
        )}
        {getSelectedImg('topwear') && (
          <div className="absolute" style={{ top:'22%', left:'25%', width:'50%', height:'28%', transition:'all 0.5s ease', animation:'fadeZoom 0.5s ease' }}>
            <img src={getSelectedImg('topwear')!} alt="" className="w-full h-full object-contain rounded-xl" style={{ filter:'drop-shadow(0 6px 20px rgba(0,0,0,0.25))' }} />
          </div>
        )}
        {getSelectedImg('bottomwear') && (
          <div className="absolute" style={{ top:'50%', left:'28%', width:'44%', height:'30%', transition:'all 0.5s ease', animation:'fadeZoom 0.5s ease' }}>
            <img src={getSelectedImg('bottomwear')!} alt="" className="w-full h-full object-contain rounded-xl" style={{ filter:'drop-shadow(0 6px 20px rgba(0,0,0,0.25))' }} />
          </div>
        )}
        {getSelectedImg('footwear') && (
          <div className="absolute" style={{ bottom:'2%', left:'30%', width:'40%', height:'14%', transition:'all 0.5s ease', animation:'fadeZoom 0.5s ease' }}>
            <img src={getSelectedImg('footwear')!} alt="" className="w-full h-full object-contain rounded-lg" style={{ filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }} />
          </div>
        )}

        {/* Hotspots */}
        <button onClick={() => openDrawerTo('cap')} className="absolute cursor-pointer hover:scale-105 transition-transform" style={{ top:'4%', left:'2%', width:'28%', height:'8%', background:'transparent', border:'none' }} />
        <button onClick={() => openDrawerTo('goggles')} className="absolute cursor-pointer hover:scale-105 transition-transform" style={{ top:'13%', left:'2%', width:'28%', height:'8%', background:'transparent', border:'none' }} />
        <button onClick={() => openDrawerTo('topwear')} className="absolute cursor-pointer hover:scale-105 transition-transform" style={{ top:'28%', right:'2%', width:'30%', height:'8%', background:'transparent', border:'none' }} />
        <button onClick={() => openDrawerTo('bottomwear')} className="absolute cursor-pointer hover:scale-105 transition-transform" style={{ top:'52%', left:'2%', width:'30%', height:'8%', background:'transparent', border:'none' }} />
        <button onClick={() => openDrawerTo('footwear')} className="absolute cursor-pointer hover:scale-105 transition-transform" style={{ bottom:'12%', right:'2%', width:'30%', height:'8%', background:'transparent', border:'none' }} />

        {/* Badges */}
        {(['cap','goggles','topwear','bottomwear','footwear'] as string[]).map(k => {
          if (getCount(k) === 0) return null;
          const pos: Record<string,any> = { cap:{top:'5%',left:'14%'}, goggles:{top:'14%',left:'14%'}, topwear:{top:'29%',right:'10%'}, bottomwear:{top:'53%',left:'14%'}, footwear:{bottom:'13%',right:'10%'} };
          return <div key={k} className="absolute flex items-center justify-center w-5 h-5 rounded-full text-white text-[9px] font-bold" style={{ ...pos[k], background:'#6366f1', boxShadow:'0 2px 8px rgba(99,102,241,0.5)' }}>{getCount(k)}</div>;
        })}

        {/* AI Styling Note */}
        {aiStylingNote && (
          <div className="absolute bottom-3 left-3 right-3 px-4 py-3 rounded-2xl text-xs font-medium" style={{ background:'rgba(255,255,255,0.85)', backdropFilter:'blur(12px)', border:'1px solid rgba(99,102,241,0.2)', color:'#333', animation:'slideUp 0.4s ease' }}>
            <div className="flex items-center gap-2 mb-1"><Sparkles className="w-3.5 h-3.5 text-indigo-500" /><span className="font-bold text-indigo-600">AI Stylist</span></div>
            {aiStylingNote}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0">
        <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <div className="flex gap-2">
          <button onClick={resetSelections} title="Reset"
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #eee' }}>
            <RotateCcw className="w-[18px] h-[18px]" />
          </button>
          <button onClick={() => uploadRef.current?.click()} title="Upload" disabled={uploading}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'1px solid #eee' }}>
            {uploading ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Upload className="w-[18px] h-[18px]" />}
          </button>
        </div>

        <button onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95"
          style={{ background:'white', color:'#333', boxShadow:'0 2px 10px rgba(0,0,0,0.08)', border:'1px solid #eee' }}>
          <Menu className="w-4 h-4" />
          Select Item
          {totalItems > 0 && (
            <span className="ml-0.5 w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
              style={{ background:'#6366f1' }}>
              {totalItems}
            </span>
          )}
          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
        </button>

        <button onClick={saveOutfit}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-95"
          style={{
            background: totalItems > 0 ? 'linear-gradient(135deg,#6366f1,#818cf8)' : '#ddd',
            boxShadow: totalItems > 0 ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
            cursor: totalItems > 0 ? 'pointer' : 'not-allowed',
          }}>
          <Bookmark className="w-3.5 h-3.5" /> Save Outfit
        </button>
      </div>

      {/* ── SAVE TOAST ── */}
      {showSaveToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-2xl bg-white text-gray-900 text-sm font-bold flex items-center gap-2"
          style={{ boxShadow:'0 8px 30px rgba(0,0,0,0.15)', animation:'slideDown 0.3s ease' }}>
          <Sparkles className="w-4 h-4 text-rose-500" />
          Outfit saved! ({totalItems} items)
        </div>
      )}

      {/* ── BACKDROP ── */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background:'rgba(0,0,0,0.35)',
          backdropFilter:'blur(2px)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
        }}
        onClick={() => setDrawerOpen(false)}
      />

      {/* ── BOTTOM SHEET DRAWER ── */}
      <div
        ref={drawerRef}
        className="fixed left-0 right-0 z-50 flex flex-col bg-white rounded-t-3xl overflow-hidden"
        style={{
          bottom: 0,
          maxHeight: '78vh',
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: drawerOpen ? '0 -8px 40px rgba(0,0,0,0.15)' : 'none',
        }}
      >
        {/* Drawer handle */}
        <div className="flex items-center justify-center pt-3 pb-1 flex-shrink-0 cursor-grab"
          onClick={() => setDrawerOpen(false)}>
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 pb-2 pt-1 flex-shrink-0">
          <div>
            <h2 style={{ fontWeight:800, fontSize:'1.1rem', color:'#111' }}>Select Item</h2>
            {totalItems > 0 && (
              <p style={{ fontSize:11, color:'#999', marginTop:1 }}>{totalItems} item{totalItems > 1 ? 's' : ''} selected</p>
            )}
          </div>
          <button onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-8">
          <div className="flex flex-col gap-4">

            {/* Category Tabs */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
              {CATS.map(c => {
                const count = getCount(c.key);
                return (
                  <button key={c.key} onClick={() => setCat(c.key)}
                    className="whitespace-nowrap px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5"
                    style={cat === c.key
                      ? { background:'#eef2ff', color:'#6366f1', border:'1.5px solid #c7d2fe' }
                      : { background:'#f9f9f9', color:'#999', border:'1.5px solid transparent' }
                    }>
                    {c.label}
                    {count > 0 && (
                      <span className="w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
                        style={{ background:'#6366f1' }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search + Upload */}
            <div className="grid grid-cols-2 gap-2.5">
              <button className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl bg-white hover:bg-gray-50 transition-colors"
                style={{ border:'1.5px solid #f0f0f0', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center"
                  style={{ border:'1.5px solid #eee', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <Search className="w-4 h-4 text-gray-800" />
                </div>
                <span style={{ fontSize:9, fontWeight:700, color:'#333' }}>Search Similar</span>
              </button>
              <button onClick={() => uploadRef.current?.click()} disabled={uploading}
                className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl bg-white hover:bg-indigo-50 transition-colors"
                style={{ border:'1.5px solid #e0e7ff', boxShadow:'0 2px 8px rgba(99,102,241,0.08)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background:'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow:'0 2px 8px rgba(99,102,241,0.3)' }}>
                  {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Upload className="w-4 h-4 text-white" />}
                </div>
                <span style={{ fontSize:9, fontWeight:700, color:'#6366f1' }}>{uploading ? 'Classifying...' : 'Upload Image'}</span>
              </button>
            </div>

            {/* Items heading */}
            <h3 style={{ fontWeight:700, fontSize:'0.85rem', color:'#222', marginTop:2 }}>
              Your {label}
              {getCount(cat) > 0 && (
                <span style={{ color:'#6366f1', marginLeft:6, fontSize:'0.75rem' }}>
                  ({getCount(cat)} selected)
                </span>
              )}
            </h3>

            {/* Items grid */}
            <div className="grid grid-cols-4 gap-2.5">
              {items.map(item => {
                const isSel = (selections[cat] || []).includes(item.id);
                return (
                  <button key={item.id} onClick={() => toggleItem(item.id)}
                    className="relative aspect-square rounded-xl overflow-hidden transition-all active:scale-95"
                    style={{
                      border: isSel ? '2.5px solid #6366f1' : '1.5px solid #f0f0f0',
                      boxShadow: isSel ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
                      background:'#fafafa',
                    }}>
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    {isSel && (
                      <div className="absolute top-1 right-1">
                        <CheckCircle2 className="w-5 h-5 text-indigo-500" fill="white" strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── OUTFIT GENERATOR MODAL ── */}
      {showOutfitGen && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/40" style={{ backdropFilter:'blur(4px)' }} onClick={() => setShowOutfitGen(false)} />
          <div className="fixed left-4 right-4 z-[80] rounded-3xl bg-white p-5 flex flex-col gap-4" style={{ top:'50%', transform:'translateY(-50%)', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', animation:'fadeZoom 0.3s ease' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#6366f1,#818cf8)' }}>
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
                <h2 style={{ fontWeight:800, fontSize:'1.1rem', color:'#111' }}>AI Outfit Generator</h2>
              </div>
              <button onClick={() => setShowOutfitGen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <p style={{ fontSize:12, color:'#666' }}>Pick a style vibe and let AI assemble the perfect outfit from your wardrobe.</p>
            <div className="flex flex-wrap gap-2">
              {VIBES.map(v => (
                <button key={v} onClick={() => setSelectedVibe(v)}
                  className="px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all"
                  style={selectedVibe === v
                    ? { background:'#6366f1', color:'white', boxShadow:'0 4px 12px rgba(99,102,241,0.3)' }
                    : { background:'#f4f4f5', color:'#666' }
                  }>{v}</button>
              ))}
            </div>
            <button onClick={generateOutfit} disabled={aiGenerating}
              className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
              style={{ background:'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow:'0 4px 16px rgba(99,102,241,0.4)' }}>
              {aiGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate {selectedVibe} Outfit</>}
            </button>
            {aiStylingNote && (
              <div className="px-4 py-3 rounded-xl text-xs" style={{ background:'#eef2ff', color:'#4338ca', border:'1px solid #c7d2fe' }}>
                <span className="font-bold">✨ AI Note: </span>{aiStylingNote}
              </div>
            )}
          </div>
        </>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideDown { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeZoom { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default Wardrobe;
