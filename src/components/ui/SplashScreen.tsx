import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PocketDbLogo } from './PocketDbLogo';
import { ShieldCheck, HardDrive, Cpu, Terminal } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDurationMs = 1600,
}) => {
  const [stage, setStage] = useState<'animating' | 'exiting'>('animating');

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('exiting');
      const exitTimer = setTimeout(() => {
        onComplete();
      }, 400); // exit fade duration
      return () => clearTimeout(exitTimer);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onComplete]);

  return (
    <AnimatePresence>
      {stage !== 'exiting' && (
        <motion.div
          key="pocketdb-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950 text-white p-6 select-none overflow-hidden"
        >
          {/* Subtle Background Radial Glow / Grid Motif */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.18),transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

          {/* Top Status Bar indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center gap-2 text-[11px] font-mono text-cyan-400/80 bg-slate-900/80 px-3 py-1 rounded-full border border-cyan-500/20 backdrop-blur-md z-10"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SQLite Local-First Engine</span>
          </motion.div>

          {/* Center Brand Identity */}
          <div className="flex flex-col items-center text-center space-y-6 z-10 my-auto">
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: 0.1,
              }}
              className="relative"
            >
              {/* Outer Pulsing Aura */}
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <PocketDbLogo size={88} variant="icon-only" />
            </motion.div>

            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="flex items-center justify-center gap-2"
              >
                <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                  Pocket<span className="text-blue-400">DB</span>
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800/60">
                  v1.0
                </span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.4 }}
                className="text-xs sm:text-sm font-medium text-slate-300 tracking-wide max-w-xs mx-auto"
              >
                Your finances. Your device. Your database.
              </motion.p>
            </div>

            {/* Quick Feature Nodes */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="flex items-center justify-center gap-3 pt-2 text-[11px] font-mono text-slate-400"
            >
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Zero Tracking
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                Offline Storage
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Dev-First
              </span>
            </motion.div>
          </div>

          {/* Bottom Loading / Ready Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="flex items-center gap-2 text-[11px] text-slate-500 font-mono z-10"
          >
            <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>Mounting local database...</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
