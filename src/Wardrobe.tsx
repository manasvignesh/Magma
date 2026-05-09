import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Bookmark, X, ChevronUp, Sparkles, Ruler, Weight, Download } from 'lucide-react';
import MannequinSVG from './MannequinSVG';
import ClothingCanvas from './ClothingCanvas';
import { CLOTHING, CATEGORIES, ZONE_CONFIG, calcBodyScales, type CatKey, type ClothingItem } from './WardrobeData';

const Wardrobe: React.FC = () => {
  const [height, setHeight] = useState(() => Number(localStorage.getItem('wb_h')) || 175);
  const [weight, setWeight] = useState(() => Number(localStorage.getItem('wb_w')) || 70);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCat, setDrawerCat] = useState<CatKey>('topwear');
  const [equipped, setEquipped] = useState<Record<string, string | null>>({ cap: null, goggles: null, topwear: null, bottomwear: null, footwear: null });
  const [showBody, setShowBody] = useState(false);
  const [toast, setToast] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);
  const mannequinRef = useRef<HTMLDivElement>(null);

  const scales = calcBodyScales(height, weight);
  const bmi = weight / Math.pow(height / 100, 2);
  const bodyLabel = bmi < 18.5 ? 'Slim' : bmi < 25 ? 'Average' : bmi < 30 ? 'Athletic' : 'Broad';

  useEffect(() => { localStorage.setItem('wb_h', String(height)); localStorage.setItem('wb_w', String(weight)); }, [height, weight]);

  const findItem = (id: string): ClothingItem | undefined => {
    for (const arr of Object.values(CLOTHING)) { const f = arr.find(i => i.id === id); if (f) return f; }
  };

  const openZone = useCallback((zone: string) => {
    setActiveZone(zone);
    setDrawerCat(zone as CatKey);
    setDrawerOpen(true);
  }, []);

  const equipItem = useCallback((cat: CatKey, itemId: string) => {
    setEquipped(prev => ({ ...prev, [cat]: prev[cat] === itemId ? null : itemId }));
  }, []);

  const resetAll = useCallback(() => {
    setEquipped({ cap: null, goggles: null, topwear: null, bottomwear: null, footwear: null });
    setActiveZone(null);
  }, []);

  const saveOutfit = useCallback(() => {
    const outfits = JSON.parse(localStorage.getItem('wb_outfits') || '[]');
    outfits.unshift({ id: Date.now(), equipped: { ...equipped }, date: new Date().toLocaleDateString() });
    localStorage.setItem('wb_outfits', JSON.stringify(outfits.slice(0, 20)));
    setToast('Outfit saved!');
    setTimeout(() => setToast(''), 2000);
  }, [equipped]);

  const totalEquipped = Object.values(equipped).filter(Boolean).length;

  useEffect(() => {
    if (!drawerOpen) return;
    const h = (e: MouseEvent) => { if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) { setDrawerOpen(false); setActiveZone(null); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [drawerOpen]);

  return (
    <div className="wardrobe-bg relative flex flex-col w-full overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between z-10 flex-shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Digital Wardrobe</h1>
          <p className="text-[11px] text-indigo-300/70 font-medium mt-0.5">Interactive Mannequin Styling</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBody(!showBody)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 glass-panel-light" title="Body Settings">
            <Ruler className="w-4 h-4 text-indigo-300" />
          </button>
          <button onClick={resetAll} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 glass-panel-light" title="Reset">
            <RotateCcw className="w-4 h-4 text-indigo-300" />
          </button>
        </div>
      </div>

      {/* Body Input Panel */}
      <AnimatePresence>
        {showBody && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden flex-shrink-0 px-5">
            <div className="glass-panel rounded-2xl p-4 mb-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-200">Body Proportions</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>{bodyLabel} • BMI {bmi.toFixed(1)}</span>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] text-indigo-300/70 mb-1"><span>Height</span><span className="font-bold text-indigo-200">{height} cm</span></div>
                  <input type="range" min="150" max="200" value={height} onChange={e => setHeight(+e.target.value)} className="w-full accent-indigo-500 h-1" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] text-indigo-300/70 mb-1"><span>Weight</span><span className="font-bold text-indigo-200">{weight} kg</span></div>
                  <input type="range" min="40" max="130" value={weight} onChange={e => setWeight(+e.target.value)} className="w-full accent-indigo-500 h-1" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mannequin Area */}
      <div className="flex-1 relative mx-3 rounded-3xl overflow-hidden" style={{ minHeight: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08) 0%, transparent 70%)' }} ref={mannequinRef}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 60%)' }} />

        {/* SVG Mannequin + Canvas Clothing */}
        <div className="absolute inset-0 flex items-center justify-center p-4" style={{ transform: `scale(${scales.overall})`, transition: 'transform 0.5s ease' }}>
          <div className="h-full relative" style={{ aspectRatio: '200/480' }}>
            <MannequinSVG scales={scales} activeZone={activeZone} onZoneClick={openZone} />
            <ClothingCanvas equipped={equipped} scales={scales} findItem={findItem} />
          </div>
        </div>

        {/* Zone Labels */}
        {Object.entries(ZONE_CONFIG).map(([key, cfg]) => (
          <button key={key} onClick={() => openZone(key)} className="absolute transition-all duration-300 group" style={{ top: cfg.top, left: cfg.left, width: cfg.width, height: cfg.height }}>
            <div className={`absolute -top-0 -right-0 flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all ${activeZone === key ? 'opacity-100 bg-indigo-500/30 text-indigo-200 scale-105' : 'opacity-0 group-hover:opacity-80 bg-white/10 text-white/60'}`}>
              {cfg.label}
              {equipped[key] && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
            </div>
          </button>
        ))}
      </div>

      {/* Active Outfit Strip */}
      <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0">
        <div className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(c => {
            const eqId = equipped[c.key];
            const item = eqId ? findItem(eqId) : null;
            return (
              <button key={c.key} onClick={() => openZone(c.key)} className="flex-shrink-0 relative rounded-xl overflow-hidden transition-all hover:scale-105" style={{ width: 44, height: 44, border: item ? '2px solid #6366f1' : '1.5px solid rgba(255,255,255,0.1)', background: item ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)' }}>
                {item ? <img src={item.img} alt="" className="w-full h-full object-cover" style={{ opacity: 0.85 }} /> : <span className="text-xs">{c.icon}</span>}
              </button>
            );
          })}
        </div>
        <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all hover:scale-[1.02] glass-panel-light text-indigo-200">
          <ChevronUp className="w-3.5 h-3.5" /> Browse
        </button>
        <button onClick={saveOutfit} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white transition-all hover:scale-[1.02]"
          style={{ background: totalEquipped > 0 ? 'linear-gradient(135deg,#6366f1,#818cf8)' : 'rgba(255,255,255,0.06)', cursor: totalEquipped > 0 ? 'pointer' : 'default', opacity: totalEquipped > 0 ? 1 : 0.4 }}>
          <Bookmark className="w-3.5 h-3.5" /> Save
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="fixed top-5 left-1/2 -translate-x-1/2 z-[90] px-5 py-2.5 rounded-2xl text-sm font-bold text-white flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', boxShadow: '0 8px 30px rgba(99,102,241,0.4)' }}>
            <Sparkles className="w-4 h-4" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <div className="fixed inset-0 z-40 transition-opacity duration-300" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', opacity: drawerOpen ? 1 : 0, pointerEvents: drawerOpen ? 'auto' : 'none' }} onClick={() => { setDrawerOpen(false); setActiveZone(null); }} />

      {/* Bottom Drawer */}
      <div ref={drawerRef} className="fixed left-0 right-0 z-50 flex flex-col rounded-t-3xl overflow-hidden" style={{ bottom: 0, maxHeight: '70vh', transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.4s cubic-bezier(0.32,0.72,0,1)', background: 'linear-gradient(180deg, #1a1f4e 0%, #0f1338 100%)', boxShadow: drawerOpen ? '0 -10px 50px rgba(0,0,0,0.5)' : 'none', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex justify-center pt-3 pb-1 cursor-grab" onClick={() => { setDrawerOpen(false); setActiveZone(null); }}>
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-5 pb-2 pt-1">
          <div>
            <h2 className="text-white font-extrabold text-lg">Select {CATEGORIES.find(c => c.key === drawerCat)?.label || 'Item'}</h2>
            <p className="text-indigo-300/50 text-[10px] font-medium mt-0.5">Tap to equip • Tap again to remove</p>
          </div>
          <button onClick={() => { setDrawerOpen(false); setActiveZone(null); }} className="w-8 h-8 rounded-full flex items-center justify-center glass-panel-light">
            <X className="w-4 h-4 text-indigo-300" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-8">
          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-3">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => { setDrawerCat(c.key); setActiveZone(c.key); }}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5"
                style={drawerCat === c.key ? { background: 'rgba(99,102,241,0.25)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)' } : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid transparent' }}>
                <span>{c.icon}</span> {c.label}
                {equipped[c.key] && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
              </button>
            ))}
          </div>
          {/* Clothing Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {(CLOTHING[drawerCat] || []).map(item => {
              const isEq = equipped[drawerCat] === item.id;
              return (
                <motion.button key={item.id} onClick={() => equipItem(drawerCat, item.id)} whileTap={{ scale: 0.93 }}
                  className="relative rounded-2xl overflow-hidden transition-all" style={{ aspectRatio: '1', border: isEq ? '2px solid #818cf8' : '1.5px solid rgba(255,255,255,0.06)', boxShadow: isEq ? '0 0 20px rgba(99,102,241,0.4)' : 'none', background: 'rgba(255,255,255,0.03)' }}>
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" loading="lazy" style={{ opacity: isEq ? 1 : 0.75, transition: 'opacity 0.3s' }} />
                  {isEq && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#6366f1' }}>
                      <Sparkles className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                    <p className="text-[9px] font-bold text-white/80 truncate">{item.name}</p>
                  </div>
                  {item.color && <div className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full border border-white/20" style={{ background: item.color }} />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wardrobe;
