/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ReactNode, useEffect } from 'react';
import { Home, LineChart, Settings, HeartPulse, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType } from './types';
import { useData } from './hooks/useData';
import { HomeTab } from './components/HomeTab';
import { TrendsTab } from './components/TrendsTab';
import { HealthTab } from './components/HealthTab';
import { SettingsTab } from './components/SettingsTab';

export default function App() {
  const { records, settings, addRecord, updateSettings, resetData, deleteRecord, importData, isLoaded } = useData();
  const [activeTab, setActiveTab] = useState<TabType>('home');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'graphite');
  }, [settings.theme]);

  if (!isLoaded) {
    return <div className="min-h-screen bg-app-bg flex items-center justify-center font-sans tracking-widest text-text-muted font-bold">载入中...</div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab records={records} settings={settings} onAddRecord={addRecord} onDeleteRecord={deleteRecord} />;
      case 'trends':
        return <TrendsTab records={records} settings={settings} />;
      case 'health':
        return <HealthTab records={records} settings={settings} />;
      case 'settings':
        return <SettingsTab records={records} settings={settings} updateSettings={updateSettings} resetData={resetData} importData={importData} />;
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex justify-center font-sans">
      <div className="w-full max-w-md bg-card-bg h-[100dvh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Top Header */}
        <header className="px-6 py-4 flex flex-col justify-center border-b border-brand-light bg-card-bg/90 backdrop-blur-md z-20 shrink-0 h-16">
          <div className="flex items-center space-x-2">
            <motion.div 
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              className="bg-brand-main p-1.5 rounded-xl text-white shadow-md shadow-brand-dark/20"
            >
               <Zap className="h-5 w-5 fill-white stroke-white" />
            </motion.div>
            <h1 className="text-xl font-black text-text-main tracking-tight flex items-center">
              练了么 <span className="ml-2 text-[10px] font-black bg-brand-light text-brand-main px-2 py-1 rounded-md tracking-wider">PRO</span>
            </h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative bg-app-bg">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="border-t border-brand-light bg-card-bg px-6 py-2 pb-safe z-20 shrink-0 min-h-[5rem] shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.1)]">
          <div className="flex justify-between items-center h-full">
            <NavItem 
              icon={<Home size={24} strokeWidth={2.5} />} 
              label="记录" 
              isActive={activeTab === 'home'} 
              onClick={() => setActiveTab('home')} 
            />
            <NavItem 
              icon={<LineChart size={24} strokeWidth={2.5} />} 
              label="趋势" 
              isActive={activeTab === 'trends'} 
              onClick={() => setActiveTab('trends')} 
            />
            <NavItem 
              icon={<HeartPulse size={24} strokeWidth={2.5} />} 
              label="体能" 
              isActive={activeTab === 'health'} 
              onClick={() => setActiveTab('health')} 
            />
            <NavItem 
              icon={<Settings size={24} strokeWidth={2.5} />} 
              label="设置" 
              isActive={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
            />
          </div>
        </nav>

      </div>
    </div>
  );
}

// NavItem Component
function NavItem({ icon, label, isActive, onClick }: { icon: ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 h-12 relative transition-colors ${isActive ? 'text-brand-main' : 'text-text-muted hover:text-text-main'}`}
    >
      <motion.div
        animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -2 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {icon}
      </motion.div>
      <span className={`text-[10px] mt-1.5 font-bold transition-all ${isActive ? 'opacity-100' : 'opacity-0 translate-y-1 absolute'}`}>
        {label}
      </span>
      {isActive && (
        <motion.div 
          layoutId="nav-indicator-fitness"
          className="absolute -top-4 w-8 h-1 bg-brand-main rounded-b-full shadow-[0_2px_8px_rgba(var(--brand-main),0.5)]"
        />
      )}
    </button>
  );
}


