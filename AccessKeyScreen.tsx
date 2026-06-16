import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Key, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface AccessKeyScreenProps {
  onVerifySuccess: () => void;
  onBack: () => void;
}

// A predefined list of working access keys that the user can type!
const VALID_KEYS = [
  'DRAGO40',
  'TURBO40',
  'DRAGO-TURBO',
  'VIP-KEY',
  'ADMIN',
  'FREE-TRIAL',
  'RAMESH'
];

export default function AccessKeyScreen({ onVerifySuccess, onBack }: AccessKeyScreenProps) {
  const [accessKey, setAccessKey] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('drago_active_key_info');
      if (saved) {
        const info = JSON.parse(saved);
        if (Date.now() < info.expiresAt) {
          return info.keyName || '';
        }
      }
    } catch (e) {}
    return '';
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    if (localStorage.getItem('drago_key_expired_alert') === 'true') {
      localStorage.removeItem('drago_key_expired_alert');
      return 'ATTENTION PORTAL EXPIRY:\n\nYour previous access key has expired.\nPlease buy or enter a new activation key.';
    }
    return null;
  });
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Play synthetic feedback beeps
  const playSynthesizerSound = (type: 'click' | 'error' | 'success') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audio = new AudioCtx();
      
      if (type === 'click') {
        // High-tech snappy mechanical keyboard switch beep
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audio.currentTime);
        gain.gain.setValueAtTime(0.5, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.08);
        osc.start();
        osc.stop(audio.currentTime + 0.08);
      } else if (type === 'error') {
        // Futuristic system alert warning buzz
        const osc1 = audio.createOscillator();
        const osc2 = audio.createOscillator();
        const gain = audio.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audio.destination);
        
        osc1.type = 'sawtooth';
        osc2.type = 'sine';
        
        osc1.frequency.setValueAtTime(120, audio.currentTime);
        osc2.frequency.setValueAtTime(124, audio.currentTime);
        
        gain.gain.setValueAtTime(0.7, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.4);
        
        osc1.start();
        osc2.start();
        osc1.stop(audio.currentTime + 0.4);
        osc2.stop(audio.currentTime + 0.4);
      } else if (type === 'success') {
        // Radiant uplift cyber validation chord
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = audio.createOscillator();
          const gain = audio.createGain();
          osc.connect(gain);
          gain.connect(audio.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audio.currentTime + idx * 0.06);
          gain.gain.setValueAtTime(0.4, audio.currentTime + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.005, audio.currentTime + idx * 0.06 + 0.3);
          osc.start(audio.currentTime + idx * 0.06);
          osc.stop(audio.currentTime + idx * 0.06 + 0.3);
        });
      }
    } catch (e) {
      console.warn('Audio Context synthesiser was blocked or is unsupported.', e);
    }
  };

  const handleKeyPress = () => {
    playSynthesizerSound('click');
  };

  const handleBuyKeyRedirect = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Play synthesizer click first
    playSynthesizerSound('click');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSynthesizerSound('click');

    const trimmed = accessKey.trim().toUpperCase();

    if (!trimmed) {
      setErrorMsg('Opps! Please enter your key first.');
      playSynthesizerSound('error');
      return;
    }

    if (VALID_KEYS.includes(trimmed)) {
      setIsSuccess(true);
      setErrorMsg(null);
      playSynthesizerSound('success');
      
      // Key Durations in days
      const KEY_DURATIONS: Record<string, number> = {
        'FREE-TRIAL': 1,
        'RAMESH': 3,
        'DRAGO40': 7,
        'TURBO40': 15,
        'DRAGO-TURBO': 30,
        'VIP-KEY': 365,
        'ADMIN': 9999 // Lifetime
      };
      
      const days = KEY_DURATIONS[trimmed] || 1;
      const keyInfo = {
        keyName: trimmed,
        days: days,
        activatedAt: Date.now(),
        expiresAt: Date.now() + days * 24 * 60 * 60 * 1000
      };
      
      localStorage.setItem('drago_active_key_info', JSON.stringify(keyInfo));
      localStorage.removeItem('drago_key_expired_alert'); // clear expired alert
      
      // Navigate slightly after the success sound chord finishes playing
      setTimeout(() => {
        onVerifySuccess();
      }, 800);
    } else {
      setIsSuccess(false);
      setErrorMsg('Opps!\n\nThe key you entered is invalid or already used');
      playSynthesizerSound('error');
    }
  };

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 z-10 font-iceland tracking-widest max-w-md w-full mx-auto select-none">
      
      {/* Outer Glow container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full relative rounded-2xl bg-black/75 backdrop-blur-md p-6 border-2 border-cyan-500/20 shadow-[0_0_40px_rgba(0,162,255,0.15)] flex flex-col"
      >
        {/* Subtle decorative target corner marks */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-md" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-md" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-md" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-md" />

        <div className="w-full text-center mt-2 mb-6">
          {/* Main Title: Hello You want! */}
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl text-white font-black uppercase mb-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] tracking-[0.05em]"
          >
            Hello <span className="text-cyan-400 neon-glow-cyan">You</span> <span className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">want!</span>
          </motion.h1>

          {/* Subheading: please enter your Access key! */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-cyan-300 font-medium tracking-wider uppercase"
          >
            please enter your Access key!
          </motion.p>
        </div>

        {/* Access Key inputs container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/70">
              <Key className="w-5 h-5 animate-pulse" />
            </span>
            <input
              type="text"
              value={accessKey}
              onChange={(e) => {
                setAccessKey(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              onFocus={handleKeyPress}
              placeholder="ENTER SECURE KEY HERE"
              className="w-full bg-cyan-950/45 border border-cyan-400/40 rounded-xl pl-11 pr-4 py-3.5 text-xl font-mono text-center tracking-[0.15em] text-white placeholder-cyan-500/30 focus:outline-none focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300 transition duration-300 font-bold"
            />
          </div>

          {/* Error Message Box */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3.5 rounded-xl border border-red-500/35 bg-red-950/20 text-red-300 text-center text-sm md:text-base leading-relaxed tracking-wider font-semibold shadow-[0_0_15px_rgba(239,68,68,0.08)] whitespace-pre-line"
              >
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
                  <span className="font-bold tracking-widest text-[#ff4a4a]">ALERT PORTAL ERROR</span>
                </div>
                {errorMsg}
              </motion.div>
            )}

            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl border border-green-500/35 bg-green-950/20 text-green-300 text-center text-base tracking-widest font-bold shadow-[0_0_15px_rgba(34,197,94,0.1)]"
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 animate-pulse" />
                  <span>KEY VERIFIED successfully!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls button layout - Highly optimized gorgeous visual look with sci-fi geometry */}
          <div className="flex flex-col gap-4 pt-2">
            
            {/* SUBMIT Button: High-Tech Clipped Cyber Trigger */}
            <button
              type="submit"
              onClick={handleKeyPress}
              className="group relative w-full overflow-hidden p-[2px] transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] cursor-pointer"
              style={{
                clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
                filter: "drop-shadow(0px 8px 20px rgba(0, 162, 255, 0.4))"
              }}
            >
              {/* Bevel accent outline - Cyber gradient */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 transition-all duration-300 group-hover:brightness-125"
                style={{
                  clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)"
                }}
              />

              {/* Inner body container */}
              <div 
                className="relative w-full px-6 py-4 flex items-center justify-center gap-2 transition-colors duration-300 overflow-hidden"
                style={{
                  clipPath: "polygon(13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%, 0 13px)",
                  background: "linear-gradient(135deg, #00d2ff 0%, #0066eb 60%, #032b84 100%)"
                }}
              >
                {/* Highlight glossy top reflect edge */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-white/45 z-10" />

                {/* Grid backdrop overlay */}
                <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

                {/* Glowing back-glow */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />

                {/* Infinite sweep shine reflection */}
                <div className="absolute top-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-white/45 to-transparent skew-x-12 animate-cyber-shine pointer-events-none" />

                <span className="relative flex items-center justify-center gap-2 font-iceland text-2xl font-black tracking-[0.25em] text-white" style={{ textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}>
                  SUBMIT
                </span>
              </div>
            </button>

            {/* BUY KEY Button: Elegant Metallic Gold/Amber Action Trigger */}
            <a
              href="https://t.me/+uu1UAjycgzNjNjZl"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleBuyKeyRedirect}
              className="group relative w-full overflow-hidden p-[1.5px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer mt-1"
              style={{
                clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))"
              }}
            >
              {/* Outer border - Golden tint styling that pulses on hover */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-amber-500/40 via-yellow-400/30 to-amber-500/40 group-hover:from-amber-400 group-hover:to-yellow-300 transition-all duration-500"
                style={{
                  clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))"
                }}
              />

              {/* Inner glass style body with dark background */}
              <div 
                className="relative w-full px-5 py-3.5 flex items-center justify-center gap-2.5 transition-all duration-300 bg-black/85 group-hover:bg-amber-950/20"
                style={{
                  clipPath: "polygon(0 0, calc(100% - 11px) 0, 100% 11px, 100% 100%, 11px 100%, 0 calc(100% - 11px))"
                }}
              >
                {/* Gold glowing targets */}
                <div className="absolute top-[3px] left-[3px] w-[5px] h-[5px] rounded-full bg-amber-500/40 group-hover:bg-amber-400 group-hover:scale-125 duration-300" />
                <div className="absolute bottom-[3px] right-[3px] w-[5px] h-[5px] rounded-full bg-amber-500/40 group-hover:bg-amber-400 group-hover:scale-125 duration-300" />

                {/* Sweep beam reflection */}
                <div className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-amber-400/25 to-transparent skew-x-12 animate-cyber-shine opacity-60 pointer-events-none" />

                <span className="relative flex items-center justify-center gap-2.5 font-iceland text-xl font-bold tracking-[0.2em] text-amber-300 group-hover:text-amber-100 transition-colors duration-300">
                  <Send className="w-4 h-4 text-amber-400 group-hover:text-amber-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                  BUY KEY
                </span>
              </div>
            </a>

          </div>
        </form>

        {/* Back option or list of keys helpful text helper */}
        <div className="mt-8 border-t border-cyan-500/10 pt-4 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playSynthesizerSound('click');
              onBack();
            }}
            className="text-xs uppercase tracking-widest text-cyan-400/60 hover:text-cyan-300 underline duration-300 cursor-pointer"
          >
            ← Back to Welcome Panel
          </button>
        </div>

      </motion.div>
    </div>
  );
}
