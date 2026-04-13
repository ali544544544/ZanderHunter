import React, { useMemo } from 'react';

interface DailyForecastChartProps {
  hourlyScores: number[];
  sunrise?: string;  // ISO time string
  sunset?: string;   // ISO time string
}

const DailyForecastChart: React.FC<DailyForecastChartProps> = ({ hourlyScores, sunrise, sunset }) => {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const sunriseHour = useMemo(() => {
    if (!sunrise) return 6;
    const d = new Date(sunrise);
    return d.getHours() + d.getMinutes() / 60;
  }, [sunrise]);

  const sunsetHour = useMemo(() => {
    if (!sunset) return 20;
    const d = new Date(sunset);
    return d.getHours() + d.getMinutes() / 60;
  }, [sunset]);

  // Chart dimensions
  const W = 360;
  const H = 160;
  const padX = 28;
  const padTop = 16;
  const padBot = 28;
  const chartW = W - padX * 2;
  const chartH = H - padTop - padBot;

  // Map hour index to x
  const x = (hour: number) => padX + (hour / 23) * chartW;
  // Map score to y (inverted)
  const y = (score: number) => padTop + chartH - (score / 100) * chartH;

  // Build smooth path using cardinal spline interpolation
  const points = hourlyScores.map((s, i) => ({ x: x(i), y: y(s) }));

  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    const tension = 0.3;
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const linePath = buildSmoothPath(points);
  const areaPath = linePath + ` L ${points[points.length - 1].x},${padTop + chartH} L ${points[0].x},${padTop + chartH} Z`;

  // Current hour interpolated position
  const floorH = Math.floor(currentHour);
  const fracH = currentHour - floorH;
  const currentScore = floorH < 23
    ? hourlyScores[floorH] + (hourlyScores[floorH + 1] - hourlyScores[floorH]) * fracH
    : hourlyScores[23];
  const curX = x(currentHour);
  const curY = y(currentScore);

  // Color for score
  const scoreColor = (s: number) => {
    if (s >= 75) return '#22c55e';
    if (s >= 55) return '#84cc16';
    if (s >= 40) return '#f59e0b';
    return '#ef4444';
  };

  // Best hour
  const bestHour = hourlyScores.indexOf(Math.max(...hourlyScores));
  const bestScore = hourlyScores[bestHour];

  // X-axis labels: show every 3 hours
  const xLabels = [0, 3, 6, 9, 12, 15, 18, 21];

  // Score zone thresholds
  const zones = [
    { threshold: 75, color: '#22c55e', opacity: 0.04 },
    { threshold: 55, color: '#84cc16', opacity: 0.04 },
    { threshold: 40, color: '#f59e0b', opacity: 0.04 },
  ];

  return (
    <div className="card space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm">24h Forecast</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Stündlicher Angel-Index</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-[10px] text-slate-500 font-mono">JETZT: {Math.round(currentScore)}%</span>
          </div>
        </div>
      </div>

      {/* Best hour callout */}
      <div className="flex items-center space-x-2 bg-slate-950/40 rounded-xl px-3 py-2 border border-slate-800/50">
        <span className="text-lg">🎯</span>
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Beste Stunde heute</span>
          <p className="text-sm font-bold" style={{ color: scoreColor(bestScore) }}>
            {bestHour}:00 Uhr — {bestScore}%
          </p>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'auto' }}>
          <defs>
            {/* Main gradient for the area fill */}
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
            {/* Line gradient based on score values */}
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              {hourlyScores.map((s, i) => (
                <stop key={i} offset={`${(i / 23) * 100}%`} stopColor={scoreColor(s)} />
              ))}
            </linearGradient>
            {/* Glow filter for the current dot */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Night gradient overlay */}
            <linearGradient id="nightGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.5" />
              <stop offset={`${(sunriseHour / 24) * 100}%`} stopColor="#0f172a" stopOpacity="0.5" />
              <stop offset={`${((sunriseHour + 0.5) / 24) * 100}%`} stopColor="#0f172a" stopOpacity="0" />
              <stop offset={`${((sunsetHour - 0.5) / 24) * 100}%`} stopColor="#0f172a" stopOpacity="0" />
              <stop offset={`${(sunsetHour / 24) * 100}%`} stopColor="#0f172a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Score zone backgrounds */}
          {zones.map((zone, idx) => (
            <rect
              key={idx}
              x={padX}
              y={y(zone.threshold === 75 ? 100 : zones[idx - 1]?.threshold || 100)}
              width={chartW}
              height={y(zone.threshold) - y(zone.threshold === 75 ? 100 : zones[idx - 1]?.threshold || 100)}
              fill={zone.color}
              opacity={zone.opacity}
            />
          ))}

          {/* Night overlay */}
          <rect x={padX} y={padTop} width={chartW} height={chartH} fill="url(#nightGrad)" />

          {/* Horizontal grid lines */}
          {[25, 50, 75].map(val => (
            <g key={val}>
              <line
                x1={padX} y1={y(val)} x2={padX + chartW} y2={y(val)}
                stroke="#334155" strokeWidth="0.5" strokeDasharray="4,4"
              />
              <text x={padX - 4} y={y(val) + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                {val}
              </text>
            </g>
          ))}

          {/* Sunrise / Sunset lines */}
          <line x1={x(sunriseHour)} y1={padTop} x2={x(sunriseHour)} y2={padTop + chartH} stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.5" />
          <text x={x(sunriseHour)} y={padTop - 3} fill="#f59e0b" fontSize="9" textAnchor="middle">☀️</text>

          <line x1={x(sunsetHour)} y1={padTop} x2={x(sunsetHour)} y2={padTop + chartH} stroke="#f97316" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.5" />
          <text x={x(sunsetHour)} y={padTop - 3} fill="#f97316" fontSize="9" textAnchor="middle">🌙</text>

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Main line */}
          <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Best hour marker */}
          <circle cx={x(bestHour)} cy={y(bestScore)} r="4" fill={scoreColor(bestScore)} opacity="0.8" />
          <circle cx={x(bestHour)} cy={y(bestScore)} r="7" fill="none" stroke={scoreColor(bestScore)} strokeWidth="1" opacity="0.3" />

          {/* Current hour vertical line */}
          <line x1={curX} y1={padTop} x2={curX} y2={padTop + chartH} stroke="#3b82f6" strokeWidth="1" opacity="0.4" strokeDasharray="2,2" />

          {/* Current hour dot with glow */}
          <circle cx={curX} cy={curY} r="5" fill={scoreColor(currentScore)} filter="url(#glow)" />
          <circle cx={curX} cy={curY} r="3" fill="white" />

          {/* X-axis labels */}
          {xLabels.map(h => (
            <text key={h} x={x(h)} y={H - 6} fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
              {h.toString().padStart(2, '0')}
            </text>
          ))}

          {/* Bottom border line */}
          <line x1={padX} y1={padTop + chartH} x2={padX + chartW} y2={padTop + chartH} stroke="#334155" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-4 text-[9px] text-slate-500 uppercase font-bold pt-1">
        <span className="flex items-center space-x-1">
          <span className="inline-block w-2 h-2 rounded-full bg-angel-green"></span>
          <span>75+</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="inline-block w-2 h-2 rounded-full bg-angel-light"></span>
          <span>55+</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="inline-block w-2 h-2 rounded-full bg-angel-yellow"></span>
          <span>40+</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="inline-block w-2 h-2 rounded-full bg-angel-red"></span>
          <span>&lt;40</span>
        </span>
      </div>
    </div>
  );
};

export default DailyForecastChart;
