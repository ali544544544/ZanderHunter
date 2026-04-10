import React, { useState, useEffect } from 'react';

interface DataStatusProps {
  lastUpdated: Date | null;
}

const DataStatus: React.FC<DataStatusProps> = ({ lastUpdated }) => {
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    // Reset timer when lastUpdated changes (meaning a fresh fetch happened)
    if (lastUpdated) {
      setTimeLeft(15 * 60);
    }
  }, [lastUpdated]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev: number) => (prev > 0 ? prev - 1 : 15 * 60));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedLastUpdate = lastUpdated 
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-700/50 px-4 py-1.5 flex justify-between items-center z-[60] animate-in slide-in-from-bottom duration-500 shadow-2xl">
      <div className="flex items-center space-x-2">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        <span className="text-[9px] text-slate-200 font-bold uppercase tracking-wider">
          {formattedLastUpdate}
        </span>
      </div>

      <div className="flex items-center space-x-3">
        <div className="text-[9px] text-blue-400 font-mono font-bold uppercase tracking-wider">
          {formatTime(timeLeft)}
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="bg-slate-800 hover:bg-slate-700 p-1 rounded-md transition-all border border-slate-700 active:scale-95 translate-y-[1px]"
          title="Daten manuell aktualisieren"
        >
          <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DataStatus;
