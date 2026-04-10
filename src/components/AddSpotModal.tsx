import React, { useState } from 'react';
import { Spot } from '../data/spots';

interface AddSpotModalProps {
  onClose: () => void;
  onAdd: (spot: Spot) => void;
}

const AddSpotModal: React.FC<AddSpotModalProps> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [mapsLink, setMapsLink] = useState('');
  const [lat, setLat] = useState<number | ''>('');
  const [lng, setLng] = useState<number | ''>('');
  const [tiefe, setTiefe] = useState('3-5 m');
  const [bootNotig, setBootNotig] = useState(false);

  // Simple coordinate extraction from Google Maps URL
  const handleLinkChange = (url: string) => {
    setMapsLink(url);
    // Regex for: @lat,lng or place/lat,lng
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || lat === '' || lng === '') return;

    const newSpot: Spot = {
      id: `user-${Date.now()}`,
      name,
      beschreibung: 'Benutzerdefinierter Spot.',
      lat: Number(lat),
      lng: Number(lng),
      tiefe,
      bestePhase: 'alle',
      windtoleranz: 30,
      bootNötig: bootNotig,
      uferAngling: !bootNotig,
      struktur: ['Kante', 'Unbekannt'],
      trübungsPräferenz: 'mittel',
      temperaturMin: 5,
      jahreszeitBonus: { frühling: 5, sommer: 5, herbst: 10, winter: 5 },
      taktik: 'Eigener Spot. Probiere verschiedene Köder aus.',
      koderTipp: 'Noch keine Empfehlung hinterlegt.'
    };

    onAdd(newSpot);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter">Neuen Spot hinzufügen</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Name des Spots</label>
            <input 
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              placeholder="z.B. Mein Geheimplatz Elbe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Google Maps Link (automatisch)</label>
            <input 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-xs"
              placeholder="Link hier einfügen..."
              value={mapsLink}
              onChange={(e) => handleLinkChange(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Breitengrad (Lat)</label>
              <input 
                required
                type="number" step="any"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none text-sm"
                value={lat}
                onChange={(e) => setLat(e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Längengrad (Lng)</label>
              <input 
                required
                type="number" step="any"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none text-sm"
                value={lng}
                onChange={(e) => setLng(e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tiefe</label>
              <select 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none text-sm"
                value={tiefe}
                onChange={(e) => setTiefe(e.target.value)}
              >
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
                <span className="text-lg">{bootNotig ? '🚤' : '🎣'}</span>
                <span className="text-xs font-bold">{bootNotig ? 'JA' : 'NEIN'}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold uppercase tracking-tight text-xs transition-colors"
            >
              Abbrechen
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-tight text-xs transition-all shadow-lg shadow-blue-900/40"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSpotModal;
