import React, { useState } from 'react';
import { useForecast } from '../hooks/useForecast';
import type { Spot } from '../data/spots';
import type { TargetFish } from '../utils/calculations';

interface ForecastViewProps {
  spots: Spot[];
  initialSpot: Spot | null;
  targetFish?: TargetFish;
}

const ForecastView: React.FC<ForecastViewProps> = ({ spots, initialSpot, targetFish = 'zander' }) => {
  const selectedSpot = initialSpot || spots[0];
  const { forecast, loading, error } = useForecast(selectedSpot.lat, selectedSpot.lng, targetFish);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const fishLabel = targetFish === 'hecht' ? 'Hecht' : targetFish === 'barsch' ? 'Barsch' : 'Zander';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Berechne Vorhersage...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center px-1">
        <div>
          <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm">7-Tage Vorhersage {fishLabel}</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Berechnet für: {selectedSpot.name}</p>
        </div>
        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
          Lokal: {forecast[0]?.tideOffset > 0 ? `+${forecast[0]?.tideOffset}` : forecast[0]?.tideOffset} min
        </span>
      </div>

      {error || forecast.length === 0 ? (
        <div className="p-8 text-center text-red-400 bg-red-400/5 rounded-2xl border border-red-400/20">
          Vorhersage aktuell nicht verfügbar.
        </div>
      ) : (
        <>
          {/* Date Strip */}
          <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide px-1">
            {forecast.map((day, idx) => (
              <button
                key={day.date.toISOString()}
                onClick={() => setSelectedDayIdx(idx)}
                className={`flex-shrink-0 w-16 p-2 rounded-2xl border transition-all flex flex-col items-center space-y-1 ${
                  selectedDayIdx === idx 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="text-[10px] font-bold uppercase">{day.date.toLocaleDateString('de-DE', { weekday: 'short' })}</span>
                <span className="text-lg font-black">{day.date.getDate()}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${day.score >= 70 ? 'bg-angel-green' : day.score >= 50 ? 'bg-angel-light' : 'bg-angel-yellow'}`}></div>
              </button>
            ))}
          </div>

          {/* Day Details */}
          <div className="card space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-white">{forecast[selectedDayIdx].date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })}</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">Prognose Angel-Index</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-black ${forecast[selectedDayIdx].score >= 70 ? 'text-angel-green' : forecast[selectedDayIdx].score >= 50 ? 'text-angel-light' : 'text-angel-yellow'}`}>
                  {forecast[selectedDayIdx].score}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Wetter</span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Max Temp</span>
                    <span className="text-white font-bold">{forecast[selectedDayIdx].weather.tempMax.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Wind</span>
                    <span className="text-white font-bold">{forecast[selectedDayIdx].weather.windSpeedMax.toFixed(0)} km/h</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Regen</span>
                    <span className="text-blue-400 font-bold">{forecast[selectedDayIdx].weather.precipSum.toFixed(1)} mm</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Astronomie</span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Mond</span>
                    <span className="text-white font-bold">{forecast[selectedDayIdx].moonPhase.icon} {forecast[selectedDayIdx].moonPhase.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Solunar</span>
                    <span className={`font-bold ${forecast[selectedDayIdx].solunar === 'major' ? 'text-green-400' : 'text-slate-300'}`}>
                      {forecast[selectedDayIdx].solunar.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Helligkeit</span>
                    <span className="text-white font-bold">{forecast[selectedDayIdx].moonPhase.illumination}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Gezeiten (Lokal)</span>
              <div className="flex space-x-4">
                {forecast[selectedDayIdx].tideEvents.map((t, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${t.type === 'HW' ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                      {t.type}
                    </span>
                    <span className="text-xs text-slate-200 font-mono">
                      {new Date(t.time.getTime() + (forecast[selectedDayIdx].tideOffset * 60000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ForecastView;
