import React from 'react';
import { Info } from 'lucide-react';

interface HelpTooltipProps {
  text: string;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ text }) => {
  return (
    <div className="relative inline-flex items-center group ml-1.5 cursor-help align-middle">
      <Info className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none text-center after:content-[''] after:absolute after:top-100% after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800">
        {text}
      </div>
    </div>
  );
};

export default HelpTooltip;
