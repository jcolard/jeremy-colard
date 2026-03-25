/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FlaskConical, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Ghost, 
  Leaf, 
  Gem, 
  Flame,
  Info,
  RotateCcw,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types & Constants ---

interface Ingredient {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  baseProduction: number;
  icon: React.ReactNode;
  emoji: string;
}

const INGREDIENTS: Ingredient[] = [
  { 
    id: 'slime', 
    name: 'Slime Souriant', 
    description: 'Il bave un peu d\'essence pure.', 
    baseCost: 15, 
    baseProduction: 0.1, 
    icon: <Ghost className="w-5 h-5 text-green-400" />,
    emoji: '🙂'
  },
  { 
    id: 'herb', 
    name: 'Herbe Timide', 
    description: 'Pousse plus vite quand on ne la regarde pas.', 
    baseCost: 100, 
    baseProduction: 1, 
    icon: <Leaf className="w-5 h-5 text-emerald-500" />,
    emoji: '🌿'
  },
  { 
    id: 'crystal', 
    name: 'Cristal Chantant', 
    description: 'Vibre à la fréquence du profit.', 
    baseCost: 1100, 
    baseProduction: 8, 
    icon: <Gem className="w-5 h-5 text-blue-400" />,
    emoji: '💎'
  },
  { 
    id: 'dragon', 
    name: 'Souffle de Dragon', 
    description: 'Chaud, puissant, et un peu piquant.', 
    baseCost: 12000, 
    baseProduction: 47, 
    icon: <Flame className="w-5 h-5 text-orange-500" />,
    emoji: '🔥'
  },
];

const GOALS = [
  { threshold: 100, label: "Apprenti" },
  { threshold: 1000, label: "Alchimiste" },
  { threshold: 10000, label: "Maître" },
  { threshold: 100000, label: "Grand Mage" },
  { threshold: 1000000, label: "Transmutateur" },
];

// --- Helper Functions ---

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return Math.floor(num).toString();
};

// --- Main Component ---

export default function App() {
  // Game State
  const [essence, setEssence] = useState(0);
  const [totalEssence, setTotalEssence] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({
    slime: 0,
    herb: 0,
    crystal: 0,
    dragon: 0,
  });
  const [prestige, setPrestige] = useState(0);
  const [showSpark, setShowSpark] = useState(false);
  const [sparkPos, setSparkPos] = useState({ x: 0, y: 0 });
  const [clickParticles, setClickParticles] = useState<{id: number, x: number, y: number}[]>([]);
  
  // Refs for loop
  const lastTick = useRef(Date.now());

  // Calculate Production
  const getProductionPerSecond = useCallback(() => {
    const base = INGREDIENTS.reduce((acc, ing) => {
      return acc + (counts[ing.id] * ing.baseProduction);
    }, 0);
    return base * (1 + prestige * 0.1); // 10% bonus per prestige point
  }, [counts, prestige]);

  // Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTick.current) / 1000;
      lastTick.current = now;

      const pps = getProductionPerSecond();
      if (pps > 0) {
        setEssence(prev => prev + pps * delta);
        setTotalEssence(prev => prev + pps * delta);
      }

      // Random Spark Chance (0.5% per tick)
      if (!showSpark && Math.random() < 0.005) {
        setSparkPos({
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
        });
        setShowSpark(true);
        setTimeout(() => setShowSpark(false), 5000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [getProductionPerSecond, showSpark]);

  // Actions
  const handleManualClick = (e: React.MouseEvent) => {
    const clickPower = 1 + prestige;
    setEssence(prev => prev + clickPower);
    setTotalEssence(prev => prev + clickPower);
    
    // Feedback: Particle
    const id = Date.now();
    setClickParticles(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => {
      setClickParticles(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  const buyIngredient = (ing: Ingredient) => {
    const cost = Math.floor(ing.baseCost * Math.pow(1.15, counts[ing.id]));
    if (essence >= cost) {
      setEssence(prev => prev - cost);
      setCounts(prev => ({ ...prev, [ing.id]: prev[ing.id] + 1 }));
      
      // Feedback: Confetti on first purchase of a type
      if (counts[ing.id] === 0) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const handleSparkClick = () => {
    const bonus = Math.max(10, getProductionPerSecond() * 30);
    setEssence(prev => prev + bonus);
    setTotalEssence(prev => prev + bonus);
    setShowSpark(false);
    confetti({
      particleCount: 100,
      spread: 100,
      colors: ['#FFD700', '#FFA500']
    });
  };

  const resetGame = () => {
    const newPrestige = Math.floor(Math.sqrt(totalEssence / 1000));
    if (newPrestige > prestige) {
      setPrestige(newPrestige);
      setEssence(0);
      setTotalEssence(0);
      setCounts({ slime: 0, herb: 0, crystal: 0, dragon: 0 });
      confetti({
        particleCount: 200,
        spread: 160,
      });
    }
  };

  // Progress Goal (Zeigarnik Effect)
  const nextGoal = GOALS.find(g => totalEssence < g.threshold) || GOALS[GOALS.length - 1];
  const progress = Math.min(100, (totalEssence / nextGoal.threshold) * 100);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-purple-500/30 overflow-hidden flex flex-col">
      
      {/* Header - Stats */}
      <header className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
            <FlaskConical className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {formatNumber(essence)} <span className="text-purple-400 text-sm font-medium uppercase tracking-widest">Essence</span>
            </h1>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-tighter">
              Production: +{formatNumber(getProductionPerSecond())}/s
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            <Trophy className="w-3 h-3" /> Rang: {nextGoal.label}
          </div>
          <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <motion.div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          </div>
          <p className="text-[10px] text-slate-500 font-mono italic">
            {progress.toFixed(1)}% vers le prochain palier...
          </p>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* Left: The Clicker (IKEA Effect & Juiciness) */}
        <section className="lg:col-span-7 flex flex-col items-center justify-center p-8 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent">
          
          {/* Random Event: Golden Spark (R - Random) */}
          <AnimatePresence>
            {showSpark && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.2 }}
                onClick={handleSparkClick}
                style={{ left: `${sparkPos.x}%`, top: `${sparkPos.y}%` }}
                className="absolute z-40 p-4 bg-yellow-400 rounded-full shadow-[0_0_30px_rgba(250,204,21,0.6)] cursor-pointer"
              >
                <Sparkles className="w-6 h-6 text-yellow-900 animate-pulse" />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="relative group">
            {/* Aura */}
            <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full group-hover:bg-purple-500/30 transition-all duration-700" />
            
            {/* The Cauldron */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleManualClick}
              className="relative z-10 w-64 h-64 bg-slate-800 rounded-full border-4 border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent" />
              <FlaskConical className="w-32 h-32 text-purple-400 group-hover:text-purple-300 transition-colors" />
              
              {/* Liquid Effect */}
              <motion.div 
                animate={{ 
                  y: [0, -5, 0],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute bottom-0 left-0 right-0 h-1/3 bg-purple-500/20 backdrop-blur-sm"
              />
            </motion.button>

            <div className="mt-8 text-center">
              <p className="text-slate-400 text-sm italic max-w-xs mx-auto">
                "Touillez le chaudron pour extraire l'essence primordiale."
              </p>
              <div className="mt-4 flex justify-center gap-4">
                <div className="px-3 py-1 bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-700">
                  Clic: +{1 + prestige}
                </div>
                {prestige > 0 && (
                  <div className="px-3 py-1 bg-purple-500/20 rounded-full text-[10px] font-bold text-purple-400 uppercase tracking-widest border border-purple-500/30">
                    Savoir: +{prestige * 10}%
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Click Particles */}
          <AnimatePresence>
            {clickParticles.map(p => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, y: p.y - 20, x: p.x }}
                animate={{ opacity: 0, y: p.y - 120 }}
                className="fixed z-50 pointer-events-none text-purple-400 font-bold text-xl"
              >
                +{1 + prestige}
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        {/* Right: Shop (T - Transformation) */}
        <section className="lg:col-span-5 border-l border-slate-800 bg-slate-900/30 backdrop-blur-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Laboratoire
            </h2>
            <button 
              onClick={resetGame}
              disabled={totalEssence < 1000}
              className="group relative flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-red-500/20"
            >
              <RotateCcw className="w-3 h-3 group-hover:rotate-[-180deg] transition-transform duration-500" />
              Transmuter ({Math.floor(Math.sqrt(totalEssence / 1000))})
              
              {/* Tooltip for Prestige (L - Leçon) */}
              <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-slate-700 z-50">
                <p className="text-[10px] leading-relaxed">
                  Explosez votre labo pour gagner du <span className="text-purple-400 font-bold">Savoir permanent</span>. 
                  Requis: 1000 Essence totale.
                </p>
              </div>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {INGREDIENTS.map((ing) => {
              const cost = Math.floor(ing.baseCost * Math.pow(1.15, counts[ing.id]));
              const canAfford = essence >= cost;
              
              return (
                <motion.button
                  key={ing.id}
                  whileHover={canAfford ? { x: 4 } : {}}
                  whileTap={canAfford ? { scale: 0.98 } : {}}
                  onClick={() => buyIngredient(ing)}
                  className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left relative overflow-hidden group
                    ${canAfford 
                      ? 'bg-slate-800/50 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800' 
                      : 'bg-slate-900/50 border-slate-800 opacity-60 grayscale cursor-not-allowed'
                    }`}
                >
                  {/* Background Progress (Zeigarnik) */}
                  <div 
                    className="absolute inset-0 bg-purple-500/5 transition-all duration-500" 
                    style={{ width: `${Math.min(100, (essence / cost) * 100)}%` }}
                  />

                  <div className="relative z-10 p-3 bg-slate-900 rounded-xl border border-slate-700 group-hover:scale-110 transition-transform">
                    {ing.icon}
                    <span className="absolute -top-1 -right-1 text-xs">{ing.emoji}</span>
                  </div>

                  <div className="flex-1 relative z-10">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-200">{ing.name}</h3>
                      <span className="text-xs font-mono text-slate-500">x{counts[ing.id]}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 italic">
                      {ing.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className={`text-xs font-bold flex items-center gap-1 ${canAfford ? 'text-purple-400' : 'text-slate-500'}`}>
                        <Zap className="w-3 h-3" /> {formatNumber(cost)}
                      </span>
                      <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">
                        +{formatNumber(ing.baseProduction)}/s
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Footer Info (S - Sens) */}
          <div className="p-4 bg-slate-900/80 border-t border-slate-800">
            <div className="flex items-start gap-3 p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
              <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <span className="text-purple-300 font-bold">Stratégie :</span> Investissez dans les ingrédients à haut rendement pour accélérer votre ascension vers la Pierre Philosophale. Chaque achat augmente le coût de 15%.
              </p>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
