import React, { useMemo, useState, useRef, useCallback } from 'react';

interface DailyForecastChartProps {
  hourlyScores: number[];
  startHour: number;
  liveScore: number;
  sunrises?: string[];
  sunsets?: string[];
}

const DailyForecastChart: React.FC<DailyForecastChartProps> = ({ hourlyScores, startHour, liveScore, sunrises, sunsets }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeHourIndex, setActiveHourIndex] = useState<number | null>(null);
  const [touchActive, setTouchActive] = useState(false);

  const now = useMemo(() => new Date(), []);
  const chartStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 0, 0, 0), [now, startHour]);

  const sunriseHour = useMemo(() => {
    if (!sunrises || sunrises.length === 0) return 6;
    
    for (const iso of sunrises) {
      const d = new Date(iso);
      const diffHours = (d.getTime() - chartStart.getTime()) / (1000 * 60 * 60);
      if (diffHours >= 0 && diffHours < 24) return diffHours;
    }
    return 6;
  }, [sunrises, chartStart]);

  const sunsetHour = useMemo(() => {
    if (!sunsets || sunsets.length === 0) return 20;
    
    for (const iso of sunsets) {
      const d = new Date(iso);
      const diffHours = (d.getTime() - chartStart.getTime()) / (1000 * 60 * 60);
      if (diffHours >= 0 && diffHours < 24) return diffHours;
    }
    return 20;
  }, [sunsets, chartStart]);

  // Chart dimensions
  const W = 360;
  const H = 180;
  const padX = 28;
  const padTop = 16;
  const padBot = 28;
  const chartW = W - padX * 2;
  const chartH = H - padTop - padBot;

  // Map hour index to x
  const x = (hour: number) => padX + (hour / 23) * chartW;
  // Map score to y (inverted)
  const y = (score: number) => padTop + chartH - (score / 100) * chartH;
  // Map x back to hour
  const xToHour = (xPos: number) => Math.max(0, Math.min(23, Math.round(((xPos - padX) / chartW) * 23)));

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

  // Use the actual live score for the current position on the chart
  const currentOffset = (now.getTime() - chartStart.getTime()) / (1000 * 60 * 60);
  const curX = x(currentOffset);
  const curY = y(liveScore);

  // Color for score
  const scoreColor = (s: number) => {
    if (s >= 75) return '#22c55e';
    if (s >= 55) return '#84cc16';
    if (s >= 40) return '#f59e0b';
    return '#ef4444';
  };

  // Score label
  const scoreLabel = (s: number) => {
    if (s >= 75) return 'Sehr gut';
    if (s >= 55) return 'Gut';
    if (s >= 40) return 'Mittel';
    return 'Schlecht';
  };

  // Best hour index
  const bestHourIndex = hourlyScores.indexOf(Math.max(...hourlyScores));
  const bestScore = hourlyScores[bestHourIndex];
  const bestRealHour = (((startHour + bestHourIndex) % 24) + 24) % 24;

  // X-axis labels
  const xTickOffsets: number[] = [];
  const firstTickOffset = (((3 - (startHour % 3)) % 3) + 3) % 3;
  for (let i = firstTickOffset; i < 24; i += 3) {
    xTickOffsets.push(i);
  }

  // Score zone thresholds
  const zones = [
    { threshold: 75, color: '#22c55e', opacity: 0.04 },
    { threshold: 55, color: '#84cc16', opacity: 0.04 },
    { threshold: 40, color: '#f59e0b', opacity: 0.04 },
  ];

  // Interactive: convert pointer/touch event to SVG coordinates
  const getSvgX = useCallback((clientX: number): number => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * W;
    return svgX;
  }, [W]);

  const handleInteraction = useCallback((clientX: number) => {
    const svgX = getSvgX(clientX);
    const hourIdx = xToHour(svgX);
    setActiveHourIndex(hourIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getSvgX]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    handleInteraction(e.clientX);
  }, [handleInteraction]);

  const handlePointerEnter = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      handleInteraction(e.clientX);
    }
  }, [handleInteraction]);

  const handlePointerLeave = useCallback(() => {
    if (!touchActive) {
      setActiveHourIndex(null);
    }
  }, [touchActive]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchActive(true);
    const touch = e.touches[0];
    handleInteraction(touch.clientX);
  }, [handleInteraction]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleInteraction(touch.clientX);
  }, [handleInteraction]);

  const handleTouchEnd = useCallback(() => {
    setTouchActive(false);
    // Keep tooltip visible for a moment after touch ends
    setTimeout(() => {
      setActiveHourIndex(null);
    }, 1500);
  }, []);

  // Active hour data for tooltip
  let displayHourIdx = activeHourIndex !== null ? activeHourIndex : Math.floor(currentOffset);
  displayHourIdx = Math.max(0, Math.min(23, displayHourIdx));
  const activeScore = hourlyScores[displayHourIdx];
  const activeX = x(displayHourIdx);
  const activeY = y(activeScore);
  const activeRealHour = (((startHour + displayHourIdx) % 24) + 24) % 24;

  // Determine if tooltip should flip to left side
  const tooltipFlip = displayHourIdx > 17;

  return (
    <div className="card space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-slate-400 font-medium uppercase tracking-wider text-sm">24h Forecast</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Stündlicher Angel-Index</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: scoreColor(liveScore) }}></div>
            <span className="text-[10px] font-mono font-bold" style={{ color: scoreColor(liveScore) }}>
              LIVE: {liveScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Best hour callout */}
      <div className="flex items-center space-x-2 bg-slate-950/40 rounded-xl px-3 py-2 border border-slate-800/50">
        <span className="text-lg">🎯</span>
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Beste Stunde</span>
          <p className="text-sm font-bold" style={{ color: scoreColor(bestScore) }}>
            {bestRealHour}:00 Uhr — {bestScore}%
          </p>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative select-none" style={{ touchAction: 'none' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full cursor-crosshair"
          style={{ height: 'auto' }}
          onPointerMove={handlePointerMove}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <defs>
            {/* Main gradient for the area fill */}
            <linearGradient id="dfcAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
            {/* Line gradient based on score values */}
            <linearGradient id="dfcLineGrad" x1="0" y1="0" x2="1" y2="0">
              {hourlyScores.map((s, i) => (
                <stop key={i} offset={`${(i / 23) * 100}%`} stopColor={scoreColor(s)} />
              ))}
            </linearGradient>
            {/* Glow filter for the current dot */}
            <filter id="dfcGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Hover glow filter */}
            <filter id="dfcHoverGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Night gradient overlay */}
            <linearGradient id="dfcNightGrad" x1="0" y1="0" x2="1" y2="0">
              {sunriseHour < sunsetHour ? (
                <>
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.5" />
                  <stop offset={`${(sunriseHour / 24) * 100}%`} stopColor="#0f172a" stopOpacity="0.5" />
                  <stop offset={`${((sunriseHour + 0.5) / 24) * 100}%`} stopColor="#0f172a" stopOpacity="0" />
                  <stop offset={`${((sunsetHour - 0.5) / 24) * 100}%`} stopColor="#0f172a" stopOpacity="0" />
                  <stop offset={`${(sunsetHour / 24) * 100}%`} stopColor="#0f172a" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.5" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0" />
                  <stop offset={`${(sunsetHour / 24) * 100}%`} stopColor="#0f172a" stopOpacity="0" />
                  <stop offset={`${((sunsetHour + 0.5) / 24) * 100}%`} stopColor="#0f172a" stopOpacity="0.5" />
                  <stop offset={`${((sunriseHour - 0.5) / 24) * 100}%`} stopColor="#0f172a" stopOpacity="0.5" />
                  <stop offset={`${(sunriseHour / 24) * 100}%`} stopColor="#0f172a" stopOpacity="0" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </>
              )}
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
          <rect x={padX} y={padTop} width={chartW} height={chartH} fill="url(#dfcNightGrad)" />

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
          <path d={areaPath} fill="url(#dfcAreaGrad)" />

          {/* Main line */}
          <path d={linePath} fill="none" stroke="url(#dfcLineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Best hour marker */}
          <circle cx={x(bestHourIndex)} cy={y(bestScore)} r="4" fill={scoreColor(bestScore)} opacity="0.8" />
          <circle cx={x(bestHourIndex)} cy={y(bestScore)} r="7" fill="none" stroke={scoreColor(bestScore)} strokeWidth="1" opacity="0.3" />

          {/* Current hour vertical line */}
          <line x1={curX} y1={padTop} x2={curX} y2={padTop + chartH} stroke="#3b82f6" strokeWidth="1" opacity="0.4" strokeDasharray="2,2" />

          {/* Current hour dot with glow — uses liveScore */}
          <circle cx={curX} cy={curY} r="5" fill={scoreColor(liveScore)} filter="url(#dfcGlow)" />
          <circle cx={curX} cy={curY} r="3" fill="white" />
          
          <text x={curX + 6} y={padTop + 6} fill="#3b82f6" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
            JETZT
          </text>

          {/* Interactive hover/touch layer */}
          <g>
              {/* Vertical scan line */}
              <line
                x1={activeX} y1={padTop} x2={activeX} y2={padTop + chartH}
                stroke="#94a3b8" strokeWidth="0.8" opacity="0.6"
              />

              {/* Dot on curve */}
              <circle cx={activeX} cy={activeY} r="6" fill={scoreColor(activeScore)} filter="url(#dfcHoverGlow)" />
              <circle cx={activeX} cy={activeY} r="3.5" fill="#0f172a" />
              <circle cx={activeX} cy={activeY} r="2" fill={scoreColor(activeScore)} />

              {/* Tooltip background */}
              <rect
                x={tooltipFlip ? activeX - 82 : activeX + 8}
                y={Math.max(padTop, Math.min(activeY - 22, padTop + chartH - 44))}
                width="74"
                height="44"
                rx="8"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1"
                opacity="0.95"
              />
              {/* Tooltip: Hour */}
              <text
                x={tooltipFlip ? activeX - 45 : activeX + 45}
                y={Math.max(padTop + 14, Math.min(activeY - 7, padTop + chartH - 28))}
                fill="#94a3b8"
                fontSize="9"
                textAnchor="middle"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {activeRealHour.toString().padStart(2, '0')}:00 Uhr
              </text>
              {/* Tooltip: Score */}
              <text
                x={tooltipFlip ? activeX - 45 : activeX + 45}
                y={Math.max(padTop + 30, Math.min(activeY + 9, padTop + chartH - 12))}
                fill={scoreColor(activeScore)}
                fontSize="14"
                textAnchor="middle"
                fontWeight="900"
              >
                {activeScore}%
              </text>
              {/* Tooltip: Label */}
              <text
                x={tooltipFlip ? activeX - 45 : activeX + 45}
                y={Math.max(padTop + 40, Math.min(activeY + 19, padTop + chartH - 2))}
                fill="#64748b"
                fontSize="7"
                textAnchor="middle"
                fontWeight="bold"
              >
                {scoreLabel(activeScore).toUpperCase()}
              </text>
            </g>

          {/* X-axis labels */}
          {xTickOffsets.map(offset => (
            <text key={offset} x={x(offset)} y={H - 6} fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
              {((((startHour + offset) % 24) + 24) % 24).toString().padStart(2, '0')}
            </text>
          ))}

          {/* Bottom border line */}
          <line x1={padX} y1={padTop + chartH} x2={padX + chartW} y2={padTop + chartH} stroke="#334155" strokeWidth="0.5" />

          {/* Invisible hit area for better touch targets */}
          <rect x={padX} y={padTop} width={chartW} height={chartH} fill="transparent" />
        </svg>
      </div>

      {/* Hint text */}
      <p className="text-center text-[9px] text-slate-600 italic">
        {touchActive ? 'Finger bewegen um Stunden zu erkunden' : 'Tippe oder fahre über den Graphen'}
      </p>

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
