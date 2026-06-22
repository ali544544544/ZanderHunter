import React, { useState } from 'react';
import { Spot } from '../data/spots';
import type { UserSpotSaveResult } from '../hooks/useUserSpots';

interface AddSpotModalProps {
  onClose: () => void;
  onAdd: (spot: Spot) => void | UserSpotSaveResult | Promise<void | UserSpotSaveResult>;
  spotCount?: number;
  spotLimit?: number;
  accountEmail?: string | null;
}

const AddSpotModal: React.FC<AddSpotModalProps> = ({ onClose, onAdd, spotCount = 0, spotLimit = 5, accountEmail = null }) => {
  const [name, setName] = useState('');
  const [mapsLink, setMapsLink] = useState('');
  const [lat, setLat] = useState<number | ''>('');
  const [lng, setLng] = useState<number | ''>('');
  const [tiefe, setTiefe] = useState('3-5 m');
  const [bootNotig, setBootNotig] = useState(false);
  const [spotType, setSpotType] = useState<'elbe' | 'hafen' | 'kanal'>('elbe');
  const [isExposed, setIsExposed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple coordinate extraction from Google Maps URL
  const handleLinkChange = (url: string) => {
    setMapsLink(url);
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = url.match(regex);
    if (match) {
      setLat(parseFloat(match[1]));
      setLng(parseFloat(match[2]));
    } else {
      const regexPlace = /place\/(-?\d+\.\d+),(-?\d+\.\d+)/;
      const matchPlace = url.match(regexPlace);
      if (matchPlace) {
        setLat(parseFloat(matchPlace[1]));
        setLng(parseFloat(matchPlace[2]));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || lat === '' || lng === '') return;
    if (spotCount >= spotLimit) {
      setError(`Maximal ${spotLimit} Spots speicherbar.`);
      return;
    }

    const newSpot: Spot = {
      id: `user-${Date.now()}`,
      name,
      beschreibung: `${spotType === 'hafen' ? 'Hafen-Spot' : spotType === 'kanal' ? 'Kanal-Spot' : 'Elb-Spot'}. Individuell angelegt.`,
      lat: Number(lat),
      lng: Number(lng),
      tiefe,
      bestePhase: 'alle',
      windtoleranz: spotType === 'hafen' ? 45 : 30, // Default tolerance based on type
      bootNötig: bootNotig,
      uferAngling: !bootNotig,
      struktur: [spotType === 'hafen' ? 'Spundwand' : 'Kante'],
      trübungsPräferenz: 'mittel',
      temperaturMin: 5,
      jahreszeitBonus: { frühling: 5, sommer: 5, herbst: 10, winter: 5 },
      taktik: '', // Will be dynamic
      koderTipp: '', // Will be dynamic
      type: spotType,
      isWindExposed: isExposed
    };

    setSaving(true);
    setError(null);

    try {
      const result = await onAdd(newSpot);
      if (result && !result.ok) {
        setError(result.message || 'Spot konnte nicht gespeichert werden.');
        return;
      }
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Spot konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Neuen Spot hinzufügen</h3>
        
        <div className="mb-6 flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {spotCount}/{spotLimit} Spots {accountEmail ? `- ${accountEmail}` : '- lokal'}
          </p>
          <span className="rounded-md border border-slate-700 px-2 py-1 text-[10px] font-black text-slate-300">
            max {spotLimit}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Name des Spots</label>
            <input 
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              placeholder="Name des Spots..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Google Maps Link</label>
            <input 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-xs"
              placeholder="https://www.google.com/maps/..."
              value={mapsLink}
              onChange={(e) => handleLinkChange(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Spot-Typ</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none text-sm"
                value={spotType}
                onChange={(e) => setSpotType(e.target.value as any)}
              >
                <option value="elbe">Elbe-Strom</option>
                <option value="hafen">Hafenbecken</option>
                <option value="kanal">Kanal/Nebengewässer</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Wind-Exposure</label>
              <div 
                onClick={() => setIsExposed(!isExposed)}
                className={`w-full flex items-center justify-center space-x-2 rounded-xl px-4 py-3 cursor-pointer border transition-all ${isExposed ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-green-500/20 border-green-500 text-green-400'}`}
              >
                <span className="text-xs font-bold uppercase">{isExposed ? 'Exponiert 💨' : 'Geschützt 🛡️'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Breitengrad (Lat)</label>
              <input required type="number" step="any" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none text-sm" value={lat} onChange={(e) => setLat(e.target.value === '' ? '' : parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Längengrad (Lng)</label>
              <input required type="number" step="any" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none text-sm" value={lng} onChange={(e) => setLng(e.target.value === '' ? '' : parseFloat(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tiefe</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none text-sm" value={tiefe} onChange={(e) => setTiefe(e.target.value)}>
                <option>2-4 m</option>
                <option>3-6 m</option>
                <option>5-10 m</option>
                <option>10+ m</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Boot nötig?</label>
              <div 
                onClick={() => setBootNotig(!bootNotig)}
                className={`w-full flex items-center justify-center space-x-2 rounded-xl px-4 py-3 cursor-pointer border transition-all ${bootNotig ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
              >
                <span className="text-xs font-bold">{bootNotig ? 'BOOT 🚤' : 'UFER 🎣'}</span>
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-200">
              {error}
            </p>
          )}

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold uppercase tracking-tight text-xs transition-colors">Abbrechen</button>
            <button type="submit" disabled={saving || spotCount >= spotLimit} className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-tight text-xs transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50">
              {saving ? 'Speichere...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSpotModal;
