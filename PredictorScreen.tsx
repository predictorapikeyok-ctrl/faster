import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Send, 
  Cpu, 
  ShieldCheck, 
  History, 
  Search, 
  TrendingUp, 
  Volume2, 
  VolumeX,
  Zap,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { GameTab, PredictionRecord } from '../types';

interface PredictorScreenProps {
  onBack: () => void;
  onServerStateChange?: (started: boolean) => void;
}

// Initial mockup history records
const INITIAL_HISTORY: PredictionRecord[] = [
  { id: '1', period: '592', gameType: 'wingo1', result: 'BIG', color: 'red', accuracy: 98.8, timestamp: '14:31', status: 'WIN', predictedNumber: 8 },
  { id: '2', period: '591', gameType: 'wingo1', result: 'SMALL', color: 'green', accuracy: 99.1, timestamp: '14:30', status: 'WIN', predictedNumber: 1 },
  { id: '3', period: '590', gameType: 'wingo3', result: 'BIG', color: 'green', accuracy: 97.5, timestamp: '14:28', status: 'WIN', predictedNumber: 9 },
  { id: '4', period: '342', gameType: 'aviator', result: 'MULTIPLIER', multiplier: '3.42x', accuracy: 98.4, timestamp: '14:26', status: 'WIN' },
  { id: '5', period: '589', gameType: 'wingo1', result: 'SMALL', color: 'red', accuracy: 96.9, timestamp: '14:25', status: 'WIN', predictedNumber: 2 },
  { id: '6', period: '588', gameType: 'wingo1', result: 'BIG', color: 'green', accuracy: 97.2, timestamp: '14:23', status: 'WIN', predictedNumber: 7 },
  { id: '7', period: '587', gameType: 'wingo3', result: 'SMALL', color: 'red', accuracy: 95.8, timestamp: '14:21', status: 'WIN', predictedNumber: 0 },
  { id: '8', period: '586', gameType: 'wingo1', result: 'BIG', color: 'red', accuracy: 99.3, timestamp: '14:19', status: 'WIN', predictedNumber: 6 },
  { id: '9', period: '585', gameType: 'wingo1', result: 'SMALL', color: 'green', accuracy: 98.0, timestamp: '14:18', status: 'WIN', predictedNumber: 3 },
  { id: '10', period: '584', gameType: 'wingo1', result: 'BIG', color: 'green', accuracy: 96.5, timestamp: '14:16', status: 'WIN', predictedNumber: 5 },
];

// Helper to determine accurate color mapping based on explicit game rules provided by user:
// 0: red-violet, 1: green, 2: red, 3: green, 4: red
// 5: green-violet, 6: red, 7: green, 8: red, 9: green
const getNumberColorType = (num: number): 'red' | 'green' | 'red-violet' | 'green-violet' => {
  if (num === 0) return 'red-violet';
  if (num === 5) return 'green-violet';
  if (num === 2 || num === 4 || num === 6 || num === 8) return 'red';
  return 'green'; // 1, 3, 7, 9
};

export default function PredictorScreen({ onBack, onServerStateChange }: PredictorScreenProps) {
  const [activeTab, setActiveTab] = useState<GameTab>('wingo1');
  const [selectedGame, setSelectedGame] = useState<'yaarwin' | 'eightytwolottery' | 'jalwagame' | 'tiranga' | 'fiftyonegame' | 'jaiclub' | 'goagame' | 'ninetyoneclub' | 'bdgwin' | null>(null);

  // Load and manage key duration state with back-up fallback
  const [keyInfo, setKeyInfo] = useState<{
    keyName: string;
    days: number;
    activatedAt: number;
    expiresAt: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('drago_active_key_info');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('LocalStorage parse failed for key info', e);
    }
    // Return standard fallback FREE-TRIAL key so it never errors
    const fallback = {
      keyName: 'FREE-TRIAL',
      days: 1,
      activatedAt: Date.now(),
      expiresAt: Date.now() + 1 * 24 * 60 * 60 * 1000
    };
    localStorage.setItem('drago_active_key_info', JSON.stringify(fallback));
    return fallback;
  });

  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [showKeyConsole, setShowKeyConsole] = useState<boolean>(false);
  const [showExpiredModal, setShowExpiredModal] = useState<boolean>(false);

  // Active key ticker interval to calculate real-time decay and expire sessions instantly
  useEffect(() => {
    if (!keyInfo) return;

    const tick = () => {
      const diff = keyInfo.expiresAt - Date.now();
      if (diff <= 0) {
        setTimeLeftMs(0);
        setShowExpiredModal(true);
        localStorage.removeItem('drago_active_key_info');
        localStorage.setItem('drago_key_expired_alert', 'true');
      } else {
        setTimeLeftMs(diff);
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [keyInfo]);

  // Fast-forward simulator to subtract days instantly on the UI so users can verify key-decay
  const simulateDaysPassed = (numDays: number) => {
    if (!keyInfo) return;
    playBeep(450, 100);
    const newExpiresAt = keyInfo.expiresAt - numDays * 24 * 60 * 60 * 1000;
    const updated = {
      ...keyInfo,
      expiresAt: newExpiresAt
    };
    setKeyInfo(updated);
    localStorage.setItem('drago_active_key_info', JSON.stringify(updated));
  };

  // Instant expiration testing tool
  const simulateInstantExpiration = () => {
    if (!keyInfo) return;
    playBeep(320, 200);
    const updated = {
      ...keyInfo,
      expiresAt: Date.now() - 5000 // expired 5 seconds ago
    };
    setKeyInfo(updated);
    localStorage.setItem('drago_active_key_info', JSON.stringify(updated));
  };

  // Human-readable visual time parser
  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return 'EXPIRED';
    const totalSecs = Math.floor(ms / 1000);
    const totalMins = Math.floor(totalSecs / 60);
    const totalHours = Math.floor(totalMins / 60);
    const days = Math.floor(totalHours / 24);

    const hours = totalHours % 24;
    const mins = totalMins % 60;
    const secs = totalSecs % 60;

    if (days > 365) return 'LIFETIME';

    let parts = [];
    if (days > 0) parts.push(`${days}D`);
    parts.push(`${hours}H`);
    parts.push(`${mins}M`);
    parts.push(`${secs}S`);

    return parts.join(' ');
  };

  // Short day badge text formatter
  const getCompactDaysText = (ms: number) => {
    if (ms <= 0) return '0D';
    const totalSecs = Math.floor(ms / 1000);
    const totalMins = Math.floor(totalSecs / 60);
    const totalHours = Math.floor(totalMins / 60);
    const days = Math.floor(totalHours / 24);

    if (days > 365) return 'LIFETIME';
    
    if (days === 0) {
      if (totalHours > 0) return `${totalHours}H`;
      return `${totalMins}M`;
    }
    return `${days}D`;
  };

  // Human-readable remaining days formatter (e.g. "30 DAYS")
  const getFormattedDaysText = () => {
    if (!keyInfo) return '1 DAY';
    if (keyInfo.days > 365) return 'LIFETIME';
    const remSecs = Math.max(0, Math.floor(timeLeftMs / 1000));
    const remMins = Math.floor(remSecs / 60);
    const remHours = Math.floor(remMins / 60);
    const remDays = Math.floor(remHours / 24);

    if (remDays === 0) {
      if (remHours > 0) return `${remHours} HOURS`;
      if (remMins > 0) return `${remMins} MINS`;
      return 'EXPIRED';
    }
    return `${remDays} ${remDays === 1 ? 'DAY' : 'DAYS'}`;
  };

  // Style helper system supporting unified themes across Yar Win, 82 Lottery, Jalwa Game, and Tiranga
  const getGameStyles = () => {
    if (selectedGame === 'eightytwolottery') {
      return {
        text: 'text-red-400',
        textLight: 'text-red-200',
        textSoft: 'text-red-300/70',
        textMuted: 'text-red-400/55',
        textIntense: 'text-red-500',
        shadowGlow: 'shadow-[0_0_25px_rgba(239,68,68,0.08)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(239,68,68,0.25)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(239,68,68,0.45)]',
        glowClass: 'neon-glow-red',
        bgSoft: 'bg-red-950/20',
        bgSoftSubtle: 'bg-red-950/15 border-red-500/15 hover:bg-red-950/30',
        borderSoft: 'border-red-500/10',
        borderMedium: 'border-red-500/20 text-red-500 hover:bg-red-500/10',
        borderIntense: 'border-red-500/40',
        borderThick: 'border-red-500/30',
        badge: 'bg-red-900/40 text-red-300 border-red-400/10',
        accentIcon: 'text-red-450',
        accentIconBg: 'border-red-500/20 bg-red-950/20 text-red-500 hover:bg-red-500/10',
        accentBtn: 'bg-gradient-to-r from-red-500 via-rose-600 to-red-500',
        accentBtnDisabled: 'bg-red-950/20 border border-red-500/20 text-red-500/40 cursor-not-allowed',
        progressBarBorder: 'border-[#450a0a]',
        progressBarFill: 'bg-gradient-to-r from-red-600 via-red-500 to-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
        scanAlert: 'bg-black/50 border-red-500/30',
        progressIndicator: 'text-red-400',
        progressPing: 'bg-red-500',
        tabActive: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-red-500/25 text-red-300 hover:text-white hover:bg-red-500/10',
        telegramBorderGlow: 'border-red-400/30 bg-gradient-to-r from-red-950/30 via-slate-950/40 to-red-950/30 hover:border-red-400/80 hover:bg-red-950/15',
        telegramFlashLight: 'bg-red-500/5',
        telegramSendBtn: 'bg-rose-500/10 border-rose-400/30 text-rose-450 group-hover:scale-110 group-hover:bg-rose-500/20 group-hover:text-red-300',
        borderColor: '#ef4444'
      };
    } else if (selectedGame === 'jalwagame') {
      return {
        text: 'text-[#61DACC]',
        textLight: 'text-teal-200',
        textSoft: 'text-[#61DACC]/70',
        textMuted: 'text-[#61DACC]/55',
        textIntense: 'text-[#61DACC]',
        shadowGlow: 'shadow-[0_0_25px_rgba(97,218,204,0.12)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(97,218,204,0.3)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(97,218,204,0.45)]',
        glowClass: 'neon-glow-teal',
        bgSoft: 'bg-teal-950/25',
        bgSoftSubtle: 'bg-teal-950/15 border-teal-500/15 hover:bg-[#61DACC]/10',
        borderSoft: 'border-[#61DACC]/10',
        borderMedium: 'border-[#61DACC]/20 text-[#61DACC] hover:bg-[#61DACC]/10',
        borderIntense: 'border-[#61DACC]/40',
        borderThick: 'border-[#61DACC]/30',
        badge: 'bg-[#61DACC]/20 text-[#61DACC] border-[#61DACC]/10',
        accentIcon: 'text-[#61DACC]',
        accentIconBg: 'border-[#61DACC]/20 bg-teal-950/20 text-[#61DACC] hover:bg-[#61DACC]/10',
        accentBtn: 'bg-gradient-to-r from-teal-500 via-[#61DACC] to-teal-500',
        accentBtnDisabled: 'bg-[#61DACC]/10 border border-[#61DACC]/25 text-[#61DACC]/40 cursor-not-allowed',
        progressBarBorder: 'border-teal-950',
        progressBarFill: 'bg-gradient-to-r from-teal-600 via-[#61DACC] to-[#61DACC] shadow-[0_0_12px_rgba(97,218,204,0.6)]',
        scanAlert: 'bg-black/50 border-[#61DACC]/30',
        progressIndicator: 'text-[#61DACC]',
        progressPing: 'bg-[#61DACC]',
        tabActive: 'bg-gradient-to-r from-teal-500 to-[#61DACC] text-white shadow-[0_0_15px_rgba(97,218,204,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#61DACC]/25 text-[#61DACC] hover:text-white hover:bg-[#61DACC]/10',
        telegramBorderGlow: 'border-[#61DACC]/30 bg-gradient-to-r from-teal-950/30 via-slate-950/40 to-teal-950/30 hover:border-[#61DACC]/80 hover:bg-teal-950/15',
        telegramFlashLight: 'bg-[#61DACC]/5',
        telegramSendBtn: 'bg-teal-500/10 border-[#61DACC]/30 text-[#61DACC] group-hover:scale-110 group-hover:bg-teal-500/20 group-hover:text-teal-200',
        borderColor: '#61DACC'
      };
    } else if (selectedGame === 'tiranga') {
      return {
        text: 'text-[#6495ED]',
        textLight: 'text-blue-200',
        textSoft: 'text-[#6495ED]/70',
        textMuted: 'text-[#6495ED]/55',
        textIntense: 'text-[#4169E1]',
        shadowGlow: 'shadow-[0_0_25px_rgba(100,149,237,0.12)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(65,105,225,0.3)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(100,149,237,0.45)]',
        glowClass: 'neon-glow-blue',
        bgSoft: 'bg-blue-950/25',
        bgSoftSubtle: 'bg-blue-950/15 border-blue-500/15 hover:bg-[#6495ED]/10',
        borderSoft: 'border-[#6495ED]/10',
        borderMedium: 'border-[#6495ED]/20 text-[#6495ED] hover:bg-[#6495ED]/10',
        borderIntense: 'border-[#6495ED]/40',
        borderThick: 'border-[#6495ED]/30',
        badge: 'bg-[#6495ED]/20 text-[#6495ED] border-[#6495ED]/10',
        accentIcon: 'text-[#6495ED]',
        accentIconBg: 'border-[#6495ED]/20 bg-blue-950/20 text-[#6495ED] hover:bg-[#6495ED]/10',
        accentBtn: 'bg-gradient-to-r from-blue-600 via-[#6495ED] to-blue-600',
        accentBtnDisabled: 'bg-[#6495ED]/10 border border-[#6495ED]/25 text-[#6495ED]/40 cursor-not-allowed',
        progressBarBorder: 'border-blue-950',
        progressBarFill: 'bg-gradient-to-r from-blue-700 via-[#6495ED] to-[#6495ED] shadow-[0_0_12px_rgba(100,149,237,0.6)]',
        scanAlert: 'bg-black/50 border-[#6495ED]/30',
        progressIndicator: 'text-[#6495ED]',
        progressPing: 'bg-[#6495ED]',
        tabActive: 'bg-gradient-to-r from-blue-600 to-[#6495ED] text-white shadow-[0_0_15px_rgba(100,149,237,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#6495ED]/25 text-[#6495ED] hover:text-white hover:bg-[#6495ED]/10',
        telegramBorderGlow: 'border-[#6495ED]/30 bg-gradient-to-r from-blue-950/30 via-slate-950/40 to-blue-950/30 hover:border-[#6495ED]/80 hover:bg-blue-950/15',
        telegramFlashLight: 'bg-[#6495ED]/5',
        telegramSendBtn: 'bg-blue-500/10 border-[#6495ED]/30 text-[#6495ED] group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-200',
        borderColor: '#6495ED'
      };
    } else if (selectedGame === 'fiftyonegame') {
      return {
        text: 'text-amber-400',
        textLight: 'text-amber-200',
        textSoft: 'text-amber-400/80',
        textMuted: 'text-yellow-600/60',
        textIntense: 'text-amber-500',
        shadowGlow: 'shadow-[0_0_25px_rgba(245,158,11,0.12)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.45)]',
        glowClass: 'neon-glow-amber',
        bgSoft: 'bg-amber-950/25',
        bgSoftSubtle: 'bg-amber-950/15 border-amber-500/15 hover:bg-amber-500/10',
        borderSoft: 'border-[#f59e0b]/10',
        borderMedium: 'border-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b]/10',
        borderIntense: 'border-[#f59e0b]/40',
        borderThick: 'border-[#f59e0b]/30',
        badge: 'bg-amber-900/40 text-amber-300 border-[#f59e0b]/10',
        accentIcon: 'text-[#f59e0b]',
        accentIconBg: 'border-[#f59e0b]/20 bg-amber-950/20 text-[#f59e0b] hover:bg-[#f59e0b]/10',
        accentBtn: 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600',
        accentBtnDisabled: 'bg-[#f59e0b]/10 border border-[#f59e0b]/25 text-[#f59e0b]/40 cursor-not-allowed',
        progressBarBorder: 'border-amber-950',
        progressBarFill: 'bg-gradient-to-r from-amber-700 via-[#f59e0b] to-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.6)]',
        scanAlert: 'bg-black/50 border-[#f59e0b]/30',
        progressIndicator: 'text-[#f59e0b]',
        progressPing: 'bg-[#f59e0b]',
        tabActive: 'bg-gradient-to-r from-amber-600 to-[#f59e0b] text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#f59e0b]/25 text-[#f59e0b] hover:text-white hover:bg-[#f59e0b]/10',
        telegramBorderGlow: 'border-[#f59e0b]/30 bg-gradient-to-r from-amber-950/30 via-slate-950/40 to-amber-950/30 hover:border-[#f59e0b]/80 hover:bg-amber-950/15',
        telegramFlashLight: 'bg-[#f59e0b]/5',
        telegramSendBtn: 'bg-amber-500/10 border-[#f59e0b]/30 text-[#f59e0b] group-hover:scale-110 group-hover:bg-amber-500/20 group-hover:text-amber-200',
        borderColor: '#f59e0b'
      };
    } else if (selectedGame === 'jaiclub') {
      return {
        text: 'text-[#4DCBFF]',
        textLight: 'text-[#FF6BD6]',
        textSoft: 'text-[#4DCBFF]/85',
        textMuted: 'text-[#4DCBFF]/55',
        textIntense: 'text-[#FF6BD6]',
        shadowGlow: 'shadow-[0_0_25px_rgba(77,203,255,0.15)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(255,107,214,0.35)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(77,203,255,0.5)]',
        glowClass: 'neon-glow-jaiclub',
        bgSoft: 'bg-[#0A0F5C]/40',
        bgSoftSubtle: 'bg-[#0A0F5C]/20 border-[#4DCBFF]/20 hover:bg-[#4DCBFF]/10',
        borderSoft: 'border-[#4DCBFF]/15',
        borderMedium: 'border-[#4DCBFF]/30 text-[#4DCBFF] hover:bg-[#4DCBFF]/10',
        borderIntense: 'border-[#FF6BD6]/50',
        borderThick: 'border-[#4DCBFF]/40',
        badge: 'bg-[#FF6BD6]/25 text-[#FF6BD6] border-[#FF6BD6]/20',
        accentIcon: 'text-[#4DCBFF]',
        accentIconBg: 'border-[#4DCBFF]/25 bg-[#0A0F5C]/35 text-[#4DCBFF] hover:bg-[#4DCBFF]/15',
        accentBtn: 'bg-gradient-to-r from-[#0A0F5C] via-[#4DCBFF] to-[#FF6BD6]',
        accentBtnDisabled: 'bg-[#4DCBFF]/10 border border-[#4DCBFF]/25 text-[#4DCBFF]/40 cursor-not-allowed',
        progressBarBorder: 'border-[#0A0F5C]',
        progressBarFill: 'bg-gradient-to-r from-[#0A0F5C] via-[#4DCBFF] to-[#FF6BD6] shadow-[0_0_12px_rgba(77,203,255,0.6)]',
        scanAlert: 'bg-[#0A0F5C]/70 border-[#4DCBFF]/35',
        progressIndicator: 'text-[#4DCBFF]',
        progressPing: 'bg-[#4DCBFF]',
        tabActive: 'bg-gradient-to-r from-[#4DCBFF] to-[#FF6BD6] text-black font-semibold shadow-[0_0_15px_rgba(77,203,255,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#4DCBFF]/25 text-[#4DCBFF] hover:text-white hover:bg-[#4DCBFF]/10',
        telegramBorderGlow: 'border-[#4DCBFF]/30 bg-gradient-to-r from-[#0A0F5C]/40 via-slate-950/40 to-[#0A0F5C]/40 hover:border-[#FF6BD6]/80 hover:bg-[#0A0F5C]/20',
        telegramFlashLight: 'bg-[#4DCBFF]/5',
        telegramSendBtn: 'bg-[#4DCBFF]/10 border-[#4DCBFF]/30 text-[#4DCBFF] group-hover:scale-110 group-hover:bg-[#FF6BD6]/15 group-hover:text-white',
        borderColor: '#4DCBFF'
      };
    } else if (selectedGame === 'goagame') {
      return {
        text: 'text-[#4169E1]',
        textLight: 'text-blue-200',
        textSoft: 'text-[#4169E1]/80',
        textMuted: 'text-[#4169E1]/55',
        textIntense: 'text-[#3b82f6]',
        shadowGlow: 'shadow-[0_0_25px_rgba(65,105,225,0.15)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(65,105,225,0.35)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(65,105,225,0.45)]',
        glowClass: 'neon-glow-blue',
        bgSoft: 'bg-blue-950/25',
        bgSoftSubtle: 'bg-blue-950/15 border-blue-500/15 hover:bg-[#4169E1]/10',
        borderSoft: 'border-[#4169E1]/15',
        borderMedium: 'border-[#4169E1]/30 text-[#4169E1] hover:bg-[#4169E1]/10',
        borderIntense: 'border-[#4169E1]/50',
        borderThick: 'border-[#4169E1]/40',
        badge: 'bg-[#4169E1]/20 text-[#4169E1] border-[#4169E1]/10',
        accentIcon: 'text-[#4169E1]',
        accentIconBg: 'border-[#4169E1]/20 bg-blue-950/20 text-[#4169E1] hover:bg-[#4169E1]/10',
        accentBtn: 'bg-gradient-to-r from-blue-700 via-[#4169E1] to-blue-800',
        accentBtnDisabled: 'bg-[#4169E1]/10 border border-[#4169E1]/25 text-[#4169E1]/40 cursor-not-allowed',
        progressBarBorder: 'border-blue-950',
        progressBarFill: 'bg-gradient-to-r from-blue-700 via-[#4169E1] to-blue-500 shadow-[0_0_12px_rgba(65,105,225,0.6)]',
        scanAlert: 'bg-black/50 border-[#4169E1]/30',
        progressIndicator: 'text-[#4169E1]',
        progressPing: 'bg-[#4169E1]',
        tabActive: 'bg-gradient-to-r from-blue-700 to-blue-500 text-white font-bold shadow-[0_0_15px_rgba(65,105,225,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#4169E1]/25 text-[#4169E1] hover:text-white hover:bg-[#4169E1]/10',
        telegramBorderGlow: 'border-[#4169E1]/30 bg-gradient-to-r from-blue-950/30 via-slate-950/40 to-blue-950/30 hover:border-[#4169E1]/80 hover:bg-blue-950/15',
        telegramFlashLight: 'bg-[#4169E1]/5',
        telegramSendBtn: 'bg-blue-500/10 border-[#4169E1]/30 text-[#4169E1] group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-200',
        borderColor: '#4169E1'
      };
    } else if (selectedGame === 'ninetyoneclub') {
      return {
        text: 'text-[#ff1e27]',
        textLight: 'text-red-200',
        textSoft: 'text-[#ff1e27]/80',
        textMuted: 'text-[#ff1e27]/55',
        textIntense: 'text-[#ef4444]',
        shadowGlow: 'shadow-[0_0_25px_rgba(255,30,39,0.15)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(255,30,39,0.35)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(255,30,39,0.5)]',
        glowClass: 'neon-glow-red',
        bgSoft: 'bg-red-950/25',
        bgSoftSubtle: 'bg-red-950/15 border-red-500/15 hover:bg-[#ff1e27]/10',
        borderSoft: 'border-[#ff1e27]/15',
        borderMedium: 'border-[#ff1e27]/30 text-[#ff1e27] hover:bg-[#ff1e27]/10',
        borderIntense: 'border-[#ff1e27]/50',
        borderThick: 'border-[#ff1e27]/40',
        badge: 'bg-[#ff1e27]/20 text-[#ff1e27] border-[#ff1e27]/10',
        accentIcon: 'text-[#ff1e27]',
        accentIconBg: 'border-[#ff1e27]/20 bg-red-950/20 text-[#ff1e27] hover:bg-[#ff1e27]/10',
        accentBtn: 'bg-gradient-to-r from-red-700 via-[#ff1e27] to-red-800',
        accentBtnDisabled: 'bg-[#ff1e27]/10 border border-[#ff1e27]/25 text-[#ff1e27]/40 cursor-not-allowed',
        progressBarBorder: 'border-red-950',
        progressBarFill: 'bg-gradient-to-r from-red-700 via-[#ff1e27] to-red-500 shadow-[0_0_12px_rgba(255,30,39,0.6)]',
        scanAlert: 'bg-black/50 border-[#ff1e27]/30',
        progressIndicator: 'text-[#ff1e27]',
        progressPing: 'bg-[#ff1e27]',
        tabActive: 'bg-gradient-to-r from-red-700 to-red-500 text-white font-bold shadow-[0_0_15px_rgba(255,30,39,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#ff1e27]/25 text-[#ff1e27] hover:text-white hover:bg-[#ff1e27]/10',
        telegramBorderGlow: 'border-[#ff1e27]/30 bg-gradient-to-r from-red-950/30 via-slate-950/40 to-red-950/30 hover:border-[#ff1e27]/80 hover:bg-red-950/15',
        telegramFlashLight: 'bg-[#ff1e27]/5',
        telegramSendBtn: 'bg-red-500/10 border-[#ff1e27]/30 text-[#ff1e27] group-hover:scale-110 group-hover:bg-red-500/20 group-hover:text-red-200',
        borderColor: '#ff1e27'
      };
    } else if (selectedGame === 'bdgwin') {
      return {
        text: 'text-[#F0D597]',
        textLight: 'text-amber-100',
        textSoft: 'text-[#F0D597]/80',
        textMuted: 'text-[#F0D597]/55',
        textIntense: 'text-[#dfba6b]',
        shadowGlow: 'shadow-[0_0_25px_rgba(240,213,151,0.15)]',
        shadowPulse: 'shadow-[0_0_20px_rgba(240,213,151,0.35)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(240,213,151,0.5)]',
        glowClass: 'neon-glow-gold',
        bgSoft: 'bg-amber-950/25',
        bgSoftSubtle: 'bg-amber-950/15 border-amber-500/15 hover:bg-[#F0D597]/10',
        borderSoft: 'border-[#F0D597]/15',
        borderMedium: 'border-[#F0D597]/30 text-[#F0D597] hover:bg-[#F0D597]/10',
        borderIntense: 'border-[#F0D597]/50',
        borderThick: 'border-[#F0D597]/40',
        badge: 'bg-[#F0D597]/20 text-[#F0D597] border-[#F0D597]/10',
        accentIcon: 'text-[#F0D597]',
        accentIconBg: 'border-[#F0D597]/20 bg-amber-950/20 text-[#F0D597] hover:bg-[#F0D597]/10',
        accentBtn: 'bg-gradient-to-r from-amber-700 via-[#F0D597] to-amber-800',
        accentBtnDisabled: 'bg-[#F0D597]/10 border border-[#F0D597]/25 text-[#F0D597]/40 cursor-not-allowed',
        progressBarBorder: 'border-amber-950',
        progressBarFill: 'bg-gradient-to-r from-amber-700 via-[#F0D597] to-amber-500 shadow-[0_0_12px_rgba(240,213,151,0.6)]',
        scanAlert: 'bg-black/50 border-[#F0D597]/30',
        progressIndicator: 'text-[#F0D597]',
        progressPing: 'bg-[#F0D597]',
        tabActive: 'bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold shadow-[0_0_15px_rgba(240,213,151,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-[#F0D597]/25 text-[#F0D597] hover:text-white hover:bg-[#F0D597]/10',
        telegramBorderGlow: 'border-[#F0D597]/30 bg-gradient-to-r from-amber-950/30 via-slate-950/40 to-amber-950/30 hover:border-[#F0D597]/80 hover:bg-amber-950/15',
        telegramFlashLight: 'bg-[#F0D597]/5',
        telegramSendBtn: 'bg-amber-500/10 border-[#F0D597]/30 text-[#F0D597] group-hover:scale-110 group-hover:bg-amber-500/20 group-hover:text-amber-200',
        borderColor: '#F0D597'
      };
    } else {
      return {
        text: 'text-green-400',
        textLight: 'text-green-200',
        textSoft: 'text-green-300/70',
        textMuted: 'text-green-400/55',
        textIntense: 'text-green-400',
        shadowGlow: 'shadow-[0_0_20px_rgba(34,197,94,0.1)]',
        shadowPulse: 'shadow-[0_0_25px_rgba(34,197,94,0.3)]',
        iconGlow: 'filter drop-shadow-[0_4px_12px_rgba(34,197,94,0.5)]',
        glowClass: 'neon-glow-green',
        bgSoft: 'bg-emerald-950/20',
        bgSoftSubtle: 'bg-emerald-950/15 border-emerald-500/15 hover:bg-emerald-950/30',
        borderSoft: 'border-emerald-500/10',
        borderMedium: 'border-emerald-500/20 text-green-400 hover:bg-emerald-500/10',
        borderIntense: 'border-emerald-400/40',
        borderThick: 'border-emerald-500/15',
        badge: 'bg-emerald-900/40 text-green-300 border-emerald-400/10',
        accentIcon: 'text-green-400',
        accentIconBg: 'border-emerald-500/20 bg-emerald-950/20 text-green-400 hover:bg-emerald-500/10',
        accentBtn: 'bg-gradient-to-r from-emerald-600 via-[#22c55e] to-emerald-700',
        accentBtnDisabled: 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-500/40 cursor-not-allowed',
        progressBarBorder: 'border-emerald-950',
        progressBarFill: 'bg-gradient-to-r from-emerald-500 via-[#22c55e] to-green-400 shadow-[0_0_12px_rgba(34,197,94,0.5)]',
        scanAlert: 'bg-emerald-950/30 border-emerald-500/30',
        progressIndicator: 'text-green-400',
        progressPing: 'bg-green-400',
        tabActive: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-[1.01]',
        tabInactive: 'bg-black/40 border border-emerald-500/25 text-green-300 hover:text-white hover:bg-emerald-500/10',
        telegramBorderGlow: 'border-emerald-400/30 bg-gradient-to-r from-emerald-950/30 via-slate-950/40 to-emerald-950/30 hover:border-emerald-400/80 hover:bg-emerald-950/15',
        telegramFlashLight: 'bg-emerald-500/10',
        telegramSendBtn: 'bg-emerald-500/10 border-emerald-400/30 text-green-400 group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:text-green-200',
        borderColor: '#22c55e'
      };
    }
  };

  const st = getGameStyles();
  const [periodInput, setPeriodInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatus, setScanStatus] = useState<string>('Initializing server connection...');
  const [predictionResult, setPredictionResult] = useState<PredictionRecord | null>(null);
  const [historyList, setHistoryList] = useState<PredictionRecord[]>(INITIAL_HISTORY);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [liveAutoPeriod, setLiveAutoPeriod] = useState<number | string>(601);
  const [isServerStarted, setIsServerStarted] = useState<boolean>(false);
  const [isStartingServer, setIsStartingServer] = useState<boolean>(false);
  const [serverProgress, setServerProgress] = useState<number>(0);
  const [startingStatusText, setStartingStatusText] = useState<string>('Establish Handshake...');
  const [showTimerSelection, setShowTimerSelection] = useState<boolean>(false);
  const [selectedTimeMode, setSelectedTimeMode] = useState<'1min' | '30sec'>('1min');

  // Auto increment simulated period code to feel alive based on selected mode
  const [wingoSubMode, setWingoSubMode] = useState<'bigsmall' | 'number'>('number');
  const [wingoTimeLeft, setWingoTimeLeft] = useState<number>(37);
  const [lastPredictedPeriodIndex, setLastPredictedPeriodIndex] = useState<number | string | null>(null);
  const lastProcessedPeriodIndexRef = useRef<number | string | null>(null);

  // Derive past results balls directly from historyList's latest 5 entries so they are ALWAYS 100% in sync
  const pastBalls = useMemo(() => {
    return historyList.slice(0, 5).map((record) => {
      const num = record.predictedNumber !== undefined 
        ? record.predictedNumber 
        : (record.result === 'BIG' ? 9 : 1);
      
      const type = getNumberColorType(num);
      return { num, type };
    });
  }, [historyList]);

  useEffect(() => {
    if (!isServerStarted) {
      lastProcessedPeriodIndexRef.current = null;
      return;
    }

    const getPeriodIndex = (date: Date, mode: '1min' | '30sec') => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      if (mode === '30sec') {
        return (hours * 120) + (minutes * 2) + (seconds >= 30 ? 2 : 1);
      } else {
        return (hours * 60) + minutes + 1;
      }
    };

    const getSecsLeft = (date: Date, mode: '1min' | '30sec') => {
      const seconds = date.getSeconds();
      if (mode === '30sec') {
        const subSec = seconds % 30;
        return 29 - subSec;
      } else {
        return 59 - seconds;
      }
    };

    // Calculate initial state immediately
    const initDate = new Date();
    const initPeriod = getPeriodIndex(initDate, selectedTimeMode);
    const initSecs = getSecsLeft(initDate, selectedTimeMode);
    
    setWingoTimeLeft(initSecs);
    setLiveAutoPeriod(initPeriod);
    lastProcessedPeriodIndexRef.current = initPeriod;

    const intervalId = setInterval(() => {
      const now = new Date();
      const currentPeriod = getPeriodIndex(now, selectedTimeMode);
      const secsLeft = getSecsLeft(now, selectedTimeMode);

      setWingoTimeLeft(secsLeft);

      if (lastProcessedPeriodIndexRef.current !== null && lastProcessedPeriodIndexRef.current !== currentPeriod) {
        // Time expired! Play sound, clear recommendation and generate past history row
        playBeep(800, 150);
        setPredictionResult(null);

        const endedPeriodIndex = lastProcessedPeriodIndexRef.current;
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const indexStr = String(endedPeriodIndex).padStart(5, '0');
        const endedPeriodStr = `${yyyy}${mm}${dd}10001${indexStr}`;

        // Add history row if we haven't already added one for this ended period
        setHistoryList((prevList) => {
          const alreadyHasRecord = prevList.some(record => record.period === endedPeriodStr);
          if (alreadyHasRecord) {
            return prevList;
          }

          const randomNum = Math.floor(Math.random() * 10);
          const isBig = randomNum >= 5;
          const sizeVal = isBig ? 'BIG' : 'SMALL';
          
          const colorType = getNumberColorType(randomNum);
          const colorVal: 'red' | 'green' | 'blue' | 'purple' | 'amber' = 
            colorType === 'red-violet' || colorType === 'green-violet' ? 'purple' : 
            (colorType === 'red' ? 'red' : 'green');

          const newRecord: PredictionRecord = {
            id: `${Date.now()}`,
            period: endedPeriodStr,
            gameType: activeTab,
            result: sizeVal,
            accuracy: parseFloat((95 + Math.random() * 4).toFixed(1)),
            timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'WIN',
            predictedNumber: randomNum,
            color: colorVal
          };

          return [newRecord, ...prevList];
        });
      }

      setLiveAutoPeriod(currentPeriod);
      lastProcessedPeriodIndexRef.current = currentPeriod;
    }, 250);

    return () => clearInterval(intervalId);
  }, [isServerStarted, selectedTimeMode, activeTab]);

  // Dynamic Server Sync with PHP Files (daman.php for 1min, wingo30s.php for 30sec)
  useEffect(() => {
    if (!isServerStarted) return;

    const endpoint = selectedTimeMode === '1min' ? 'daman.php' : 'wingo30s.php';
    let isMounted = true;

    const fetchDynamicData = async () => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
        }
        
        const text = await response.text();
        if (!isMounted) return;

        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch (e) {
          // If response is raw plain text, it might be just the raw period number string
          const trimmed = text.trim();
          if (trimmed && /^\d+$/.test(trimmed)) {
            data = { period: trimmed };
          }
        }

        if (data) {
          // A. Parse and resolve active/current period
          let fetchedPeriod: string | null = null;
          if (data.period !== undefined) {
            fetchedPeriod = String(data.period);
          } else if (data.epoch !== undefined) {
            fetchedPeriod = String(data.epoch);
          } else if (data.issue !== undefined) {
            fetchedPeriod = String(data.issue);
          } else if (data.current_period !== undefined) {
            fetchedPeriod = String(data.current_period);
          }

          // B. Parse remaining timer seconds
          let fetchedTimeLeft: number | null = null;
          if (data.time !== undefined) {
            fetchedTimeLeft = Number(data.time);
          } else if (data.timeleft !== undefined) {
            fetchedTimeLeft = Number(data.timeleft);
          } else if (data.time_left !== undefined) {
            fetchedTimeLeft = Number(data.time_left);
          } else if (data.seconds !== undefined) {
            fetchedTimeLeft = Number(data.seconds);
          } else if (data.secs !== undefined) {
            fetchedTimeLeft = Number(data.secs);
          }

          // C. Parse past records / history table rows
          let rawHistory: any[] | null = null;
          if (Array.isArray(data)) {
            rawHistory = data;
          } else if (Array.isArray(data.history)) {
            rawHistory = data.history;
          } else if (Array.isArray(data.data)) {
            rawHistory = data.data;
          } else if (Array.isArray(data.results)) {
            rawHistory = data.results;
          } else if (Array.isArray(data.records)) {
            rawHistory = data.records;
          } else if (Array.isArray(data.last_results)) {
            rawHistory = data.last_results;
          }

          let parsedHistoryList: PredictionRecord[] = [];
          if (rawHistory && rawHistory.length > 0) {
            parsedHistoryList = rawHistory.map((item: any, index: number) => {
              const recPeriod = String(
                item.period || 
                item.issue || 
                item.epoch || 
                (fetchedPeriod ? String(BigInt(fetchedPeriod) - BigInt(index + 1)) : `${Date.now() - index}`)
              );

              let numVal = 0;
              if (item.predictedNumber !== undefined) {
                numVal = Number(item.predictedNumber);
              } else if (item.number !== undefined) {
                numVal = Number(item.number);
              } else if (item.num !== undefined) {
                numVal = Number(item.num);
              } else if (item.result_number !== undefined) {
                numVal = Number(item.result_number);
              } else {
                numVal = parseInt(recPeriod.slice(-1)) || 0;
              }

              let sizeVal: 'BIG' | 'SMALL' | 'RED' | 'GREEN' | 'MULTIPLIER' = 'BIG';
              if (item.result !== undefined) {
                const r = String(item.result).toUpperCase();
                if (r === 'BIG' || r === 'SMALL' || r === 'RED' || r === 'GREEN' || r === 'MULTIPLIER') {
                  sizeVal = r as any;
                }
              } else if (item.size !== undefined) {
                const s = String(item.size).toUpperCase();
                if (s === 'BIG' || s === 'SMALL') {
                  sizeVal = s as any;
                }
              } else {
                sizeVal = numVal >= 5 ? 'BIG' : 'SMALL';
              }

              let colorVal: 'red' | 'green' | 'blue' | 'purple' | 'amber' = 'green';
              if (item.color !== undefined) {
                const c = String(item.color).toLowerCase();
                if (c === 'red' || c === 'green' || c === 'blue' || c === 'purple' || c === 'amber') {
                  colorVal = c as any;
                }
              } else {
                const colorType = getNumberColorType(numVal);
                colorVal = colorType === 'red-violet' || colorType === 'green-violet' ? 'purple' : 
                           (colorType === 'red' ? 'red' : 'green');
              }

              const acc = Number(item.accuracy || (95 + (parseInt(recPeriod.slice(-2)) || 0) % 5));

              return {
                id: item.id || `fetched-${recPeriod}`,
                period: recPeriod,
                gameType: activeTab,
                result: sizeVal,
                color: colorVal,
                accuracy: acc,
                timestamp: item.timestamp || new Date(Date.now() - index * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: item.status || 'WIN',
                predictedNumber: numVal
              } as PredictionRecord;
            });
          }

          // D. Apply updates conditionally if component is mounted
          if (fetchedPeriod) {
            setLiveAutoPeriod(fetchedPeriod);
          } else if (parsedHistoryList.length > 0) {
            // Predict current active period as next item after latest completed period
            const latestHistoryPeriod = parsedHistoryList[0].period;
            if (/^\d+$/.test(latestHistoryPeriod)) {
              try {
                const nextPeriodStr = String(BigInt(latestHistoryPeriod) + 1n);
                setLiveAutoPeriod(nextPeriodStr);
              } catch (err) {
                const parsed = parseInt(latestHistoryPeriod);
                if (!isNaN(parsed)) {
                  setLiveAutoPeriod(String(parsed + 1));
                }
              }
            }
          }

          if (fetchedTimeLeft !== null && !isNaN(fetchedTimeLeft)) {
            setWingoTimeLeft(fetchedTimeLeft);
          }

          if (parsedHistoryList.length > 0) {
            setHistoryList(parsedHistoryList);
          }
        }
      } catch (err) {
        // Quietly fail to let simulation fallback function seamlessly in sandbox
      }
    };

    // Run fetch immediately on mount/update
    fetchDynamicData();

    // Set polling interval to refresh every 2 seconds for a seamless realtime sync experience
    const pollIntervalId = setInterval(fetchDynamicData, 2000);

    return () => {
      isMounted = false;
      clearInterval(pollIntervalId);
    };
  }, [isServerStarted, selectedTimeMode, activeTab]);

  const getGameLogoAndTitle = () => {
    switch (selectedGame) {
      case 'eightytwolottery':
        return {
          logo: 'https://i.ibb.co/9kyC9Kj7/IMG-20260611-144339.jpg',
          title: '82 LOTTERY',
          color: 'from-red-950/40 via-[#0e0f13] to-red-950/10',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/50',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
          accentColor: '#ef4444',
          accentColorBg: 'bg-red-500/10 text-red-00 border-red-500/20'
        };
      case 'jalwagame':
        return {
          logo: 'https://i.ibb.co/C3z8tfrt/images-3.jpg',
          title: 'JALWA GAME',
          color: 'from-teal-950/45 via-[#0e0f13] to-teal-900/10',
          textColor: 'text-[#61DACC]',
          borderColor: 'border-[#61DACC]/50',
          glow: 'shadow-[0_0_20px_rgba(97,218,204,0.35)]',
          accentColor: '#61DACC',
          accentColorBg: 'bg-[#61DACC]/10 text-[#61DACC] border-[#61DACC]/20'
        };
      case 'tiranga':
        return {
          logo: 'https://i.ibb.co/5X77Znb6/ff808081922891f201922cd7564505f6-large.png',
          title: 'TIRANGA',
          color: 'from-blue-950/45 via-[#0e0f13] to-blue-900/10',
          textColor: 'text-[#6495ED]',
          borderColor: 'border-[#6495ED]/50',
          glow: 'shadow-[0_0_20px_rgba(100,149,237,0.35)]',
          accentColor: '#6495ED',
          accentColorBg: 'bg-[#6495ED]/10 text-[#6495ED] border-[#6495ED]/20'
        };
      case 'fiftyonegame':
        return {
          logo: 'https://i.ibb.co/XfRq7zhD/favicon.jpg',
          title: '51 GAME',
          color: 'from-amber-950/45 via-[#0e0f13] to-amber-900/10',
          textColor: 'text-amber-400',
          borderColor: 'border-[#f59e0b]/50',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
          accentColor: '#f59e0b',
          accentColorBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
      case 'jaiclub':
        return {
          logo: 'https://i.ibb.co/7dw9k2Sk/images-4.jpg',
          title: 'JAI CLUB',
          color: 'from-[#0A0F5C]/40 via-[#0e0f13] to-[#FF6BD6]/10',
          textColor: 'text-[#4DCBFF]',
          borderColor: 'border-[#4DCBFF]/50',
          glow: 'shadow-[0_0_20px_rgba(77,203,255,0.4)]',
          accentColor: '#4DCBFF',
          accentColorBg: 'bg-[#4DCBFF]/10 text-[#4DCBFF] border-[#4DCBFF]/20'
        };
      case 'goagame':
        return {
          logo: 'https://i.ibb.co/hJgZ2CBq/1751432319049.jpg',
          title: 'GOA GAME',
          color: 'from-blue-950/45 via-[#0e0f13] to-blue-900/10',
          textColor: 'text-[#4169E1]',
          borderColor: 'border-[#4169E1]/50',
          glow: 'shadow-[0_0_20px_rgba(65,105,225,0.35)]',
          accentColor: '#4169E1',
          accentColorBg: 'bg-blue-500/10 text-[#4169E1] border-blue-500/20'
        };
      case 'ninetyoneclub':
        return {
          logo: 'https://i.ibb.co/h1nfwLyz/91-club-app-logo.jpg',
          title: '91 CLUB',
          color: 'from-red-950/45 via-[#0e0f13] to-red-900/10',
          textColor: 'text-[#ff1e27]',
          borderColor: 'border-[#ff1e27]/50',
          glow: 'shadow-[0_0_20px_rgba(255,30,39,0.35)]',
          accentColor: '#ff1e27',
          accentColorBg: 'bg-red-500/10 text-[#ff1e27] border-red-500/20'
        };
      case 'bdgwin':
        return {
          logo: 'https://i.ibb.co/ksWPDHVB/IMG-20260611-194537.png',
          title: 'BDG WIN',
          color: 'from-amber-950/45 via-[#0e0f13] to-[#F0D597]/10',
          textColor: 'text-[#F0D597]',
          borderColor: 'border-[#F0D597]/50',
          glow: 'shadow-[0_0_20px_rgba(240,213,151,0.35)]',
          accentColor: '#F0D597',
          accentColorBg: 'bg-amber-500/10 text-[#F0D597] border-[#F0D597]/20'
        };
      case 'yaarwin':
      default:
        return {
          logo: 'https://i.ibb.co/5WvxRqXs/site-Icon-2-1.png',
          title: 'YAAR WIN',
          color: 'from-emerald-950/45 via-[#0e0f13] to-emerald-900/10',
          textColor: 'text-[#22c55e]',
          borderColor: 'border-[#22c55e]/50',
          glow: 'shadow-[0_0_20px_rgba(34,197,94,0.35)]',
          accentColor: '#22c55e',
          accentColorBg: 'bg-emerald-500/10 text-[#22c55e] border-emerald-500/20'
        };
    }
  };

  // Sync inputs with live system period
  const handleSyncPeriod = () => {
    setPeriodInput(liveAutoPeriod.toString());
    playBeep(440, 100);
  };

  // Safe synthesizer beep for retro tactile premium feedback
  const playBeep = (frequency = 600, duration = 80) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0.55, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration/1000);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + duration/1000);
    } catch (e) {
      console.warn('Audio feedback failed or was blocked by browser policies.', e);
    }
  };

  const handlePredict = () => {
    if (!periodInput.trim()) {
      alert('Please enter a period number first!');
      return;
    }

    playBeep(880, 120);
    setIsScanning(true);
    setScanProgress(0);
    setPredictionResult(null);

    const statuses = [
      'Fetching database pathways...',
      'Ingesting record results matrix...',
      'Compiling history patterns...',
      'Establishing spectrum target scan...',
      'Decrypting index locks & weights...',
      'Calibrating win signal...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const nextProgress = prev + 5;
        
        // Update statuses incrementally
        const statusIdx = Math.floor((nextProgress / 100) * statuses.length);
        if (statuses[statusIdx] && statuses[statusIdx] !== scanStatus) {
          setScanStatus(statuses[statusIdx]);
          playBeep(400 + nextProgress * 4, 40);
        }

        if (nextProgress >= 100) {
          clearInterval(interval);
          finalizePrediction();
          return 100;
        }
        return nextProgress;
      });
    }, 200);
  };

  const handleWingoPredictionClick = () => {
    if (lastPredictedPeriodIndex === liveAutoPeriod) return;
    playBeep(880, 120);
    setIsScanning(true);
    setScanProgress(0);
    setPredictionResult(null);

    const statuses = [
      'Fetching database pathways...',
      'Ingesting record results matrix...',
      'Compiling history patterns...',
      'Establishing spectrum target scan...',
      'Decrypting index locks & weights...',
      'Calibrating win signal...'
    ];

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const nextProgress = prev + 5;
        
        const statusIdx = Math.floor((nextProgress / 100) * statuses.length);
        if (statuses[statusIdx] && statuses[statusIdx] !== scanStatus) {
          setScanStatus(statuses[statusIdx]);
          playBeep(400 + nextProgress * 4, 40);
        }

        if (nextProgress >= 100) {
          clearInterval(interval);
          finalizePrediction();
          return 100;
        }
        return nextProgress;
      });
    }, 200);
  };

  const getFormattedPeriod = () => {
    const periodStr = String(liveAutoPeriod);
    if (periodStr.length >= 10) {
      return periodStr;
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const indexStr = String(liveAutoPeriod).padStart(5, '0');
    return `${yyyy}${mm}${dd}10001${indexStr}`;
  };

  const finalizePrediction = () => {
    // Determine randomized but elegant high-accuracy predictions
    const accuracy = parseFloat((95 + Math.random() * 4).toFixed(1)); // 95% - 99% accuracy
    const isWingo = activeTab === 'wingo1' || activeTab === 'wingo3';
    
    let result: 'BIG' | 'SMALL' | 'RED' | 'GREEN' | 'MULTIPLIER' = 'BIG';
    let color: 'red' | 'green' | 'purple' = Math.random() > 0.5 ? 'red' : 'green';
    let multiplier: string | undefined;
    let predictedNumVal: number | undefined;

    if (isWingo) {
      if (wingoSubMode === 'number') {
        predictedNumVal = Math.floor(Math.random() * 10);
        const colType = getNumberColorType(predictedNumVal);
        color = colType === 'red-violet' || colType === 'green-violet' ? 'purple' : 
                (colType === 'red' ? 'red' : 'green');
        result = predictedNumVal >= 5 ? 'BIG' : 'SMALL';
      } else {
        result = Math.random() > 0.5 ? 'BIG' : 'SMALL';
        if (result === 'BIG') {
          predictedNumVal = [5, 6, 7, 8, 9][Math.floor(Math.random() * 5)];
        } else {
          predictedNumVal = [0, 1, 2, 3, 4][Math.floor(Math.random() * 5)];
        }
        const colType = getNumberColorType(predictedNumVal);
        color = colType === 'red-violet' || colType === 'green-violet' ? 'purple' : 
                (colType === 'red' ? 'red' : 'green');
      }
    } else {
      result = 'MULTIPLIER';
      // Typical high performance multipliers
      const ranges = [2.34, 1.85, 4.12, 1.56, 3.88, 5.25, 2.05];
      multiplier = ranges[Math.floor(Math.random() * ranges.length)].toFixed(2) + 'x';
    }

    const newRecord: PredictionRecord = {
      id: `${Date.now()}`,
      period: isWingo ? getFormattedPeriod() : (periodInput || '601'),
      gameType: activeTab,
      result,
      multiplier,
      color: isWingo ? color : undefined,
      accuracy,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'WIN',
      predictedNumber: predictedNumVal
    };

    setPredictionResult(newRecord);
    setHistoryList((prev) => [newRecord, ...prev]);
    setLastPredictedPeriodIndex(liveAutoPeriod);
    setIsScanning(false);
    playBeep(1200, 250);
  };

  const handleStartServer = () => {
    if (isStartingServer) return;
    playBeep(800, 100);
    setShowTimerSelection(true);
  };

  const executeRealServerBoot = (chosenMode: '1min' | '30sec') => {
    setSelectedTimeMode(chosenMode);
    setShowTimerSelection(false);
    setIsServerStarted(true);
    setIsStartingServer(false);
    onServerStateChange?.(true);

    // Radiant success sound sequence
    try {
       const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
       if (AudioCtx) {
         const audio = new AudioCtx();
         const notes = [523.25, 659.25, 783.99, 1046.50];
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
    } catch(e) {}
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-4 md:py-6 z-10 font-iceland max-w-md mx-auto w-full select-none justify-start pb-8">
      
      {/* Immersive Cyber Key Expired Blocking Modal with complete redirections support */}
      <AnimatePresence>
        {showExpiredModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 z-50 font-iceland tracking-widest select-none"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-full max-w-sm rounded-2xl border-2 border-red-500/35 bg-[#060404] p-6 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] relative overflow-hidden"
            >
              {/* Corner tech markers */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500 rounded-tl-md" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500 rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500 rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500 rounded-br-md" />

              <div className="w-16 h-16 rounded-full border border-red-500/30 flex items-center justify-center mx-auto mb-4 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                <span className="text-3xl animate-bounce">⚠️</span>
              </div>

              <h2 className="text-3xl font-black text-[#ff4a4a] tracking-widest uppercase mb-1 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)] font-iceland">
                LEASE EXPIRED
              </h2>
              
              <div className="h-[2px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent my-3.5" />

              <p className="text-base text-red-200/90 leading-relaxed font-semibold tracking-wide mb-6">
                Your secure portal key validity has expired. Please buy or enter a new activation key to continue.
              </p>

              <button
                type="button"
                onClick={() => {
                  playBeep(350, 90);
                  setShowExpiredModal(false);
                  onBack(); // Instantly back to the Verification screen
                }}
                className="w-full py-4 bg-gradient-to-r from-red-650 via-red-500 to-rose-700 hover:brightness-110 active:scale-[0.98] transition-all rounded-xl text-lg font-black tracking-[0.2em] text-white shadow-[0_4px_15px_rgba(220,38,38,0.45)] cursor-pointer"
              >
                ENTER NEW KEY
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cyber Timer Cycle Selection Modal with elegant background blur per user request */}
      <AnimatePresence>
        {showTimerSelection && (() => {
          const gameInfo = getGameLogoAndTitle();
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-[8px] flex items-center justify-center p-4 z-50 font-iceland tracking-widest select-none"
            >
              <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                className="w-[315px] sm:w-[335px] text-center relative overflow-visible p-6 pt-7 pb-5"
                style={{
                  filter: `drop-shadow(0 0 25px ${gameInfo.accentColor}35)`
                }}
              >
                {/* Perfect absolute vector background overlay with clean 2px borders */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  <svg 
                    className="w-full h-full" 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none"
                  >
                    <path 
                      d="M 8,0 H 100 V 100 H 0 V 8 Z" 
                      fill="rgba(9, 11, 20, 0.98)" 
                      stroke={gameInfo.accentColor} 
                      strokeWidth="2" 
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>

                {/* Inner Contents */}
                <div className="relative z-10 w-full flex flex-col items-center">
                  {/* Game Logo inside the box per user request */}
                  <div className="flex justify-center mb-3">
                    <div 
                      className="w-[84px] h-[84px] rounded-full border-2 bg-slate-950 p-1 flex items-center justify-center relative overflow-hidden shadow-xl animate-pulse"
                      style={{ 
                        borderColor: gameInfo.accentColor,
                        boxShadow: `0 4px 15px ${gameInfo.accentColor}30`
                      }}
                    >
                      <img 
                        src={gameInfo.logo} 
                        alt={gameInfo.title} 
                        className="w-full h-full object-cover rounded-full" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                  </div>

                  {/* Title and game identification */}
                  <div className="flex flex-col items-center mb-1">
                    <h3 
                      className="text-xl sm:text-2xl font-bold tracking-widest leading-none uppercase"
                      style={{ color: gameInfo.accentColor }}
                    >
                      {gameInfo.title}
                    </h3>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-widest uppercase opacity-75 mt-1.5">
                      SELECT TIMER ENGINE
                    </span>
                  </div>

                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-750/40 to-transparent my-2" />

                  <div className="flex flex-col gap-3.5 mt-4 relative z-10 w-full">
                    {/* 1 MINUTE BUTTON */}
                    <motion.button
                      whileHover="hover"
                      whileTap="tap"
                      variants={{
                        initial: { scale: 1 },
                        hover: { scale: 1.02, boxShadow: `0 0 20px ${gameInfo.accentColor}30` },
                        tap: { scale: 0.98 }
                      }}
                      type="button"
                      onClick={() => {
                        playBeep(920, 100);
                        executeRealServerBoot('1min');
                      }}
                      className="relative w-full py-3.5 pl-5 pr-4 border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 text-left flex items-center justify-between"
                      style={{
                        borderColor: `${gameInfo.accentColor}35`,
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(9, 11, 20, 0.95))',
                      }}
                    >
                      {/* Cyber Left Accent Bar */}
                      <span 
                        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300"
                        style={{ backgroundColor: `${gameInfo.accentColor}70` }}
                      />
                      {/* Hover sliding glow panel */}
                      <motion.div 
                        variants={{
                          initial: { x: '-100%' },
                          hover: { x: '100%', transition: { repeat: Infinity, duration: 2, ease: 'linear' } }
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                      />

                      <div className="flex flex-col gap-0.5 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="font-iceland font-bold text-[20px] sm:text-[22px] text-white tracking-widest leading-none">
                            1 MINUTE
                          </span>
                          <span 
                            className="text-[8px] font-mono px-1 py-[1.5px] rounded border bg-slate-900/90 text-slate-400 opacity-60 leading-none" 
                            style={{ borderColor: `${gameInfo.accentColor}30` }}
                          >
                            SYS:01
                          </span>
                        </div>
                        <span className="font-mono text-[9px] sm:text-[10px] text-slate-400 tracking-widest uppercase opacity-75">
                          Standard wingo cycles
                        </span>
                      </div>
                      <div className="z-10 relative flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: `${gameInfo.accentColor}12` }}>
                        <Zap className="w-5 h-5" style={{ color: gameInfo.accentColor, filter: `drop-shadow(0 0 5px ${gameInfo.accentColor})` }} />
                      </div>
                    </motion.button>

                    {/* 30 SECOND BUTTON */}
                    <motion.button
                      whileHover="hover"
                      whileTap="tap"
                      variants={{
                        initial: { scale: 1 },
                        hover: { scale: 1.02, boxShadow: `0 0 20px ${gameInfo.accentColor}30` },
                        tap: { scale: 0.98 }
                      }}
                      type="button"
                      onClick={() => {
                        playBeep(1120, 100);
                        executeRealServerBoot('30sec');
                      }}
                      className="relative w-full py-3.5 pl-5 pr-4 border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 text-left flex items-center justify-between"
                      style={{
                        borderColor: `${gameInfo.accentColor}35`,
                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(9, 11, 20, 0.95))',
                      }}
                    >
                      {/* Cyber Left Accent Bar */}
                      <span 
                        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300"
                        style={{ backgroundColor: `${gameInfo.accentColor}70` }}
                      />
                      {/* Hover sliding glow panel */}
                      <motion.div 
                        variants={{
                          initial: { x: '-100%' },
                          hover: { x: '100%', transition: { repeat: Infinity, duration: 2, ease: 'linear' } }
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                      />

                      <div className="flex flex-col gap-0.5 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="font-iceland font-bold text-[20px] sm:text-[22px] text-white tracking-widest leading-none">
                            30 SECOND
                          </span>
                          <span 
                            className="text-[8px] font-mono px-1 py-[1.5px] rounded border bg-slate-900/90 text-slate-400 opacity-60 leading-none" 
                            style={{ borderColor: `${gameInfo.accentColor}30` }}
                          >
                            SYS:30
                          </span>
                        </div>
                        <span className="font-mono text-[9px] sm:text-[10px] text-slate-400 tracking-widest uppercase opacity-75">
                          Instant forecast speed
                        </span>
                      </div>
                      <div className="z-10 relative flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: `${gameInfo.accentColor}12` }}>
                        <Cpu className="w-5 h-5 animate-pulse" style={{ color: gameInfo.accentColor, filter: `drop-shadow(0 0 5px ${gameInfo.accentColor})` }} />
                      </div>
                    </motion.button>
                  </div>

                  {/* Cancel Options with styled details */}
                  <button
                    type="button"
                    onClick={() => {
                      playBeep(320, 100);
                      setShowTimerSelection(false);
                    }}
                    className="mt-4 text-slate-500 hover:text-red-400 text-[10px] sm:text-[11px] font-mono tracking-widest uppercase duration-200 transition-colors cursor-pointer block mx-auto"
                  >
                    [ CANCEL ]
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
      
      {/* Top Header Controls Bar - Clean, Minimal back button */}
      {isServerStarted && (
        <div className="w-full flex items-center justify-start mb-2">
          <button
            onClick={() => {
              playBeep(350, 90);
              setIsServerStarted(false);
              onServerStateChange?.(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/35 bg-emerald-950/30 text-emerald-400 hover:text-white hover:bg-emerald-500/20 text-[11px] font-extrabold tracking-widest uppercase cursor-pointer duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isServerStarted ? (
          /* EXQUISITE CYBERPUNK PREMIUM GAMING LANDING PAGE */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm mx-auto flex flex-col justify-start flex-1 gap-4 relative pt-1"
          >
            {/* Animated Ambient Floating Particles on full dashboard container */}
            <div className="absolute inset-x-0 -top-8 -bottom-8 pointer-events-none overflow-hidden z-0">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/20 blur-[1px]"
                  style={{
                    left: `${15 + i * 18}%`,
                    top: `${15 + (i % 2) * 35}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.15, 0.6, 0.15],
                    scale: [0.9, 1.1, 0.9]
                  }}
                  transition={{
                    duration: 3.5 + i,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              ))}
              {/* Optional larger glowing auroras representing the game style */}
              <div className="absolute top-[10%] left-1/4 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl" />
              <div className="absolute bottom-[20%] right-1/4 w-24 h-24 bg-cyan-600/5 rounded-full blur-2xl" />
            </div>

            {/* TOP SECTION: Clean, ultra-premium matte deep-dark space/slate box with zero side curves and a tech cut (chamfer) on the top-left */}
            <div 
              className="w-full bg-gradient-to-br from-[#334155] via-[#1e293b] to-slate-800 p-[1.5px] shadow-[0_15px_30px_rgba(0,0,0,0.6)] relative overflow-hidden z-10 transition-all duration-300"
              style={{
                clipPath: "polygon(22px 0px, 100% 0px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0px 100%, 0px 22px)"
              }}
            >
              {/* Inner container to match the border cut exactly */}
              <div 
                className="w-full bg-gradient-to-br from-[#0e0f13] via-[#1a1c24] to-[#0c0d12] p-4 flex flex-col gap-2 relative overflow-hidden"
                style={{
                  clipPath: "polygon(21px 0px, 100% 0px, 100% calc(100% - 21px), calc(100% - 21px) 100%, 0px 100%, 0px 21px)"
                }}
              >
                <div className="flex items-center justify-between w-full relative z-10 gap-2">
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Left Side: Drago Logo (Enlarged) */}
                    <div className="w-20 h-20 flex items-center justify-center relative shrink-0">
                      <img
                        src="https://i.ibb.co/KcgyD6L6/Logo-Transparent-D01-HBKjp.png"
                        alt="DRAGO LOGO"
                        className="w-full h-full object-contain z-10"
                        onError={(e) => {
                          const currentSrc = e.currentTarget.src;
                          if (currentSrc.includes('KcgyD6L6')) {
                            e.currentTarget.src = 'https://i.ibb.co/GPSTmZ6/logo.png';
                          } else {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const fallback_el = parent.querySelector('.logo-fallback');
                              if (fallback_el) fallback_el.classList.remove('hidden');
                            }
                          }
                        }}
                        referrerPolicy="no-referrer"
                        id="drago-header-logo-img"
                      />
                      
                      {/* Fallback stylized SVG Dragon Icon */}
                      <div className="logo-fallback hidden absolute inset-0 flex flex-col items-center justify-center z-0">
                        <span className="text-3xl font-bold">🐉</span>
                        <span className="text-[8px] tracking-widest text-[#1A3A78] font-bold font-sans">DRAGO</span>
                      </div>
                    </div>

                    {/* Right Side: Title & Subtitle Stack */}
                    <div className="flex flex-col justify-center text-left">
                      {/* Header Title: DRAGO PREDICTOR 4.0 - Enlarged & bold for stunning appearance */}
                      <h1 className="text-[20px] min-[360px]:text-[22px] min-[390px]:text-[24px] md:text-[26px] font-extrabold font-iceland uppercase tracking-wider leading-none whitespace-nowrap text-white">
                        DRAGO <span className="text-cyan-400 font-extrabold">PREDICTOR </span>4.0
                      </h1>
                      <p className="text-[11px] min-[360px]:text-[12px] font-semibold font-orbitron tracking-widest text-white/90 mt-1.5 leading-normal whitespace-nowrap">
                        Smart Ai Predictions
                      </p>
                    </div>
                  </div>

                  {/* Key Expiration Badge positioned above the line on the far right side */}
                  <div className="flex items-center gap-2 self-center">
                    <button
                      type="button"
                      onClick={() => {
                        playBeep(350, 90);
                        onBack();
                      }}
                      className="flex items-center gap-1 py-1 px-2 rounded border border-red-550/30 bg-red-950/20 text-[#ff4a4a] transition-all duration-300 hover:scale-[1.03] select-none cursor-pointer text-[12px] font-black uppercase tracking-wider h-[26px]"
                    >
                      <ArrowLeft className="w-3 h-3 text-[#ff4a4a]" />
                      BACK
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowKeyConsole(!showKeyConsole)}
                      className={`flex items-center gap-1.5 py-1 px-2.5 rounded border transition-all duration-300 hover:scale-[1.03] select-none cursor-pointer h-[26px] ${
                        showKeyConsole 
                          ? 'border-yellow-400/80 bg-yellow-400/10 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.25)]' 
                          : 'border-cyan-400/30 bg-cyan-950/20 text-cyan-300 shadow-[0_0_6px_rgba(34,211,238,0.1)] hover:border-cyan-400/75'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${timeLeftMs > 0 ? 'bg-green-400 animate-pulse' : 'bg-red-500 animate-ping'}`} />
                      <span className="font-iceland text-[12px] tracking-[0.05em] uppercase font-black whitespace-nowrap">
                        DAYS: {getCompactDaysText(timeLeftMs)}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Clean, high-tech horizontal divider line separating header and game selection */}
                <div className="w-full border-t border-slate-800/80 mt-1 relative z-10" />

                {/* Centered SELECT YOUR GAME text */}
                <div className="flex flex-col w-full mt-1.5 select-none relative z-10 pb-0.5">
                  <div className="text-center w-full">
                    <p className="text-md min-[360px]:text-[17px] min-[390px]:text-lg md:text-xl font-bold uppercase tracking-[0.25em] font-iceland leading-none">
                      <span className="text-white">SELECT </span>
                      <span className="text-cyan-400 font-extrabold">YOUR </span>
                      <span className="text-white">GAME</span>
                    </p>
                  </div>

                  {/* High Tech Interactive Simulation Dropdown Drawer Console - Allows direct verification that days decay and key expires */}
                  {showKeyConsole && (
                    <div className="w-full mt-2 px-3 py-2.5 rounded-xl border border-cyan-500/20 bg-[#07080c] shadow-[inset_0_0_10px_rgba(0,162,255,0.05)] flex flex-col gap-2.5 text-left transition-all duration-300 max-w-full">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-800/50">
                        <span className="text-xs font-bold text-cyan-300/80 tracking-widest font-mono uppercase">PORTAL SECURITY LEASE</span>
                        <span className="text-[10px] text-white/40 font-mono font-medium tracking-normal select-none">ID: #{keyInfo?.keyName || 'FREE-TRIAL'}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/50 uppercase tracking-widest font-iceland">ACTIVATION TYPE</span>
                          <span className="text-sm font-bold text-[#61DACC] font-iceland tracking-wider">{keyInfo?.keyName || 'FREE-TRIAL'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/50 uppercase tracking-widest font-iceland">TIMELINE REMAINING</span>
                          <span className="text-sm font-bold text-amber-300 font-mono tracking-wide">{formatTimeLeft(timeLeftMs)}</span>
                        </div>
                      </div>

                      <div className="mt-1 pt-2 border-t border-slate-800/50 flex flex-col gap-2">
                        <span className="text-[10px] text-amber-500/85 uppercase tracking-[0.15em] font-iceland text-center font-semibold">
                          --- TESTING AND DECAY SIMULATOR MODULE ---
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2 mt-0.5">
                          {/* Fast-forward simulator - subtracts 1 day instantly from lease */}
                          <button
                            type="button"
                            onClick={() => simulateDaysPassed(1)}
                            className="bg-amber-950/20 hover:bg-amber-950/45 border border-amber-500/30 hover:border-amber-400 text-amber-300 py-1.5 px-2 rounded-lg text-xs font-iceland tracking-widest uppercase font-bold text-center duration-150 active:scale-95 cursor-pointer"
                          >
                            -1 Day Decay
                          </button>

                          {/* Fast-forward simulator - subtracts 5 days instantly from lease */}
                          <button
                            type="button"
                            onClick={simulateInstantExpiration}
                            className="bg-red-950/25 hover:bg-red-950/50 border border-red-500/35 hover:border-red-400 text-red-300 py-1.5 px-2 rounded-lg text-xs font-iceland tracking-widest uppercase font-bold text-center duration-150 active:scale-95 cursor-pointer"
                          >
                            INSTANT EXPIRE
                          </button>
                        </div>
                        <p className="text-[9px] text-white/40 normal-case leading-normal font-sans italic text-center">
                          Use buttons above to test decrement and auto-expiration redirection logic.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* GAME CONTENT SECTION */}
            {!isStartingServer ? (
              <div className="w-full flex flex-col gap-4 mt-2">
                {/* Game Card with border styled like the upper card but with a premium dark slate-to-black transition, subtle green cyber hints and a touch of the cyan logo color */}
                <div 
                  className="w-full h-[270px] min-[360px]:h-[305px] min-[390px]:h-[325px] md:h-[370px] p-[2px] bg-gradient-to-br from-[#475569] via-[#0f172a] via-[#0891b2]/45 via-[#0a2c0e] to-[#15803d]/30 shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300"
                  style={{
                    clipPath: "polygon(22px 0px, 100% 0px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0px 100%, 0px 22px)"
                  }}
                >
                  {/* Inner contain body matching the exact straight tech border layout */}
                  <div 
                    className="w-full h-full pt-1 px-4 pb-4 flex flex-col items-center justify-between relative overflow-hidden"
                    style={{
                      clipPath: "polygon(21px 0px, 100% 0px, 100% calc(100% - 21px), calc(100% - 21px) 100%, 0px 100%, 0px 21px)",
                      background: "linear-gradient(180deg, #052e16 0%, #16a34a 22%, #15803d 35%, #0f172a 60%, #000000 80%, #000000 100%)"
                    }}
                  >
                    {/* Glowing Dark Green backdrop effect for extra dimension using Neon Bright Green, restricted to top portion */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-0 opacity-40"
                      style={{
                        background: "radial-gradient(circle at top, rgba(34,197,94,0.3) 0%, rgba(22,163,74,0.1) 45%, transparent 75%)"
                      }}
                    />

                    {/* Centered Wingo logo from the requested URL - positioned higher and made larger */}
                    <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-11" id="future-custom-placement">
                      <img 
                        src="https://i.ibb.co/G3sz87sw/Adobe-Express-file-1.png" 
                        alt="Wingo Logo" 
                        className="h-[195px] min-[360px]:h-[230px] md:h-[270px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(34,197,94,0.35)] rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Corner site icon placed exactly where the hand-drawn box is in the screenshot - styled with a curved rounded frame, neon glow, and "Yaar Win" text and REGISTER NOW button */}
                    <div className="absolute left-3 bottom-[102px] z-20 select-none flex items-center gap-3 min-[360px]:gap-4">
                      <img 
                        src="https://i.ibb.co/5WvxRqXs/site-Icon-2-1.png" 
                        alt="Yaarwin Site Icon" 
                        className="w-[50px] h-[50px] min-[360px]:w-[60px] min-[360px]:h-[60px] md:w-[70px] md:h-[70px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(34,197,94,0.45)] rounded-2xl border-2 border-[#22c55e]/60 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col gap-1.5 -mt-1">
                        <span 
                          className="font-iceland font-bold tracking-wider text-[20px] min-[360px]:text-[24px] md:text-[28px] text-white select-none leading-none"
                          style={{
                            textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                          }}
                        >
                          Yaar Win
                        </span>
                        {/* REGISTER NOW button with custom slanted cut polygon shape as requested */}
                        <a 
                          href="https://yaarwin.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[110px] min-[360px]:w-[130px] md:w-[150px] h-[22px] min-[360px]:h-[26px] md:h-[30px] group flex"
                        >
                          {/* Outer clipped border container */}
                          <div 
                            className="absolute inset-0 bg-[#22c55e] transition-all duration-300 group-hover:bg-[#4ade80] shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                            style={{
                              clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                            }}
                          />
                          {/* Inner clipped background container */}
                          <div 
                            className="absolute inset-[1px] bg-black/80 flex items-center justify-start pl-2"
                            style={{
                              clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                            }}
                          >
                            <span 
                              className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none text-[#22c55e] transition-colors duration-300 group-hover:text-[#4ade80]"
                              style={{
                                textShadow: "0px 1px 2px rgba(0,0,0,0.6)"
                              }}
                            >
                              REGISTER NOW
                            </span>
                          </div>
                        </a>
                      </div>
                    </div>

                    {/* Validity Days Box positioned tightly to the right side edge per user request */}
                    <div className="absolute right-1 min-[360px]:right-1.5 bottom-[78px] z-20 flex items-center select-none animate-fadeIn">
                      <div className="border border-green-500/35 bg-green-950/20 text-[#22c55e] rounded px-1.5 py-0.5 min-[360px]:px-2 min-[360px]:py-1 flex items-center justify-center font-bold font-iceland tracking-[0.08em] text-[10px] min-[360px]:text-[12px] md:text-xs shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                        <span className="w-1 h-1 rounded-full bg-[#22c55e] animate-pulse mr-1" />
                        {getFormattedDaysText()}
                      </div>
                    </div>

                    {/* START SERVER Button inside the box - Full width stretching to touch both sides with Neon Green Top Border */}
                    <button
                      onClick={() => {
                        playBeep(440, 100);
                        setActiveTab('wingo1');
                        setSelectedGame('yaarwin');
                        handleStartServer();
                      }}
                      id="drago-start-server-btn"
                      className="w-[calc(100%+2rem)] -mx-4 -mb-4 py-4 px-6 border-t-2 border-[#22c55e] hover:brightness-115 text-white font-black tracking-[0.2em] font-iceland uppercase text-[23px] sm:text-[25px] rounded-none transition-all duration-300 z-10 shadow-[0_-4px_18px_rgba(34,197,94,0.35)] hover:shadow-[0_-4px_28px_rgba(34,197,94,0.55)] cursor-pointer"
                      style={{
                        background: "linear-gradient(90deg, #15803d 0%, #22c55e 50%, #15803d 100%)",
                        textShadow: "0px 2px 4px rgba(0,0,0,0.6), 0px 0px 1px rgba(0,0,0,0.8)"
                      }}
                    >
                      START SERVER
                    </button>
                  </div>
                </div>

                {/* 82 LOTTERY GAME CARD - Sophisticated Red Cyber styling to match the brand specs */}
                <div 
                  className="w-full h-[270px] min-[360px]:h-[305px] min-[390px]:h-[325px] md:h-[370px] p-[2px] bg-gradient-to-br from-[#475569] via-[#0f172a] via-[#ef4444]/45 via-[#450a0a] to-[#991b1b]/30 shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 mt-2"
                  style={{
                    clipPath: "polygon(22px 0px, 100% 0px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0px 100%, 0px 22px)"
                  }}
                >
                  {/* Inner contain body matching the exact straight tech border layout with red theme */}
                  <div 
                    className="w-full h-full pt-1 px-4 pb-4 flex flex-col items-center justify-between relative overflow-hidden"
                    style={{
                      clipPath: "polygon(21px 0px, 100% 0px, 100% calc(100% - 21px), calc(100% - 21px) 100%, 0px 100%, 0px 21px)",
                      background: "linear-gradient(180deg, #450a0a 0%, #dc2626 22%, #b91c1c 35%, #0f172a 60%, #000000 80%, #000000 100%)"
                    }}
                  >
                    {/* Glowing Dark Red backdrop effect */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-0 opacity-40"
                      style={{
                        background: "radial-gradient(circle at top, rgba(239,68,68,0.3) 0%, rgba(220,38,38,0.1) 45%, transparent 75%)"
                      }}
                    />

                    {/* Centered Wingo logo from the requested URL - positioned higher and made larger */}
                    <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-11">
                      <img 
                        src="https://i.ibb.co/Xf3mrhQs/Untitled-11-June-2026-at-14-45-16.png" 
                        alt="82 Lottery Top Logo" 
                        className="h-[195px] min-[360px]:h-[230px] md:h-[270px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(239,68,68,0.35)] rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Corner site icon, "82 Lottery" text and REGISTER NOW button */}
                    <div className="absolute left-3 bottom-[102px] z-20 select-none flex items-center gap-3 min-[360px]:gap-4">
                      <img 
                        src="https://i.ibb.co/9kyC9Kj7/IMG-20260611-144339.jpg" 
                        alt="82 Lottery Side Icon" 
                        className="w-[50px] h-[50px] min-[360px]:w-[60px] min-[360px]:h-[60px] md:w-[70px] md:h-[70px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(239,68,68,0.45)] rounded-2xl border-2 border-[#ef4444]/60 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col gap-1.5 -mt-1">
                        <span 
                          className="font-iceland font-bold tracking-wider text-[20px] min-[360px]:text-[24px] md:text-[28px] text-white select-none leading-none"
                          style={{
                            textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                          }}
                        >
                          82 lottery
                        </span>
                        {/* REGISTER NOW button with custom slanted cut polygon shape */}
                        <a 
                          href="https://82lottery.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[110px] min-[360px]:w-[130px] md:w-[150px] h-[22px] min-[360px]:h-[26px] md:h-[30px] group flex"
                        >
                          {/* Outer clipped border container */}
                          <div 
                            className="absolute inset-0 bg-[#ef4444] transition-all duration-300 group-hover:bg-[#f87171] shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                            style={{
                              clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                            }}
                          />
                          {/* Inner clipped background container */}
                          <div 
                            className="absolute inset-[1px] bg-black/80 flex items-center justify-start pl-2"
                            style={{
                              clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                            }}
                          >
                            <span 
                              className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none text-[#ef4444] transition-colors duration-300 group-hover:text-[#f87171]"
                              style={{
                                textShadow: "0px 1px 2px rgba(0,0,0,0.6)"
                              }}
                            >
                              REGISTER NOW
                            </span>
                          </div>
                        </a>
                      </div>
                    </div>

                    {/* Validity Days Box positioned tightly to the right side edge per user request */}
                    <div className="absolute right-1 min-[360px]:right-1.5 bottom-[78px] z-20 flex items-center select-none animate-fadeIn">
                      <div className="border border-red-500/35 bg-red-950/20 text-[#ef4444] rounded px-1.5 py-0.5 min-[360px]:px-2 min-[360px]:py-1 flex items-center justify-center font-bold font-iceland tracking-[0.08em] text-[10px] min-[360px]:text-[12px] md:text-xs shadow-[0_0_12px_rgba(239,68,68,0.15)]">
                        <span className="w-1 h-1 rounded-full bg-[#ef4444] animate-pulse mr-1" />
                        {getFormattedDaysText()}
                      </div>
                    </div>

                    {/* START SERVER Button inside the box - Full width stretching to touch both sides with Red Top Border */}
                    <button
                      onClick={() => {
                        playBeep(440, 100);
                        setActiveTab('wingo1');
                        setSelectedGame('eightytwolottery');
                        handleStartServer();
                      }}
                      className="w-[calc(100%+2rem)] -mx-4 -mb-4 py-4 px-6 border-t-2 border-[#ef4444] hover:brightness-115 text-white font-black tracking-[0.2em] font-iceland uppercase text-[23px] sm:text-[25px] rounded-none transition-all duration-300 z-10 shadow-[0_-4px_18px_rgba(239,68,68,0.35)] hover:shadow-[0_-4px_28px_rgba(239,68,68,0.55)] cursor-pointer"
                      style={{
                        background: "linear-gradient(90deg, #b91c1c 0%, #ef4444 50%, #b91c1c 100%)",
                        textShadow: "0px 2px 4px rgba(0,0,0,0.6), 0px 0px 1px rgba(0,0,0,0.8)"
                      }}
                    >
                      START SERVER
                    </button>
                  </div>
                </div>

                {/* JALWA GAME CARD - Sophisticated Teal Cyber styling matching the #61DACC brand specifications */}
                <div 
                  className="w-full h-[270px] min-[360px]:h-[305px] min-[390px]:h-[325px] md:h-[370px] p-[2px] bg-gradient-to-br from-[#475569] via-[#0f172a] via-[#61DACC]/45 via-[#0d2a2a] to-[#0d5252]/30 shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 mt-2"
                  style={{
                    clipPath: "polygon(22px 0px, 100% 0px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0px 100%, 0px 22px)"
                  }}
                >
                  {/* Inner contain body matching the exact straight tech border layout with teal theme */}
                  <div 
                    className="w-full h-full pt-1 px-4 pb-4 flex flex-col items-center justify-between relative overflow-hidden"
                    style={{
                      clipPath: "polygon(21px 0px, 100% 0px, 100% calc(100% - 21px), calc(100% - 21px) 100%, 0px 100%, 0px 21px)",
                      background: "linear-gradient(180deg, #0d2a2a 0%, #61DACC 22%, #14b8a6 35%, #0f172a 60%, #000000 80%, #000000 100%)"
                    }}
                  >
                    {/* Glowing Teal backdrop effect */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-0 opacity-40"
                      style={{
                        background: "radial-gradient(circle at top, rgba(97,218,204,0.3) 0%, rgba(20,184,166,0.1) 45%, transparent 75%)"
                      }}
                    />

                    {/* Centered logo from the requested URL - positioned higher and made larger */}
                    <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-11">
                      <img 
                        src="https://i.ibb.co/0jZHN3sN/Adobe-Express-file-2.png" 
                        alt="Jalwa Game Top Logo" 
                        className="h-[195px] min-[360px]:h-[230px] md:h-[270px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(97,218,204,0.35)] rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Corner site icon, "JALWA GAME" text and REGISTER NOW button */}
                    <div className="absolute left-3 bottom-[102px] z-20 select-none flex items-center gap-3 min-[360px]:gap-4">
                      <img 
                        src="https://i.ibb.co/C3z8tfrt/images-3.jpg" 
                        alt="Jalwa Game Side Icon" 
                        className="w-[50px] h-[50px] min-[360px]:w-[60px] min-[360px]:h-[60px] md:w-[70px] md:h-[70px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(97,218,204,0.45)] rounded-2xl border-2 border-[#61DACC]/60 shadow-[0_0_15px_rgba(97,218,204,0.3)]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col gap-1.5 -mt-1">
                        <span 
                          className="font-iceland font-bold tracking-wider text-[20px] min-[360px]:text-[24px] md:text-[28px] text-white select-none leading-none"
                          style={{
                            textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                          }}
                        >
                          JALWA GAME
                        </span>
                        {/* REGISTER NOW button with custom slanted cut polygon shape */}
                        <a 
                          href="https://jalwagame.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[110px] min-[360px]:w-[130px] md:w-[150px] h-[22px] min-[360px]:h-[26px] md:h-[30px] group flex"
                        >
                          {/* Outer clipped border container */}
                          <div 
                            className="absolute inset-0 bg-[#61DACC] transition-all duration-300 group-hover:bg-[#85e5d9] shadow-[0_0_8px_rgba(97,218,204,0.3)]"
                            style={{
                              clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                            }}
                          />
                          {/* Inner clipped background container */}
                          <div 
                            className="absolute inset-[1px] bg-black/80 flex items-center justify-start pl-2"
                            style={{
                              clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                            }}
                          >
                            <span 
                              className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none text-[#61DACC] transition-colors duration-300 group-hover:text-[#85e5d9]"
                              style={{
                                textShadow: "0px 1px 2px rgba(0,0,0,0.6)"
                              }}
                            >
                              REGISTER NOW
                            </span>
                          </div>
                        </a>
                      </div>
                    </div>

                    {/* Validity Days Box positioned tightly to the right side edge per user request */}
                    <div className="absolute right-1 min-[360px]:right-1.5 bottom-[78px] z-20 flex items-center select-none animate-fadeIn">
                      <div className="border border-[#61DACC]/35 bg-[#61DACC]/10 text-[#61DACC] rounded px-1.5 py-0.5 min-[360px]:px-2 min-[360px]:py-1 flex items-center justify-center font-bold font-iceland tracking-[0.08em] text-[10px] min-[360px]:text-[12px] md:text-xs shadow-[0_0_12px_rgba(97,218,204,0.15)]">
                        <span className="w-1 h-1 rounded-full bg-[#61DACC] animate-pulse mr-1" />
                        {getFormattedDaysText()}
                      </div>
                    </div>

                    {/* START SERVER Button inside the box - Full width stretching to touch both sides with Teal Top Border */}
                    <button
                      onClick={() => {
                        playBeep(440, 100);
                        setActiveTab('wingo1');
                        setSelectedGame('jalwagame');
                        handleStartServer();
                      }}
                      className="w-[calc(100%+2rem)] -mx-4 -mb-4 py-4 px-6 border-t-2 border-[#61DACC] hover:brightness-115 text-white font-black tracking-[0.2em] font-iceland uppercase text-[23px] sm:text-[25px] rounded-none transition-all duration-300 z-10 shadow-[0_-4px_18px_rgba(97,218,204,0.35)] hover:shadow-[0_-4px_28px_rgba(97,218,204,0.55)] cursor-pointer"
                      style={{
                        background: "linear-gradient(90deg, #14b8a6 0%, #61DACC 50%, #14b8a6 100%)",
                        textShadow: "0px 2px 4px rgba(0,0,0,0.6), 0px 0px 1px rgba(0,0,0,0.8)"
                      }}
                    >
                      START SERVER
                    </button>
                  </div>
                </div>

                {/* TIRANGA CARD - Premium Royal/Cornflower Blue cyber styling matching TIRANGA specifications */}
                <div 
                  className="w-full h-[270px] min-[360px]:h-[305px] min-[390px]:h-[325px] md:h-[370px] p-[2px] bg-gradient-to-br from-[#475569] via-[#0f172a] via-[#6495ED]/45 via-[#0c2340] to-[#1e3a8a]/30 shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 mt-2"
                  style={{
                    clipPath: "polygon(22px 0px, 100% 0px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0px 100%, 0px 22px)"
                  }}
                >
                  {/* Inner contain body matching the exact straight tech border layout with blue theme */}
                  <div 
                    className="w-full h-full pt-1 px-4 pb-4 flex flex-col items-center justify-between relative overflow-hidden"
                    style={{
                      clipPath: "polygon(21px 0px, 100% 0px, 100% calc(100% - 21px), calc(100% - 21px) 100%, 0px 100%, 0px 21px)",
                      background: "linear-gradient(180deg, #0c2340 0%, #6495ED 22%, #4169E1 35%, #0f172a 60%, #000000 80%, #000000 100%)"
                    }}
                  >
                    {/* Glowing Blue backdrop effect */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-0 opacity-40"
                      style={{
                        background: "radial-gradient(circle at top, rgba(100,149,237,0.3) 0%, rgba(65,105,225,0.1) 45%, transparent 75%)"
                      }}
                    />

                    {/* Centered logo from the requested URL - positioned higher and made larger */}
                    <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-11">
                      <img 
                        src="https://i.ibb.co/Xk7vjxyn/Untitled-11-June-2026-at-15-19-06.png" 
                        alt="Tiranga Top Logo" 
                        className="h-[195px] min-[360px]:h-[230px] md:h-[270px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(100,149,237,0.35)] rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Corner site icon, "TIRANGA" text and REGISTER NOW button */}
                    <div className="absolute left-3 bottom-[102px] z-20 select-none flex items-center gap-3 min-[360px]:gap-4">
                      <img 
                        src="https://i.ibb.co/5X77Znb6/ff808081922891f201922cd7564505f6-large.png" 
                        alt="Tiranga Side Icon" 
                        className="w-[50px] h-[50px] min-[360px]:w-[60px] min-[360px]:h-[60px] md:w-[70px] md:h-[70px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(100,149,237,0.45)] rounded-2xl border-2 border-[#6495ED]/65 shadow-[0_0_15px_rgba(65,105,225,0.3)]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col gap-1.5 -mt-1">
                        <span 
                          className="font-iceland font-bold tracking-wider text-[20px] min-[360px]:text-[24px] md:text-[28px] text-white select-none leading-none"
                          style={{
                            textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                          }}
                        >
                          TIRANGA
                        </span>
                        {/* REGISTER NOW button with custom slanted cut polygon shape */}
                        <a 
                          href="https://tiranggame.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[110px] min-[360px]:w-[130px] md:w-[150px] h-[22px] min-[360px]:h-[26px] md:h-[30px] group flex"
                        >
                          {/* Outer clipped border container */}
                          <div 
                            className="absolute inset-0 bg-[#6495ED] transition-all duration-300 group-hover:bg-[#85b5ff] shadow-[0_0_8px_rgba(100,149,237,0.3)]"
                            style={{
                              clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                            }}
                          />
                          {/* Inner clipped background container */}
                          <div 
                            className="absolute inset-[1px] bg-black/80 flex items-center justify-start pl-2"
                            style={{
                              clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                            }}
                          >
                            <span 
                              className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none text-[#6495ED] transition-colors duration-300 group-hover:text-[#85b5ff]"
                              style={{
                                textShadow: "0px 1px 2px rgba(0,0,0,0.6)"
                              }}
                            >
                              REGISTER NOW
                            </span>
                          </div>
                        </a>
                      </div>
                    </div>

                    {/* Validity Days Box positioned tightly to the right side edge per user request */}
                    <div className="absolute right-1 min-[360px]:right-1.5 bottom-[78px] z-20 flex items-center select-none animate-fadeIn">
                      <div className="border border-[#6495ED]/35 bg-[#6495ED]/10 text-[#6495ED] rounded px-1.5 py-0.5 min-[360px]:px-2 min-[360px]:py-1 flex items-center justify-center font-bold font-iceland tracking-[0.08em] text-[10px] min-[360px]:text-[12px] md:text-xs shadow-[0_0_12px_rgba(100,149,237,0.15)]">
                        <span className="w-1 h-1 rounded-full bg-[#6495ED] animate-pulse mr-1" />
                        {getFormattedDaysText()}
                      </div>
                    </div>

                    {/* START SERVER Button inside the box - Full width stretching to touch both sides with Royal Blue Top Border */}
                    <button
                      onClick={() => {
                        playBeep(440, 100);
                        setActiveTab('wingo1');
                        setSelectedGame('tiranga');
                        handleStartServer();
                      }}
                      className="w-[calc(100%+2rem)] -mx-4 -mb-4 py-4 px-6 border-t-2 border-[#6495ED] hover:brightness-115 text-white font-black tracking-[0.2em] font-iceland uppercase text-[23px] sm:text-[25px] rounded-none transition-all duration-300 z-10 shadow-[0_-4px_18px_rgba(100,149,237,0.35)] hover:shadow-[0_-4px_28px_rgba(100,149,237,0.55)] cursor-pointer"
                      style={{
                        background: "linear-gradient(90deg, #1e3a8a 0%, #6495ED 50%, #1e3a8a 100%)",
                        textShadow: "0px 2px 4px rgba(0,0,0,0.6), 0px 0px 1px rgba(0,0,0,0.8)"
                      }}
                    >
                      START SERVER
                    </button>
                  </div>
                </div>

                {/* 51 GAME CARD - Premium Golden / Amber Yellow cyber styling matching 51 GAME specifications */}
                <div 
                  className="w-full h-[270px] min-[360px]:h-[305px] min-[390px]:h-[325px] md:h-[370px] p-[2px] bg-gradient-to-br from-[#d97706] via-[#0f172a] via-[#f59e0b]/45 via-[#78350f] to-[#b45309]/30 shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 mt-2"
                  style={{
                    clipPath: "polygon(22px 0px, 100% 0px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0px 100%, 0px 22px)"
                  }}
                >
                  {/* Inner contain body matching the exact straight tech border layout with yellow/amber theme */}
                  <div 
                    className="w-full h-full pt-1 px-4 pb-4 flex flex-col items-center justify-between relative overflow-hidden"
                    style={{
                      clipPath: "polygon(21px 0px, 100% 0px, 100% calc(100% - 21px), calc(100% - 21px) 100%, 0px 100%, 0px 21px)",
                      background: "linear-gradient(180deg, #451a03 0%, #f59e0b 22%, #d97706 35%, #0f172a 60%, #000000 80%, #000000 100%)"
                    }}
                  >
                    {/* Glowing Amber backdrop effect */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-0 opacity-40"
                      style={{
                        background: "radial-gradient(circle at top, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.1) 45%, transparent 75%)"
                      }}
                    />

                    {/* Centered logo from requested URL - shifted higher for size */}
                    <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-11">
                      <img 
                        src="https://i.ibb.co/C3Bw23d8/Adobe-Express-file-3.png" 
                        alt="51 Game Top Logo" 
                        className="h-[195px] min-[360px]:h-[230px] md:h-[270px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.35)] rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Side icon, "51 GAME" text and REGISTER NOW button */}
                    <div className="absolute left-3 bottom-[102px] z-20 select-none flex items-center gap-3 min-[360px]:gap-4">
                      <img 
                        src="https://i.ibb.co/XfRq7zhD/favicon.jpg" 
                        alt="51 Game Side Icon" 
                        className="w-[50px] h-[50px] min-[360px]:w-[60px] min-[360px]:h-[60px] md:w-[70px] md:h-[70px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.45)] rounded-2xl border-2 border-[#f59e0b]/65 shadow-[0_0_15px_rgba(217,119,6,0.3)]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col gap-1.5 -mt-1">
                        <span 
                          className="font-iceland font-bold tracking-wider text-[20px] min-[360px]:text-[24px] md:text-[28px] text-white select-none leading-none"
                          style={{
                            textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                          }}
                        >
                          51 GAME
                        </span>
                        {/* REGISTER NOW button with custom slanted cut polygon shape */}
                        <a 
                          href="https://51game.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[110px] min-[360px]:w-[130px] md:w-[150px] h-[22px] min-[360px]:h-[26px] md:h-[30px] group flex"
                        >
                          {/* Outer clipped border container */}
                          <div 
                            className="absolute inset-0 bg-[#f59e0b] transition-all duration-300 group-hover:bg-[#fbbf24] shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                            style={{
                              clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                            }}
                          />
                          {/* Inner clipped background container */}
                          <div 
                            className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                            style={{
                              clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                            }}
                          >
                            <span 
                              className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none text-[#f59e0b] transition-colors duration-300 group-hover:text-[#fbbf24]"
                              style={{
                                textShadow: "0px 1px 2px rgba(0,0,0,0.6)"
                              }}
                            >
                              REGISTER NOW
                            </span>
                          </div>
                        </a>
                      </div>
                    </div>

                    {/* Validity Days Box positioned tightly to the right side edge per user request */}
                    <div className="absolute right-1 min-[360px]:right-1.5 bottom-[78px] z-20 flex items-center select-none animate-fadeIn">
                      <div className="border border-[#f59e0b]/35 bg-[#f59e0b]/10 text-[#f59e0b] rounded px-1.5 py-0.5 min-[360px]:px-2 min-[360px]:py-1 flex items-center justify-center font-bold font-iceland tracking-[0.08em] text-[10px] min-[360px]:text-[12px] md:text-xs shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                        <span className="w-1 h-1 rounded-full bg-[#f59e0b] animate-pulse mr-1" />
                        {getFormattedDaysText()}
                      </div>
                    </div>

                    {/* START SERVER Button inside the box */}
                    <button
                      onClick={() => {
                        playBeep(440, 100);
                        setActiveTab('wingo1');
                        setSelectedGame('fiftyonegame');
                        handleStartServer();
                      }}
                      className="w-[calc(100%+2rem)] -mx-4 -mb-4 py-4 px-6 border-t-2 border-[#f59e0b] hover:brightness-115 text-black font-black tracking-[0.2em] font-iceland uppercase text-[23px] sm:text-[25px] rounded-none transition-all duration-300 z-10 shadow-[0_-4px_18px_rgba(245,158,11,0.35)] hover:shadow-[0_-4px_28px_rgba(245,158,11,0.55)] cursor-pointer"
                      style={{
                        background: "linear-gradient(90deg, #78350f 0%, #f59e0b 50%, #78350f 100%)",
                        textShadow: "0px 1px 1px rgba(255,255,255,0.4)"
                      }}
                    >
                      START SERVER
                    </button>
                  </div>
                </div>

                {/* JAI CLUB CARD - Premium Cyber Navy, Sky Blue and Neon Pink styling matching specs */}
                <div 
                  className="w-full h-[270px] min-[360px]:h-[305px] min-[390px]:h-[325px] md:h-[370px] p-[2px] bg-gradient-to-br from-[#0A0F5C] via-[#4DCBFF]/50 via-[#FF6BD6]/45 to-[#0A0F5C] shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 mt-2"
                  style={{
                    clipPath: "polygon(22px 0px, 100% 0px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0px 100%, 0px 22px)"
                  }}
                >
                  {/* Inner contain body matching the exact straight tech border layout with Jai Club theme */}
                  <div 
                    className="w-full h-full pt-1 px-4 pb-4 flex flex-col items-center justify-between relative overflow-hidden"
                    style={{
                      clipPath: "polygon(21px 0px, 100% 0px, 100% calc(100% - 21px), calc(100% - 21px) 100%, 0px 100%, 0px 21px)",
                      background: "linear-gradient(180deg, #0A0F5C 0%, #4DCBFF 22%, #FF6BD6 35%, #050522 62%, #000000 85%, #000000 100%)"
                    }}
                  >
                    {/* Glowing Cyber Synth backdrop effect */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-0 opacity-45"
                      style={{
                        background: "radial-gradient(circle at top, rgba(77,203,255,0.35) 0%, rgba(255,107,214,0.15) 45%, transparent 75%)"
                      }}
                    />

                    {/* Centered top logo shifted higher for size */}
                    <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-11">
                      <img 
                        src="https://i.ibb.co/hFbm5JpZ/Adobe-Express-file-4.png" 
                        alt="Jai Club Top Logo" 
                        className="h-[195px] min-[360px]:h-[230px] md:h-[270px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(77,203,255,0.4)] rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Side icon, "JAI CLUB" text and REGISTER NOW button */}
                    <div className="absolute left-3 bottom-[102px] z-20 select-none flex items-center gap-3 min-[360px]:gap-4">
                      <img 
                        src="https://i.ibb.co/7dw9k2Sk/images-4.jpg" 
                        alt="Jai Club Side Icon" 
                        className="w-[50px] h-[50px] min-[360px]:w-[60px] min-[360px]:h-[60px] md:w-[70px] md:h-[70px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(255,107,214,0.45)] rounded-2xl border-2 border-[#4DCBFF]/65 shadow-[0_0_15px_rgba(77,203,255,0.3)]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col gap-1.5 -mt-1">
                        <span 
                          className="font-iceland font-bold tracking-wider text-[20px] min-[360px]:text-[24px] md:text-[28px] text-white select-none leading-none"
                          style={{
                            textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                          }}
                        >
                          JAI CLUB
                        </span>
                        {/* REGISTER NOW button with custom slanted cut polygon shape */}
                        <a 
                          href="https://jaiclub.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[110px] min-[360px]:w-[130px] md:w-[150px] h-[22px] min-[360px]:h-[26px] md:h-[30px] group flex"
                        >
                          {/* Outer clipped border container */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-r from-[#4DCBFF] to-[#FF6BD6] transition-all duration-300 group-hover:brightness-125 shadow-[0_0_8px_rgba(77,203,255,0.35)]"
                            style={{
                              clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                            }}
                          />
                          {/* Inner clipped background container */}
                          <div 
                            className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                            style={{
                              clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                            }}
                          >
                            <span 
                              className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-[#4DCBFF] to-[#FF6BD6] bg-clip-text text-transparent font-black"
                              style={{
                                filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                              }}
                            >
                              REGISTER NOW
                            </span>
                          </div>
                        </a>
                      </div>
                    </div>

                    {/* Validity Days Box positioned tightly to the right side edge per user request */}
                    <div className="absolute right-1 min-[360px]:right-1.5 bottom-[78px] z-20 flex items-center select-none animate-fadeIn">
                      <div className="border border-[#4DCBFF]/35 bg-[#4DCBFF]/10 text-[#4DCBFF] rounded px-1.5 py-0.5 min-[360px]:px-2 min-[360px]:py-1 flex items-center justify-center font-bold font-iceland tracking-[0.08em] text-[10px] min-[360px]:text-[12px] md:text-xs shadow-[0_0_12px_rgba(77,203,255,0.15)]">
                        <span className="w-1 h-1 rounded-full bg-[#4DCBFF] animate-pulse mr-1" />
                        {getFormattedDaysText()}
                      </div>
                    </div>

                    {/* START SERVER Button inside the box */}
                    <button
                      onClick={() => {
                        playBeep(440, 100);
                        setActiveTab('wingo1');
                        setSelectedGame('jaiclub');
                        handleStartServer();
                      }}
                      className="w-[calc(100%+2rem)] -mx-4 -mb-4 py-4 px-6 border-t-2 border-[#4DCBFF] hover:brightness-110 text-white font-black tracking-[0.2em] font-iceland uppercase text-[23px] sm:text-[25px] rounded-none transition-all duration-300 z-10 shadow-[0_-4px_18px_rgba(77,203,255,0.35)] hover:shadow-[0_-4px_28px_rgba(255,107,214,0.45)] cursor-pointer"
                      style={{
                        background: "linear-gradient(90deg, #0A0F5C 0%, #4DCBFF 50%, #FF6BD6 100%)",
                        textShadow: "0px 1px 2px rgba(0,0,0,0.7)"
                      }}
                    >
                      START SERVER
                    </button>
                  </div>
                </div>

                {/* GOA GAME CARD - Royal Blue Cybernetic styling with glow */}
                <div 
                  className="w-full h-[270px] min-[360px]:h-[305px] min-[390px]:h-[325px] md:h-[370px] p-[2px] bg-gradient-to-br from-blue-900 via-[#4169E1]/60 to-blue-900 shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 mt-2"
                  style={{
                    clipPath: "polygon(22px 0px, 100% 0px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0px 100%, 0px 22px)"
                  }}
                >
                  {/* Inner contain body matching the exact straight tech border layout with Goa Game theme */}
                  <div 
                    className="w-full h-full pt-1 px-4 pb-4 flex flex-col items-center justify-between relative overflow-hidden"
                    style={{
                      clipPath: "polygon(21px 0px, 100% 0px, 100% calc(100% - 21px), calc(100% - 21px) 100%, 0px 100%, 0px 21px)",
                      background: "linear-gradient(180deg, #1e3a8a 0%, #4169E1 25%, #1e40af 45%, #020617 70%, #000000 90%, #000000 100%)"
                    }}
                  >
                    {/* Glowing Cyber Synth backdrop effect */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-0 opacity-40"
                      style={{
                        background: "radial-gradient(circle at top, rgba(65,105,225,0.4) 0%, rgba(30,58,138,0.2) 50%, transparent 80%)"
                      }}
                    />

                    {/* Centered top logo shifted higher for size */}
                    <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-11">
                      <img 
                        src="https://i.ibb.co/fdW4rBmq/Adobe-Express-file-5.png" 
                        alt="Goa Game Top Logo" 
                        className="h-[195px] min-[360px]:h-[230px] md:h-[270px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(65,105,225,0.45)] rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Side icon, "GOA GAME" text and REGISTER NOW button */}
                    <div className="absolute left-3 bottom-[102px] z-20 select-none flex items-center gap-3 min-[360px]:gap-4">
                      <img 
                        src="https://i.ibb.co/hJgZ2CBq/1751432319049.jpg" 
                        alt="Goa Game Side Icon" 
                        className="w-[50px] h-[50px] min-[360px]:w-[60px] min-[360px]:h-[60px] md:w-[70px] md:h-[70px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(65,105,225,0.5)] rounded-2xl border-2 border-[#4169E1]/65 shadow-[0_0_15px_rgba(65,105,225,0.3)]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col gap-1.5 -mt-1">
                        <span 
                          className="font-iceland font-bold tracking-wider text-[20px] min-[360px]:text-[24px] md:text-[28px] text-white select-none leading-none"
                          style={{
                            textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                          }}
                        >
                          GOA GAME
                        </span>
                        {/* REGISTER NOW button with custom slanted cut polygon shape */}
                        <a 
                          href="https://goagame.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[110px] min-[360px]:w-[130px] md:w-[150px] h-[22px] min-[360px]:h-[26px] md:h-[30px] group flex"
                        >
                          {/* Outer clipped border container */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-r from-[#4169E1] to-blue-400 transition-all duration-300 group-hover:brightness-125 shadow-[0_0_8px_rgba(65,105,225,0.35)]"
                            style={{
                              clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                            }}
                          />
                          {/* Inner clipped background container */}
                          <div 
                            className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                            style={{
                              clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                            }}
                          >
                            <span 
                              className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-blue-400 to-[#4169E1] bg-clip-text text-transparent font-black"
                              style={{
                                filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                              }}
                            >
                              REGISTER NOW
                            </span>
                          </div>
                        </a>
                      </div>
                    </div>

                    {/* Validity Days Box positioned tightly to the right side edge per user request */}
                    <div className="absolute right-1 min-[360px]:right-1.5 bottom-[78px] z-20 flex items-center select-none animate-fadeIn">
                      <div className="border border-[#4169E1]/35 bg-[#4169E1]/10 text-[#4169E1] rounded px-1.5 py-0.5 min-[360px]:px-2 min-[360px]:py-1 flex items-center justify-center font-bold font-iceland tracking-[0.08em] text-[10px] min-[360px]:text-[12px] md:text-xs shadow-[0_0_12px_rgba(65,105,225,0.15)]">
                        <span className="w-1 h-1 rounded-full bg-[#4169E1] animate-pulse mr-1" />
                        {getFormattedDaysText()}
                      </div>
                    </div>

                    {/* START SERVER Button inside the box */}
                    <button
                      onClick={() => {
                        playBeep(440, 100);
                        setActiveTab('wingo1');
                        setSelectedGame('goagame');
                        handleStartServer();
                      }}
                      className="w-[calc(100%+2rem)] -mx-4 -mb-4 py-4 px-6 border-t-2 border-[#4169E1] hover:brightness-110 text-white font-black tracking-[0.2em] font-iceland uppercase text-[23px] sm:text-[25px] rounded-none transition-all duration-300 z-10 shadow-[0_-4px_18px_rgba(65,105,225,0.35)] hover:shadow-[0_-4px_28px_rgba(65,105,225,0.45)] cursor-pointer"
                      style={{
                        background: "linear-gradient(90deg, #1e3a8a 0%, #4169E1 50%, #1e3a8a 100%)",
                        textShadow: "0px 1px 2px rgba(0,0,0,0.7)"
                      }}
                    >
                      START SERVER
                    </button>
                  </div>
                </div>

                {/* 91 CLUB CARD - Bright Red cyber theme matching specifications */}
                <div 
                  className="w-full h-[270px] min-[360px]:h-[305px] min-[390px]:h-[325px] md:h-[370px] p-[2px] bg-gradient-to-br from-red-900 via-[#ff1e27]/60 to-red-900 shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 mt-2"
                  style={{
                    clipPath: "polygon(22px 0px, 100% 0px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0px 100%, 0px 22px)"
                  }}
                >
                  {/* Inner contain body matching the exact straight tech border layout with 91 Club theme */}
                  <div 
                    className="w-full h-full pt-1 px-4 pb-4 flex flex-col items-center justify-between relative overflow-hidden"
                    style={{
                      clipPath: "polygon(21px 0px, 100% 0px, 100% calc(100% - 21px), calc(100% - 21px) 100%, 0px 100%, 0px 21px)",
                      background: "linear-gradient(180deg, #590409 0%, #ff1e27 25%, #7f0d11 45%, #020617 70%, #000000 90%, #000000 100%)"
                    }}
                  >
                    {/* Glowing Cyber Synth backdrop effect */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-0 opacity-40"
                      style={{
                        background: "radial-gradient(circle at top, rgba(255,30,39,0.4) 0%, rgba(127,13,17,0.2) 50%, transparent 80%)"
                      }}
                    />

                    {/* Centered top logo shifted higher for size */}
                    <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-11">
                      <img 
                        src="https://i.ibb.co/YBhpp89b/Adobe-Express-file-6.png" 
                        alt="91 Club Top Logo" 
                        className="h-[195px] min-[360px]:h-[230px] md:h-[270px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(255,30,39,0.45)] rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Side icon, "91 CLUB" text and REGISTER NOW button */}
                    <div className="absolute left-3 bottom-[102px] z-20 select-none flex items-center gap-3 min-[360px]:gap-4">
                      <img 
                        src="https://i.ibb.co/h1nfwLyz/91-club-app-logo.jpg" 
                        alt="91 Club Side Icon" 
                        className="w-[50px] h-[50px] min-[360px]:w-[60px] min-[360px]:h-[60px] md:w-[70px] md:h-[70px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(255,30,39,0.5)] rounded-2xl border-2 border-[#ff1e27]/65 shadow-[0_0_15px_rgba(255,30,39,0.3)]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col gap-1.5 -mt-1">
                        <span 
                          className="font-iceland font-bold tracking-wider text-[20px] min-[360px]:text-[24px] md:text-[28px] text-white select-none leading-none"
                          style={{
                            textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                          }}
                        >
                          91 CLUB
                        </span>
                        {/* REGISTER NOW button with custom slanted cut polygon shape */}
                        <a 
                          href="https://91club.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[110px] min-[360px]:w-[130px] md:w-[150px] h-[22px] min-[360px]:h-[26px] md:h-[30px] group flex"
                        >
                          {/* Outer clipped border container */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-r from-[#ff1e27] to-red-400 transition-all duration-300 group-hover:brightness-125 shadow-[0_0_8px_rgba(255,30,39,0.35)]"
                            style={{
                              clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                            }}
                          />
                          {/* Inner clipped background container */}
                          <div 
                            className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                            style={{
                              clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                            }}
                          >
                            <span 
                              className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-red-400 to-[#ff1e27] bg-clip-text text-transparent font-black"
                              style={{
                                filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                              }}
                            >
                              REGISTER NOW
                            </span>
                          </div>
                        </a>
                      </div>
                    </div>

                    {/* Validity Days Box positioned tightly to the right side edge per user request */}
                    <div className="absolute right-1 min-[360px]:right-1.5 bottom-[78px] z-20 flex items-center select-none animate-fadeIn">
                      <div className="border border-[#ff1e27]/35 bg-[#ff1e27]/10 text-[#ff1e27] rounded px-1.5 py-0.5 min-[360px]:px-2 min-[360px]:py-1 flex items-center justify-center font-bold font-iceland tracking-[0.08em] text-[10px] min-[360px]:text-[12px] md:text-xs shadow-[0_0_12px_rgba(255,30,39,0.15)]">
                        <span className="w-1 h-1 rounded-full bg-[#ff1e27] animate-pulse mr-1" />
                        {getFormattedDaysText()}
                      </div>
                    </div>

                    {/* START SERVER Button inside the box */}
                    <button
                      onClick={() => {
                        playBeep(440, 100);
                        setActiveTab('wingo1');
                        setSelectedGame('ninetyoneclub');
                        handleStartServer();
                      }}
                      className="w-[calc(100%+2rem)] -mx-4 -mb-4 py-4 px-6 border-t-2 border-[#ff1e27] hover:brightness-110 text-white font-black tracking-[0.2em] font-iceland uppercase text-[23px] sm:text-[25px] rounded-none transition-all duration-300 z-10 shadow-[0_-4px_18px_rgba(255,30,39,0.35)] hover:shadow-[0_-4px_28px_rgba(255,30,39,0.45)] cursor-pointer"
                      style={{
                        background: "linear-gradient(90deg, #7f0d11 0%, #ff1e27 50%, #7f0d11 100%)",
                        textShadow: "0px 1px 2px rgba(0,0,0,0.7)"
                      }}
                    >
                      START SERVER
                    </button>
                  </div>
                </div>

                {/* BDG WIN CARD - Golden cream cyber theme matching specifications */}
                <div 
                  className="w-full h-[270px] min-[360px]:h-[305px] min-[390px]:h-[325px] md:h-[370px] p-[2px] bg-gradient-to-br from-amber-900 via-[#F0D597]/60 to-amber-900 shadow-[0_12px_30px_rgba(0,0,0,0.65)] relative overflow-hidden z-10 transition-all duration-300 mt-2"
                  style={{
                    clipPath: "polygon(22px 0px, 100% 0px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0px 100%, 0px 22px)"
                  }}
                >
                  {/* Inner contain body matching the exact straight tech border layout with BDG Win theme */}
                  <div 
                    className="w-full h-full pt-1 px-4 pb-4 flex flex-col items-center justify-between relative overflow-hidden"
                    style={{
                      clipPath: "polygon(21px 0px, 100% 0px, 100% calc(100% - 21px), calc(100% - 21px) 100%, 0px 100%, 0px 21px)",
                      background: "linear-gradient(180deg, #451a03 0%, #F0D597 25%, #78350f 45%, #020617 70%, #000000 90%, #000000 100%)"
                    }}
                  >
                    {/* Glowing Cyber Synth backdrop effect */}
                    <div 
                      className="absolute inset-0 pointer-events-none z-0 opacity-40"
                      style={{
                        background: "radial-gradient(circle at top, rgba(240,213,151,0.4) 0%, rgba(120,53,15,0.2) 50%, transparent 80%)"
                      }}
                    />

                    {/* Centered top logo shifted higher for size */}
                    <div className="flex-1 flex items-start justify-center relative z-10 w-full pt-0 select-none -mt-11">
                      <img 
                        src="https://i.ibb.co/39CsYMZ4/Adobe-Express-file-7.png" 
                        alt="BDG Win Top Logo" 
                        className="h-[195px] min-[360px]:h-[230px] md:h-[270px] object-contain transition-all duration-500 hover:scale-105 filter drop-shadow-[0_8px_16px_rgba(240,213,151,0.45)] rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Side icon, "BDG WIN" text and REGISTER NOW button */}
                    <div className="absolute left-3 bottom-[102px] z-20 select-none flex items-center gap-3 min-[360px]:gap-4">
                      <img 
                        src="https://i.ibb.co/ksWPDHVB/IMG-20260611-194537.png" 
                        alt="BDG Win Side Icon" 
                        className="w-[50px] h-[50px] min-[360px]:w-[60px] min-[360px]:h-[60px] md:w-[70px] md:h-[70px] object-cover transition-all duration-300 hover:scale-110 filter drop-shadow-[0_4px_12px_rgba(240,213,151,0.5)] rounded-2xl border-2 border-[#F0D597]/65 shadow-[0_0_15px_rgba(240,213,151,0.3)]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col gap-1.5 -mt-1">
                        <span 
                          className="font-iceland font-bold tracking-wider text-[20px] min-[360px]:text-[24px] md:text-[28px] text-white select-none leading-none"
                          style={{
                            textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                          }}
                        >
                          BDG WIN
                        </span>
                        {/* REGISTER NOW button with custom slanted cut polygon shape */}
                        <a 
                          href="https://bdgwin.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="relative transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer w-[110px] min-[360px]:w-[130px] md:w-[150px] h-[22px] min-[360px]:h-[26px] md:h-[30px] group flex"
                        >
                          {/* Outer clipped border container */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-r from-[#F0D597] to-amber-400 transition-all duration-300 group-hover:brightness-125 shadow-[0_0_8px_rgba(240,213,151,0.35)]"
                            style={{
                              clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)"
                            }}
                          />
                          {/* Inner clipped background container */}
                          <div 
                            className="absolute inset-[1px] bg-black/85 flex items-center justify-start pl-2"
                            style={{
                              clipPath: "polygon(0 0, calc(100% - 1px) 0, calc(80% - 1px) 100%, 0 100%)"
                            }}
                          >
                            <span 
                              className="font-iceland font-bold tracking-wider text-[10px] min-[360px]:text-[12px] md:text-[14px] uppercase leading-none bg-gradient-to-r from-amber-400 to-[#F0D597] bg-clip-text text-transparent font-black"
                              style={{
                                filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.5))"
                              }}
                            >
                              REGISTER NOW
                            </span>
                          </div>
                        </a>
                      </div>
                    </div>

                    {/* Validity Days Box positioned tightly to the right side edge per user request */}
                    <div className="absolute right-1 min-[360px]:right-1.5 bottom-[78px] z-20 flex items-center select-none animate-fadeIn">
                      <div className="border border-[#F0D597]/35 bg-[#F0D597]/10 text-[#F0D597] rounded px-1.5 py-0.5 min-[360px]:px-2 min-[360px]:py-1 flex items-center justify-center font-bold font-iceland tracking-[0.08em] text-[10px] min-[360px]:text-[12px] md:text-xs shadow-[0_0_12px_rgba(240,213,151,0.15)]">
                        <span className="w-1 h-1 rounded-full bg-[#F0D597] animate-pulse mr-1" />
                        {getFormattedDaysText()}
                      </div>
                    </div>

                    {/* START SERVER Button inside the box */}
                    <button
                      onClick={() => {
                        playBeep(440, 100);
                        setActiveTab('wingo1');
                        setSelectedGame('bdgwin');
                        handleStartServer();
                      }}
                      className="w-[calc(100%+2rem)] -mx-4 -mb-4 py-4 px-6 border-t-2 border-[#F0D597] hover:brightness-110 text-white font-black tracking-[0.2em] font-iceland uppercase text-[23px] sm:text-[25px] rounded-none transition-all duration-300 z-10 shadow-[0_-4px_18px_rgba(240,213,151,0.35)] hover:shadow-[0_-4px_28px_rgba(240,213,151,0.45)] cursor-pointer"
                      style={{
                        background: "linear-gradient(90deg, #78350f 0%, #F0D597 50%, #78350f 100%)",
                        textShadow: "0px 1px 2px rgba(0,0,0,0.7)"
                      }}
                    >
                      START SERVER
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ACTION SECTION: Snappy cyber progress indicator when starting server */
              <div className="w-full relative z-10 mt-4">
                <div 
                  className="w-full p-[1.5px] relative overflow-hidden"
                  style={{
                    clipPath: "polygon(22px 0px, 100% 0px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0px 100%, 0px 22px)",
                    backgroundColor: st.borderColor,
                    boxShadow: selectedGame === 'eightytwolottery' ? "0 0 20px rgba(239,68,68,0.25)" : selectedGame === 'jalwagame' ? "0 0 20px rgba(97,218,204,0.3)" : selectedGame === 'tiranga' ? "0 0 20px rgba(100,149,237,0.3)" : selectedGame === 'fiftyonegame' ? "0 0 20px rgba(245,158,11,0.35)" : selectedGame === 'jaiclub' ? "0 0 20px rgba(77,203,255,0.4)" : selectedGame === 'goagame' ? "0 0 20px rgba(65,105,225,0.45)" : selectedGame === 'ninetyoneclub' ? "0 0 20px rgba(255,30,39,0.45)" : selectedGame === 'bdgwin' ? "0 0 20px rgba(240,213,151,0.45)" : "0 0 20px rgba(34,211,238,0.25)"
                  }}
                >
                  <div 
                    className="w-full p-4 flex flex-col gap-3 relative overflow-hidden"
                    style={{
                      clipPath: "polygon(21px 0px, 100% 0px, 100% calc(100% - 21px), calc(100% - 21px) 100%, 0px 100%, 0px 21px)",
                      backgroundColor: "#000000"
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs uppercase tracking-widest animate-pulse font-bold font-orbitron ${st.text}`}>
                        [STARTING DRAGO ENGINE SERVER] {serverProgress}%
                      </span>
                      <div className={`w-2 h-2 rounded-full animate-ping ${st.progressPing}`} />
                    </div>
                    
                    {/* Progress Line */}
                    <div className={`w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mb-1 border ${st.progressBarBorder}`}>
                      <div 
                        className={`h-full duration-75 transition-all ${st.progressBarFill}`}
                        style={{ width: `${serverProgress}%` }}
                      />
                    </div>
                    
                    {/* Status stream line */}
                    <div className={`text-[10px] font-mono tracking-widest text-center truncate italic ${st.textSoft}`}>
                      &gt;&gt; {startingStatusText}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* ACTIVE LIVE CALCULATOR AND PREDICTION SCREEN (isServerStarted === true) */
          <motion.div
            key="calculator"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col gap-3.5 select-none"
          >
            {/* Centered Game Logo - Medium scaled, upper center */}
            <div className="w-full flex justify-center mb-1 relative">
              {/* Soft circular radial background glow behind logo with vibrant pure neon green (#21F102) */}
              <div className="absolute inset-0 m-auto w-40 h-40 bg-[rgba(33,241,2,0.22)] blur-[50px] rounded-full pointer-events-none" />
              <img
                src="https://i.ibb.co/hFzW0Kt5/IMG-20260614-234731.png"
                alt="Game Logo"
                className="w-60 sm:w-72 h-auto object-contain drop-shadow-[0_0_28px_rgba(33,241,2,0.7)] relative z-10"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Wingo Sub-mode Selection Tabs (BIG/SMALL vs NUMBER) styled exactly like the capsule/cove style of the bottom bar */}
            <div id="wingo-submode-tabs" className="w-full bg-[#030704]/90 border border-emerald-500/20 rounded-full p-1 flex items-center justify-between font-black uppercase select-none shadow-[0_4px_15px_rgba(0,0,0,0.6)]">
              <button
                type="button"
                onClick={() => {
                  playBeep(450, 75);
                  setWingoSubMode('bigsmall');
                  setPredictionResult(null); // Clear recommendation so they can query fresh
                }}
                className={`flex-1 py-1.5 px-3 text-center rounded-full transition-all duration-300 font-extrabold uppercase tracking-wider font-mono text-xs whitespace-nowrap ${
                  wingoSubMode === 'bigsmall'
                    ? 'bg-white text-black shadow-[0_2px_8px_rgba(255,255,255,0.4)]'
                    : 'text-emerald-500/60 hover:text-emerald-400'
                }`}
              >
                BIG / SMALL
              </button>
              <button
                type="button"
                onClick={() => {
                  playBeep(450, 75);
                  setWingoSubMode('number');
                  setPredictionResult(null); // Clear recommendation so they can query fresh
                }}
                className={`flex-1 py-1.5 px-3 text-center rounded-full transition-all duration-300 font-extrabold uppercase tracking-wider font-mono text-xs whitespace-nowrap ${
                  wingoSubMode === 'number'
                    ? 'bg-white text-black shadow-[0_2px_8px_rgba(255,255,255,0.4)]'
                    : 'text-emerald-500/60 hover:text-emerald-400'
                }`}
              >
                NUMBER
              </button>
            </div>

            {/* Target Period & Clock styled with a beautiful cyber slant cut on the top-left and bottom-right corners */}
            <div id="target-period-timer" className="relative w-full filter drop-shadow-[0_4px_12px_rgba(33,241,2,0.15)] select-none">
              {/* Outer border container with top-left and bottom-right cut */}
              <div 
                className="w-full bg-gradient-to-r from-[#21F102] via-[#107801] to-[#075000]/60 p-[1px]"
                style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%, 0% 16px)' }}
              >
                {/* Inner main card container */}
                <div 
                  className="w-full bg-gradient-to-b from-[#0a200c] via-[#020d04] to-black py-4.5 pr-5 pl-7 flex items-center justify-between"
                  style={{ clipPath: 'polygon(15.5px 0%, 100% 0%, 100% calc(100% - 15.5px), calc(100% - 15.5px) 100%, 0% 100%, 0% 15.5px)' }}
                >
                  <div className="flex items-center">
                    <span className="text-white text-sm sm:text-base font-black font-mono tracking-[0.12em] leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                      {getFormattedPeriod()}
                    </span>
                  </div>
                  <div className="text-right flex items-center justify-end">
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-[#21F102] drop-shadow-[0_0_10px_rgba(33,241,2,0.65)] leading-none">
                      00:{String(wingoTimeLeft).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Vibrant neon glow top bar overlay following the top slant */}
              <div 
                className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-[#21F102] via-[#86efac] to-transparent"
                style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% 100%, 16px 100%)', left: '1px' }}
              />
            </div>

            {/* PAST RESULTS Section - Label and Panel grouped under one container with smaller gap and larger text */}
            <div className="w-full flex flex-col gap-1 -mt-1 select-none">
              <div className="w-full text-center">
                <span className="text-[13px] sm:text-[14.5px] font-mono font-black tracking-[0.24em] text-[#21F102] drop-shadow-[0_0_8px_rgba(33,241,2,0.65)] uppercase">
                  PAST RESULTS
                </span>
              </div>

              {/* Past Results balls styled with the matching cyber slant cut and glowing neon green outlines */}
              <div id="past-results-panel" className="relative w-full filter drop-shadow-[0_4px_12px_rgba(33,241,2,0.15)]">
                {/* Outer border container with top-left and bottom-right cut */}
                <div 
                  className="w-full bg-gradient-to-r from-[#21F102] via-[#107801] to-[#075000]/60 p-[1px]"
                  style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%, 0% 15.5px)' }}
                >
                  {/* Inner main card container */}
                  <div 
                    className="w-full bg-gradient-to-b from-[#0a200c] via-[#020d04] to-black py-3 flex items-center justify-center relative overflow-hidden"
                    style={{ clipPath: 'polygon(15.5px 0%, 100% 0%, 100% calc(100% - 15.5px), calc(100% - 15.5px) 100%, 0% 100%, 0% 15.5px)' }}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      {pastBalls.map((ball, idx) => {
                        let ballColors = "";
                        let glowStyle = "";
                        if (ball.type === 'green') {
                          ballColors = "from-emerald-400 via-emerald-500 to-emerald-700 border-emerald-400";
                          glowStyle = "shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                        } else if (ball.type === 'red') {
                          ballColors = "from-rose-500 via-red-600 to-red-800 border-rose-500";
                          glowStyle = "shadow-[0_0_8px_rgba(239,68,68,0.5)]";
                        } else if (ball.type === 'red-violet') {
                          ballColors = "from-rose-500 from-[50%] to-purple-600 to-[50%] border-purple-400";
                          glowStyle = "shadow-[0_0_8px_rgba(168,85,247,0.5)]";
                        } else {
                          ballColors = "from-emerald-500 from-[50%] to-purple-600 to-[50%] border-indigo-450";
                          glowStyle = "shadow-[0_0_8px_rgba(168,85,247,0.5)]";
                        }
                        return (
                          <div
                            key={idx}
                            className={`w-8 h-8 rounded relative flex items-center justify-center shrink-0 bg-gradient-to-br ${ballColors} ${glowStyle} border-2`}
                          >
                            <div className="absolute inset-0.5 rounded bg-gradient-to-tl from-transparent via-white/10 to-white/20 pointer-events-none" />
                            <div className="w-5.5 h-5.5 rounded bg-[#000]/15 flex items-center justify-center border border-white/10">
                              <span className="text-white text-xs font-black font-mono leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                                {ball.num}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Vibrant neon glow top bar overlay following the top slant */}
                <div 
                  className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-[#21F102] via-[#86efac] to-transparent"
                  style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% 100%, 16px 100%)', left: '1px' }}
                />
              </div>
            </div>

            {/* AI Recommendation Container with beautiful cyber slant cuts on the top-left and bottom-right corners matching the period header */}
            <div id="ai-recommendation-box" className="relative w-full filter drop-shadow-[0_4px_15px_rgba(33,241,2,0.18)] select-none">
              {/* Outer border container with top-left and bottom-right cut */}
              <div 
                className="w-full bg-gradient-to-r from-[#21F102] via-[#107801] to-[#075000]/60 p-[1.2px]"
                style={{ clipPath: 'polygon(18px 0%, 100% 0%, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0% 100%, 0% 18px)' }}
              >
                {/* Inner main card container */}
                <div 
                  className="w-full bg-gradient-to-b from-[#0a200c] via-[#020d04] to-black pt-3 pb-5 px-5 flex flex-col items-center"
                  style={{ clipPath: 'polygon(17.5px 0%, 100% 0%, 100% calc(100% - 17.5px), calc(100% - 17.5px) 100%, 0% 100%, 0% 17.5px)' }}
                >
                  <div className="w-full flex items-center justify-between border-b border-emerald-950/70 pb-3 mb-4">
                    <span className="text-[15.5px] font-iceland font-black tracking-[0.2em] text-[#21F102] drop-shadow-[0_0_8px_rgba(33,241,2,0.6)] uppercase">
                      AI RECOMMENDATION
                    </span>
                    <span className="text-[12px] font-iceland tracking-widest text-[#21F102] bg-emerald-950/50 border border-[#21F102]/30 px-2 py-0.5 rounded uppercase animate-pulse leading-none">
                      STABLE SEED-TCP
                    </span>
                  </div>

                  {/* Glowing 3D Glassy Sphere/Ball in center */}
                  <div className="my-3 flex flex-col items-center justify-center w-full">
                    {isScanning ? (
                      <div className="relative -mx-5 w-[calc(100%+2.5rem)] h-[230px] overflow-hidden flex flex-col items-center justify-center p-1 bg-transparent">
                        <div className="relative w-full h-full overflow-hidden flex items-center justify-center select-none">
                          {(() => {
                            const baseItems = (historyList && historyList.length > 0) ? historyList : [
                              { period: "202606161000", predictedNumber: 7, result: "BIG" },
                              { period: "202606160999", predictedNumber: 3, result: "SMALL" },
                              { period: "202606160998", predictedNumber: 8, result: "BIG" },
                              { period: "202606160997", predictedNumber: 1, result: "SMALL" },
                              { period: "202606160996", predictedNumber: 9, result: "BIG" }
                            ];
                            const cycleLength = 6;
                            const cycleItems = [];
                            while (cycleItems.length < cycleLength) {
                              cycleItems.push(...baseItems);
                            }
                            const baseCycle = cycleItems.slice(0, cycleLength);
                            const finalScanItems = [...baseCycle, ...baseCycle, ...baseCycle, ...baseCycle];

                            return (
                              <motion.div
                                initial={{ y: 0 }}
                                animate={{ y: -210 }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 1.2,
                                  ease: "linear"
                                }}
                                className="w-full flex flex-col"
                              >
                                {finalScanItems.map((record, i) => {
                                  const displayPeriod = (() => {
                                    if (!record || record.period === undefined || record.period === null) {
                                      return '00000';
                                    }
                                    const pStr = String(record.period);
                                    if (pStr.length > 10) {
                                      return pStr;
                                    }
                                    const today = new Date();
                                    const yyyy = today.getFullYear();
                                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                                    const dd = String(today.getDate()).padStart(2, '0');
                                    const val = pStr.replace(/\D/g, '');
                                    const indexStr = String(val).padStart(5, '0');
                                    return `${yyyy}${mm}${dd}10001${indexStr}`;
                                  })();
                                  
                                  const numVal = record.predictedNumber !== undefined 
                                    ? record.predictedNumber 
                                    : (record.result === 'BIG' ? 9 : 1);
                                  
                                  const sizeVal = record.result === 'MULTIPLIER' ? 'BIG' : record.result;
                                  const colVal = getNumberColorType(numVal);

                                  return (
                                    <div 
                                      key={i} 
                                      className="flex items-center justify-between h-[35px] px-[24px] text-[14.5px] sm:text-[16px] font-iceland text-white font-bold tracking-wider"
                                    >
                                      <span className="text-emerald-400 text-left min-w-[145px]">
                                        {displayPeriod}
                                      </span>
                                      
                                      <span className={`text-center ${
                                        colVal === 'red-violet' || colVal === 'red' ? 'text-rose-500' : 'text-emerald-400'
                                      }`}>
                                        {numVal}
                                      </span>

                                      <span className={`text-right min-w-[50px] ${
                                        sizeVal === 'BIG' ? 'text-amber-400' : 'text-rose-450'
                                      }`}>
                                        {sizeVal}
                                      </span>
                                    </div>
                                  );
                                })}
                              </motion.div>
                            );
                          })()}

                          {/* Extreme high speed sweep scan overlay */}
                          <motion.div 
                            className="absolute inset-x-0 h-[2.5px] bg-gradient-to-r from-[#21F102] via-[#7cff69] to-[#21F102] shadow-[0_0_15px_4px_#21F102] z-20 pointer-events-none"
                            initial={{ bottom: '0%' }}
                            animate={{ bottom: '100%' }}
                            transition={{
                              repeat: Infinity,
                              repeatType: "reverse",
                              duration: 1.0,
                              ease: "easeInOut"
                            }}
                          />
                        </div>
                      </div>
                    ) : predictionResult ? (
                      <motion.div
                        initial={{ scale: 0.88, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col items-center gap-3.5 w-full"
                      >
                        {wingoSubMode === 'number' ? (
                          (() => {
                            const recNum = predictionResult.predictedNumber !== undefined ? predictionResult.predictedNumber : 9;
                            const recColorType = getNumberColorType(recNum);
                            
                            let ballBgClass = "bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 shadow-[0_0_30px_rgba(16,185,129,0.55)] border-emerald-300";
                            if (recColorType === 'red') {
                              ballBgClass = "bg-gradient-to-br from-rose-500 via-red-650 to-red-800 shadow-[0_0_30px_rgba(239,68,68,0.55)] border-rose-300";
                            } else if (recColorType === 'red-violet') {
                              ballBgClass = "bg-gradient-to-br from-rose-500 via-purple-650 to-indigo-800 shadow-[0_0_30px_rgba(168,85,247,0.55)] border-purple-300";
                            } else if (recColorType === 'green-violet') {
                              ballBgClass = "bg-gradient-to-br from-emerald-400 via-purple-650 to-indigo-800 shadow-[0_0_30px_rgba(168,85,247,0.55)] border-purple-300";
                            }

                            return (
                              <>
                                <div className={`relative w-28 h-28 rounded-2xl flex items-center justify-center border-[3px] select-none ${ballBgClass}`}>
                                  {/* Glare reflect overlay */}
                                  <div className="absolute inset-1.5 rounded-xl bg-gradient-to-tl from-transparent via-white/10 to-white/30 pointer-events-none" />
                                  <div className="w-20 h-20 rounded-xl border border-white/25 bg-[#000]/10 flex items-center justify-center">
                                    <span className="text-white text-5xl font-black font-iceland tracking-normal drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                                      {recNum}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[20px] sm:text-[22px] font-black tracking-widest uppercase font-iceland leading-none mt-1.5 text-white">
                                  <span className={
                                    recColorType === 'red-violet' ? 'bg-gradient-to-r from-rose-500 to-purple-400 bg-clip-text text-transparent font-black inline-block' :
                                    recColorType === 'green-violet' ? 'bg-gradient-to-r from-emerald-500 to-purple-400 bg-clip-text text-transparent font-black inline-block' :
                                    recColorType === 'red' ? 'text-rose-500' : 'text-[#22c55e]'
                                  }>NUMBER {predictionResult.predictedNumber}</span>
                                </span>
                              </>
                            );
                          })()
                        ) : (
                          <>
                            <div className={`relative w-[120px] h-[120px] rounded-2xl flex items-center justify-center border-4 select-none ${
                              predictionResult.result === 'BIG' 
                                ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.55)]' 
                                : 'bg-gradient-to-br from-rose-500 via-red-650 to-red-800 border-rose-450 shadow-[0_0_25px_rgba(239,68,68,0.55)]'
                            }`}>
                              <div className="absolute inset-1.5 rounded-xl bg-gradient-to-tl from-transparent via-white/25 to-white/35 pointer-events-none" />
                              <span className="text-white text-3xl font-black font-iceland tracking-widest uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] leading-none">
                                {predictionResult.result}
                              </span>
                            </div>
                            <span className={`text-[20px] sm:text-[22px] font-black tracking-widest uppercase mt-1.5 font-iceland leading-none ${
                              predictionResult.result === 'BIG' ? 'text-emerald-400 animate-pulse' : 'text-red-400 animate-pulse'
                            }`}>
                              {predictionResult.result}
                            </span>
                          </>
                        )}
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center gap-3.5 py-3 select-none">
                        <motion.img 
                          src="https://i.ibb.co/CTnm54Q/54852.png" 
                          alt="Ready" 
                          referrerPolicy="no-referrer"
                          className="w-24 h-24 sm:w-26 sm:h-26 object-contain"
                          animate={{
                            scale: [1, 1.08, 1],
                            y: [0, -4, 0],
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vibrant neon glow top bar overlay following the top slant */}
              <div 
                className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-[#21F102] via-[#86efac] to-transparent"
                style={{ clipPath: 'polygon(18px 0%, 100% 0%, 100% 100%, 18px 100%)', left: '1px' }}
              />
            </div>

            {/* Giant GET PREDICTION button styled exactly like Past Results box */}
            <div id="get-prediction-btn-box" className="relative w-full filter drop-shadow-[0_4px_15px_rgba(33,241,2,0.35)] select-none transition-all duration-300 hover:scale-[1.01]">
              {/* Outer border container with top-left and bottom-right cut */}
              <div 
                className="w-full bg-gradient-to-r from-[#21F102] via-[#107801] to-[#075000]/60 p-[1.2px] transition-all duration-200"
                style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%, 0% 15.5px)' }}
              >
                <button
                  onClick={handleWingoPredictionClick}
                  disabled={isScanning || lastPredictedPeriodIndex === liveAutoPeriod}
                  className="w-full bg-gradient-to-r from-[#21F102] via-[#1bb303] to-[#107801] hover:brightness-110 active:brightness-90 disabled:opacity-40 text-black font-black uppercase py-4.5 tracking-[0.2em] text-[15px] sm:text-[16px] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer select-none font-mono border-none outline-none relative"
                  style={{ clipPath: 'polygon(15.5px 0%, 100% 0%, 100% calc(100% - 15.5px), calc(100% - 15.5px) 100%, 0% 100%, 0% 15.5px)' }}
                >
                  {lastPredictedPeriodIndex === liveAutoPeriod ? "WAIT FOR NEXT PERIOD" : "GET PREDICTION"}
                </button>
              </div>
              
              {/* Vibrant neon glow top bar overlay following the top slant */}
              <div 
                className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-[#21F102] via-[#86efac] to-transparent pointer-events-none"
                style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% 100%, 16px 100%)', left: '1px' }}
              />
            </div>

            {/* Records Section exactly like screenshot - with reduced gaps */}
            <div className="w-full flex items-center justify-between -mt-1.5 -mb-1 select-none">
              <div className="h-[1px] flex-1 bg-emerald-500/15" />
              <span className="text-[10px] font-mono font-black tracking-[0.25em] text-[#22c55e] uppercase px-4 leading-none">
                RECORDS
              </span>
              <div className="h-[1px] flex-1 bg-emerald-500/15" />
            </div>

            {/* Records panel styled with the matching cyber slant cut and glowing neon green outlines */}
            <div id="records-table-panel" className="relative w-full filter drop-shadow-[0_4px_15px_rgba(33,241,2,0.15)] -mt-1 select-none">
              {/* Outer border container with top-left and bottom-right cut */}
              <div 
                className="w-full bg-gradient-to-r from-[#21F102] via-[#107801] to-[#075000]/60 p-[1.2px]"
                style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%, 0% 15.5px)' }}
              >
                <div 
                  className="w-full bg-gradient-to-b from-[#021303] via-[#010902] to-black p-3.5 relative overflow-hidden"
                  style={{ clipPath: 'polygon(15.5px 0%, 100% 0%, 100% calc(100% - 15.5px), calc(100% - 15.5px) 100%, 0% 100%, 0% 15.5px)' }}
                >
                  <div className="w-full overflow-x-auto relative z-10">
                    <table className="w-full table-auto border-collapse text-left">
                      <thead>
                        <tr className="border-b border-emerald-900/30 pb-2">
                          <th className="text-[11px] uppercase tracking-wider text-[#22c55e]/70 font-black font-mono py-1.5 pl-1">
                            PERIOD
                          </th>
                          <th className="text-[11px] uppercase tracking-wider text-[#22c55e]/70 font-black font-mono py-1.5 text-center">
                            NUMBER
                          </th>
                          <th className="text-[11px] uppercase tracking-wider text-[#22c55e]/70 font-black font-mono py-1.5 text-center">
                            SIZE
                          </th>
                          <th className="text-[11px] uppercase tracking-wider text-[#22c55e]/70 font-black font-mono py-1.5 pr-1 text-right">
                            COLOR
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyList.slice(0, 10).map((record) => {
                          const displayPeriod = (() => {
                            if (!record || record.period === undefined || record.period === null) {
                              return '00000';
                            }
                            const pStr = String(record.period);
                            if (pStr.length > 10) {
                              return pStr;
                            }
                            const today = new Date();
                            const yyyy = today.getFullYear();
                            const mm = String(today.getMonth() + 1).padStart(2, '0');
                            const dd = String(today.getDate()).padStart(2, '0');
                            const val = pStr.replace(/\D/g, '');
                            const indexStr = String(val).padStart(5, '0');
                            return `${yyyy}${mm}${dd}10001${indexStr}`;
                          })();
                          
                          const numVal = record.predictedNumber !== undefined 
                            ? record.predictedNumber 
                            : (record.result === 'BIG' ? 9 : 1);
                          
                          const sizeVal = record.result === 'MULTIPLIER' ? 'BIG' : record.result;
                          
                          // Precise match with ball colors: Violet for 0/5, Red for even, Green for odd
                          const colVal = getNumberColorType(numVal);
                          
                          return (
                            <tr 
                              key={record.id} 
                              className="border-b border-emerald-950/30 hover:bg-emerald-950/10 transition-colors duration-200 font-mono text-[11.5px] sm:text-[13.5px]"
                            >
                              <td className="py-2.5 font-bold text-white pl-1 select-all">
                                {displayPeriod}
                              </td>
                              <td className="py-2.5 text-[15.5px] sm:text-[16.5px] font-extrabold text-center">
                                <span className={
                                  colVal === 'red-violet' ? 'bg-gradient-to-r from-rose-500 to-purple-400 bg-clip-text text-transparent font-black inline-block' :
                                  colVal === 'green-violet' ? 'bg-gradient-to-r from-[#22c55e] to-purple-400 bg-clip-text text-transparent font-black inline-block' :
                                  colVal === 'red' ? 'text-rose-500 font-extrabold' : 'text-[#22c55e] font-extrabold'
                                }>
                                  {numVal}
                                </span>
                              </td>
                              <td className={`py-2.5 text-[13px] sm:text-[14px] font-extrabold text-center ${
                                sizeVal === 'BIG' ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {sizeVal}
                              </td>
                              <td className="py-2.5 text-right pr-1">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className={`w-3.5 h-3.5 rounded-full inline-block ${
                                    colVal === 'red-violet' ? 'bg-gradient-to-r from-rose-500 from-[50%] to-purple-500 to-[50%] shadow-[0_0_6px_rgba(239,68,68,0.6)]' :
                                    colVal === 'green-violet' ? 'bg-gradient-to-r from-emerald-500 from-[50%] to-purple-500 to-[50%] shadow-[0_0_6px_rgba(16,185,129,0.6)]' :
                                    colVal === 'red' ? 'bg-rose-500 text-rose-500 shadow-[0_0_6px_#f43f5e]' : 
                                    'bg-emerald-500 text-emerald-500 shadow-[0_0_6px_#10b981]'
                                  }`} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Vibrant neon glow top bar overlay following the top slant */}
              <div 
                className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-[#21F102] via-[#86efac] to-transparent pointer-events-none"
                style={{ clipPath: 'polygon(16px 0%, 100% 0%, 100% 100%, 16px 100%)', left: '1px' }}
              />
            </div>

            {/* TG channel support */}
            <a
              href="https://t.me/+uu1UAjycgzNjNjZl"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl overflow-hidden border border-emerald-900/30 bg-[#030704] p-4 flex items-center justify-between transition-all duration-300 hover:border-[#22c55e]/50 mt-2"
            >
              <div className="absolute inset-0 bg-transparent opacity-40 rounded-full -translate-y-12 shrink-0 pointer-events-none" />
              <div className="z-10 text-left">
                <span className="text-xs uppercase tracking-widest font-black flex items-center gap-1.5 mb-1 text-white select-none">
                  <Zap className="w-3.5 h-3.5 animate-pulse text-[#22c55e]" />
                  Join Community Channel
                </span>
                <p className="text-[10px] uppercase tracking-wider font-mono text-[#22c55e]/50 select-none">
                  Get premium signals on Telegram!
                </p>
              </div>

              <div className="w-8 h-8 rounded-full border border-emerald-500/20 bg-emerald-950/20 text-[#22c55e] flex items-center justify-center transition-all duration-300 group-hover:scale-110 select-none z-10 font-sans">
                <Send className="w-4 h-4 animate-pulse" />
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
