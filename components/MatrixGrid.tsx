import React, { useState } from 'react';
import { calculateRiskLevel, getRiskColor, GRAVITY_OPTIONS, OCCURRENCE_OPTIONS } from '../constants';
import { Gravity, Occurrence } from '../types';

interface MatrixGridProps {
  currentGravity: Gravity;
  currentOccurrence: Occurrence;
  initialGravity?: Gravity;
  initialOccurrence?: Occurrence;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  onCellClick?: (g: Gravity, o: Occurrence) => void;
}

const MatrixGrid: React.FC<MatrixGridProps> = ({
  currentGravity,
  currentOccurrence,
  initialGravity,
  initialOccurrence,
  label,
  size = 'md',
  onCellClick
}) => {
  const [hovered, setHovered] = useState<{ g: Gravity, o: Occurrence } | null>(null);

  // Responsive sizes
  const cellSize = size === 'sm' ? 'w-8 h-8 text-[10px]' : size === 'md' ? 'w-12 h-12 text-sm' : 'w-16 h-16 text-base';

  const rows = [4, 3, 2, 1] as Gravity[];
  const cols = ['A', 'B', 'C', 'D'] as Occurrence[];

  const activeG = hovered ? hovered.g : currentGravity;
  const activeO = hovered ? hovered.o : currentOccurrence;

  const gravityLabel = GRAVITY_OPTIONS.find(opt => opt.value === activeG)?.label.split('(')[0].trim();
  const occurrenceLabel = OCCURRENCE_OPTIONS.find(opt => opt.value === activeO)?.label.split('(')[0].trim();
  const riskLevel = calculateRiskLevel(activeG, activeO);

  // Extract just the background color class for the pill
  const pillColor = riskLevel === 'Inacceptable' ? 'bg-red-600 text-white' :
    riskLevel === 'Fort' ? 'bg-orange-500 text-white' :
      riskLevel === 'Faible' ? 'bg-yellow-400 text-slate-900' :
        'bg-green-500 text-white';

  /* Use useId for unique SVG definitions to prevent conflicts in lists/PDFs */
  const uniqueId = React.useId();
  const markerHeadId = `arrowhead-${uniqueId}`;
  const markerStartId = `arrowstart-${uniqueId}`;
  const glowId = `glow-${uniqueId}`;

  // --- Arrow Logic ---
  const getColIndex = (o: Occurrence) => ['A', 'B', 'C', 'D'].indexOf(o);
  const getRowIndex = (g: Gravity) => [4, 3, 2, 1].indexOf(g); // 4 is index 0

  const renderArrow = () => {
    if (!initialGravity || !initialOccurrence) return null;

    // Don't render if same position
    if (initialGravity === currentGravity && initialOccurrence === currentOccurrence) return null;

    // Coordinate Mapping for 4x4 grid with gaps
    // Precision mapping based on cell size / gap ratio
    // sm: w-8 (32px), gap-2 (8px). Ratio 4:1. Total 9.5 units. Centers: 1, 3.5, 6, 8.5
    // md: w-12 (48px), gap-2 (8px). Ratio 6:1. Total 13.5 units. Centers: 1.5, 5, 8.5, 12
    // lg: w-16 (64px), gap-2 (8px). Ratio 8:1. Total 17.5 units. Centers: 2, 6.5, 11, 15.5

    let COORD_MAP = [11, 37, 63, 89]; // Default fallback

    if (size === 'sm') {
      COORD_MAP = [10.5, 36.8, 63.2, 89.5];
    } else if (size === 'md') {
      // Assuming md:w-16 acts as w-12 on smaller screens but logic is complex. 
      // Compromise or detect? 'md' is default, which the original [11, 37, 63, 89] was tuned for (w-12).
      // Let's keep the original for 'md' as it works on the web.
      COORD_MAP = [11, 37, 63, 89];
    } else { // lg
      COORD_MAP = [11.4, 37.1, 62.9, 88.6];
    }

    const startX = COORD_MAP[getColIndex(initialOccurrence)];
    const startY = COORD_MAP[getRowIndex(initialGravity)];
    const endX = COORD_MAP[getColIndex(currentOccurrence)];
    const endY = COORD_MAP[getRowIndex(currentGravity)];

    // Orthogonal Path Logic (L-Shape) with rounded corner
    // We prioritize moving Horizontally (Occurrence reduction) then Vertically (Gravity reduction)

    let pathD = '';
    const radius = 8; // Corner radius

    // Determine direction for arrowhead
    // If we move vertically at the end (L-shape or vertical line), direction is vertical
    // If we only move horizontally (straight line), direction is horizontal
    let arrowAngle = 0; // 0 = pointing right (default)

    // If straight line
    if (startX === endX || startY === endY) {
      pathD = `M${startX},${startY} L${endX},${endY}`;
      if (startY === endY) {
        // Horizontal
        arrowAngle = endX > startX ? 0 : 180;
      } else {
        // Vertical
        arrowAngle = endY > startY ? 90 : 270;
      }
    } else {
      // L-Shape: Start -> (CornerX, CornerY) -> End
      // We move Horizontal first (change X), then Vertical (change Y)
      // Corner is at (endX, startY)
      const cornerX = endX;
      const cornerY = startY;

      // Directions for corner calculation
      const dirX = endX > startX ? 1 : -1;
      const dirY = endY > startY ? 1 : -1;

      // Clamp radius if segments are too short
      const seg1Len = Math.abs(endX - startX);
      const seg2Len = Math.abs(endY - startY);
      const r = Math.min(radius, seg1Len / 2, seg2Len / 2);

      // Start point
      pathD = `M${startX},${startY}`;

      // Line to start of curve (Horizontal move)
      pathD += ` L${cornerX - (dirX * r)},${cornerY}`;

      // Quadratic Curve to completion of turn
      pathD += ` Q${cornerX},${cornerY} ${cornerX},${cornerY + (dirY * r)}`;

      // Line to end (Vertical move)
      pathD += ` L${endX},${endY}`;

      // The last segment is always vertical in this L-shape logic
      arrowAngle = endY > startY ? 90 : 270;
    }

    // Manual Arrowhead Points (Equilateralish triangle pointing right at 0,0)
    // Points: (0,0), (-5, -2.5), (-5, 2.5) relative to tip
    // We need to rotate these points and translate to (endX, endY)
    const arrowSize = 5;
    const rad = (arrowAngle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const transformPoint = (x: number, y: number) => {
      // Rotate
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      // Translate
      return `${endX + rx},${endY + ry}`;
    };

    const tip = transformPoint(0, 0); // Should be endX, endY
    const back1 = transformPoint(-arrowSize, -arrowSize / 2);
    const back2 = transformPoint(-arrowSize, arrowSize / 2);

    const arrowHeadPath = `M${tip} L${back1} L${back2} Z`;

    return (
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Shadow/Glow effect underlying path - simplified for PDF */}
        <path
          d={pathD}
          stroke="white"
          strokeWidth="4"
          opacity="0.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Main Arrow Line */}
        <path
          d={pathD}
          stroke="#84cc16"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start Dot */}
        <circle cx={startX} cy={startY} r="2" fill="#84cc16" stroke="white" strokeWidth="0.5" />

        {/* End Arrowhead */}
        <path d={arrowHeadPath} fill="#84cc16" stroke="none" />
      </svg>
    );
  };

  return (
    <div className="flex flex-col items-center select-none w-full max-w-sm mx-auto">

      {/* Selection Card (Top) */}
      <div className="mb-8 w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col items-center justify-center text-center transition-all relative overflow-hidden group">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          {hovered ? "PRÉVISUALISATION" : "SÉLECTION"}
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-slate-800 text-base md:text-lg leading-tight transition-all duration-300">{gravityLabel}</span>
          <span className="text-slate-300 font-light text-xl">/</span>
          <span className="font-bold text-slate-800 text-base md:text-lg leading-tight transition-all duration-300">{occurrenceLabel}</span>
        </div>
        <div className={`text-[11px] font-black uppercase px-4 py-1 rounded-full transform transition-all tracking-wider ${pillColor}`}>
          {riskLevel.toUpperCase()}
        </div>
      </div>

      {/* Matrix Container */}
      <div className="relative p-6 bg-slate-100 rounded-3xl shadow-inner mx-auto w-fit">

        {/* Y Axis Label (Vertical Text) */}
        <div className="absolute left-1 top-0 bottom-0 flex items-center justify-center w-6">
          <div className="-rotate-90 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
            Gravité
          </div>
        </div>

        <div className="flex flex-col relative">

          <div className="flex mb-2 ml-8">
            {/* X Axis Header */}
            {cols.map(c => {
              const isHoveredCol = hovered?.o === c;
              const label = OCCURRENCE_OPTIONS.find(o => o.value === c)?.label.split('(')[0].trim();

              return (
                <div key={c} className="relative flex-1 w-12 md:w-16 flex justify-center">
                  <span className={`text-xs font-bold transition-colors duration-200 ${isHoveredCol ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
                    {c}
                  </span>
                  {/* Floating Label on Hover */}
                  <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap transition-all duration-200 pointer-events-none z-30 ${isHoveredCol ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
                    {label}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative">
            {/* The Arrow Layer */}
            <div className="absolute inset-0 left-8 z-20 pointer-events-none">
              <div className="relative w-full h-full">
                {renderArrow()}
              </div>
            </div>
            {rows.map(row => (
              <div key={row} className="flex mb-2 last:mb-0 items-center">
                {/* Row Header */}
                <div className="relative w-8 flex justify-end pr-3">
                  {/* Floating Label on Hover */}
                  <div className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap transition-all duration-200 pointer-events-none z-30 ${hovered?.g === row ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-1'}`}>
                    {GRAVITY_OPTIONS.find(g => g.value === row)?.label.split('(')[0].trim()}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-800"></div>
                  </div>

                  <span className={`text-xs font-bold transition-colors duration-200 ${hovered?.g === row ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
                    {row}
                  </span>
                </div>

                {/* Cells */}
                <div className="flex gap-2">
                  {cols.map(col => {
                    const level = calculateRiskLevel(row, col);
                    const baseColor = getRiskColor(level);
                    const bgColorClass = baseColor.split(' ')[0]; // Extract bg color

                    const isSelected = row === currentGravity && col === currentOccurrence;
                    const isHovered = hovered?.g === row && hovered?.o === col;
                    const isInitial = initialGravity === row && initialOccurrence === col;

                    // Dim others when hovering
                    const isDimmed = hovered && !isHovered;

                    return (
                      <div
                        key={`${row}-${col}`}
                        onMouseEnter={() => setHovered({ g: row, o: col })}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => onCellClick && onCellClick(row, col)}
                        className={`
                                            ${cellSize} 
                                            ${bgColorClass}
                                            rounded-lg md:rounded-xl
                                            flex items-center justify-center
                                            transition-all duration-200 ease-out
                                            relative
                                            ${onCellClick ? 'cursor-pointer hover:scale-105 hover:shadow-lg hover:z-10' : ''}
                                            ${isSelected ? 'ring-[3px] ring-white shadow-md z-10' : ''}
                                            ${isInitial && !isSelected ? 'opacity-80' : ''} 
                                            ${isDimmed ? 'opacity-40 blur-[0.5px]' : 'opacity-100'}
                                        `}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 md:w-3 md:h-3 bg-slate-900 rounded-full shadow-sm"></div>
                        )}
                        {/* Ghost dot for initial if different */}
                        {isInitial && !isSelected && (
                          <div className="w-1.5 h-1.5 bg-slate-900/30 rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* X Axis Label */}
          <div className="flex justify-center mt-3 ml-8">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Occurrence</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatrixGrid;