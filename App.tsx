import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import CyberGrid from './components/CyberGrid';
import WelcomeScreen from './components/WelcomeScreen';
import AccessKeyScreen from './components/AccessKeyScreen';
import PredictorScreen from './components/PredictorScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'accessKey' | 'predictor'>('welcome');
  const [isEstimatorLive, setIsEstimatorLive] = useState(false);

  return (
    <div className={`relative min-h-screen ${isEstimatorLive ? "bg-gradient-to-b from-[#051c09] via-black to-black" : "bg-[#02020a]"} overflow-x-hidden text-white flex flex-col`}>
      {/* Dynamic green ambient light overlays across the entire screen when Estimator is Live */}
      {isEstimatorLive && (
        <>
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-[#21F102]/25 blur-[120px] pointer-events-none z-0 scale-110 animate-pulse" style={{ animationDuration: '5s' }} />
          <div className="absolute top-[20%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#21F102]/18 blur-[100px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[5%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#075000]/35 blur-[110px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '10s' }} />
          {/* Subtle gradient banner backdrop */}
          <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-[#21F102]/10 to-transparent pointer-events-none z-0" />
        </>
      )}

      {/* Cyber animated playground background on all screens except when estimator is live */}
      {!isEstimatorLive && <CyberGrid />}

      {/* Screen container with transition animations */}
      <div className="relative z-10 flex-1 flex flex-col w-full h-full">
        <AnimatePresence mode="wait">
          {currentScreen === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="flex-1 flex flex-col w-full"
            >
              <WelcomeScreen onStart={() => {
                setCurrentScreen('accessKey');
              }} />
            </motion.div>
          )}

          {currentScreen === 'accessKey' && (
            <motion.div
              key="accessKey"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex-1 flex flex-col w-full items-center justify-center"
            >
              <AccessKeyScreen 
                onVerifySuccess={() => setCurrentScreen('predictor')} 
                onBack={() => setCurrentScreen('welcome')} 
              />
            </motion.div>
          )}

          {currentScreen === 'predictor' && (
            <motion.div
              key="predictor"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="flex-1 flex flex-col w-full"
            >
              <PredictorScreen 
                onBack={() => {
                  setIsEstimatorLive(false);
                  setCurrentScreen('accessKey');
                }} 
                onServerStateChange={(started) => setIsEstimatorLive(started)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
