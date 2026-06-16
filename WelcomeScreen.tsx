import { motion } from 'motion/react';
import { Send, Cpu } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  // Play dynamic high-tech mechanical click wave sound
  const playClickSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audio = new AudioCtx();
      
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      
      osc.connect(gain);
      gain.connect(audio.destination);
      
      osc.type = 'triangle';
      // Clean, dynamic 800Hz snap beep sound
      osc.frequency.setValueAtTime(800, audio.currentTime);
      gain.gain.setValueAtTime(0.5, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.08);
      
      osc.start();
      osc.stop(audio.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio Context synthesiser was blocked or is unsupported.', e);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between items-center px-4 py-8 md:py-12 z-10 font-iceland">
      {/* Upper Space Header - Spacer to offset the logo downwards as instructed */}
      <div className="w-full max-w-md text-center pt-8 opacity-40">
      </div>

      {/* Main Content Area - Positioned thoda niche (slightly below center) as requested */}
      <div className="flex-1 flex flex-col justify-center items-center max-w-md w-full my-auto z-10">
        {/* Logo Container with no background glows or lights */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mb-0 mt-1 md:mt-2"
        >
          {/* Logo Frame - Background circles and glowing lights removed, size enlarged to w-80 h-80 / md:w-[400px] md:h-[400px] */}
          <div className="relative w-80 h-80 md:w-[400px] md:h-[400px] p-2 flex items-center justify-center">
            <img
              src="https://i.ibb.co/KcgyD6L6/Logo-Transparent-D01-HBKjp.png"
              alt="Drago Predictor Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // If the user's specific Image fails to load, gracefully fallback to a high-end cyber dragon SVG icon
                const img = e.currentTarget;
                img.style.display = 'none';
                const parent = img.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'text-cyan-400 text-6xl font-bold flex flex-col items-center justify-center';
                  fallback.innerHTML = `
                    <svg viewBox="0 0 24 24" width="140" height="140" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    <span class="text-xs uppercase tracking-[0.2em] mt-2 text-cyan-200">DRAGO 4.0</span>
                  `;
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
        </motion.div>

        {/* Text Area - Lifted up closer to logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center px-4 -mt-4 md:-mt-8"
        >
          {/* Welcome Title with dynamic inline coloring */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-white tracking-widest font-iceland font-bold uppercase mb-2">
            Welcome to <span className="text-cyan-400 neon-glow-cyan">Drago 4.0</span> <span className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">Turbo</span>
          </h1>
          
          {/* Small Subtitle */}
          <p className="text-lg md:text-xl text-cyan-300 font-iceland font-medium opacity-95 tracking-wide mb-5 uppercase">
            Click below to start the predictor!
          </p>
        </motion.div>

        {/* Buttons Section - Extremely polished and beautiful premium cybernetic gaming controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full flex flex-col gap-4 px-6 md:px-8 mt-2"
        >
          {/* Button 1: Premium Cybernetic "LET'S START" button with dual bevel border and infinite glass shine */}
          <button
            onClick={() => {
              playClickSound();
              onStart();
            }}
            id="btn-lets-start"
            className="group relative w-full overflow-hidden p-[2px] transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] cursor-pointer"
            style={{
              clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
              filter: "drop-shadow(0px 8px 24px rgba(0, 172, 255, 0.45))"
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
              className="relative w-full px-6 py-4.5 flex items-center justify-center gap-3 transition-colors duration-300 overflow-hidden"
              style={{
                clipPath: "polygon(13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%, 0 13px)",
                background: "linear-gradient(135deg, #00d2ff 0%, #0066eb 60%, #032b84 100%)"
              }}
            >
              {/* Highlight glossy top reflect edge */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-white/45 z-10" />

              {/* Grid pattern backdrop inside the button */}
              <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

              {/* Glowing back-glow on hover */}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />

              {/* Infinite hologram swipe reflection */}
              <div className="absolute top-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-white/45 to-transparent skew-x-12 animate-cyber-shine pointer-events-none" />

              {/* Side brackets - cyber design details */}
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-xs font-mono tracking-normal opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:left-4 select-none">
                [+
              </span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-xs font-mono tracking-normal opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:right-4 select-none">
                +]
              </span>

              {/* Core Content */}
              <span className="relative flex items-center justify-center gap-3 font-iceland text-3xl font-black tracking-[0.2em] text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                <Cpu className="w-7 h-7 text-white animate-spin-slow filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                LET'S START
              </span>
            </div>
          </button>

          {/* Button 2: High Fidelity Sci-Fi Glass / Premium "JOIN TELEGRAM" Button */}
          <a
            href="https://t.me/+uu1UAjycgzNjNjZl"
            target="_blank"
            rel="noopener noreferrer"
            onClick={playClickSound}
            id="btn-join-telegram"
            className="group relative w-full overflow-hidden p-[1.5px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer mt-1"
            style={{
              clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))"
            }}
          >
            {/* Cyber border outline - transitions to bright cyan on hover */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-blue-500/40 via-cyan-400/30 to-blue-500/40 group-hover:from-cyan-400 group-hover:to-blue-500 transition-all duration-500"
              style={{
                clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))"
              }}
            />

            {/* Inner glass dark background */}
            <div 
              className="relative w-full px-5 py-4 flex items-center justify-center gap-3 transition-all duration-300 bg-black/85 group-hover:bg-blue-950/20"
              style={{
                clipPath: "polygon(0 0, calc(100% - 11px) 0, 100% 11px, 100% 100%, 11px 100%, 0 calc(100% - 11px))"
              }}
            >
              {/* Corner tech target indicators */}
              <div className="absolute top-[3px] left-[3px] w-[5px] h-[5px] rounded-full bg-cyan-500/40 group-hover:bg-cyan-400 group-hover:scale-125 duration-300" />
              <div className="absolute bottom-[3px] right-[3px] w-[5px] h-[5px] rounded-full bg-cyan-500/40 group-hover:bg-cyan-400 group-hover:scale-125 duration-300" />

              {/* Inside reflection swipe */}
              <div className="absolute top-0 bottom-0 w-12 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-12 animate-cyber-shine opacity-60 pointer-events-none" />

              <span className="relative flex items-center justify-center gap-3 font-iceland text-2xl font-black tracking-[0.15em] text-cyan-300 group-hover:text-cyan-100 transition-colors duration-300">
                <Send className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                JOIN TELEGRAM
              </span>
            </div>
          </a>
        </motion.div>
      </div>

      {/* Footer Branding Area - Text content removed */}
      <div className="w-full max-w-md text-center pt-8 opacity-20 text-[10px] uppercase font-mono tracking-widest text-cyan-500/60">
      </div>
    </div>
  );
}
