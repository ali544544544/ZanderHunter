import React, { useState } from 'react';

interface InfoTooltipProps {
  text: string;
  label?: string;
  align?: 'left' | 'right';
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, label = 'Info anzeigen', align = 'right' }) => {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        aria-label={label}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(current => !current);
        }}
        onBlur={() => setOpen(false)}
        className="w-4 h-4 rounded-full bg-slate-800 text-slate-500 inline-flex items-center justify-center text-[10px] hover:text-blue-400 focus:text-blue-400 transition-colors border border-slate-700"
      >
        i
      </button>
      <span
        className={`${open ? 'block' : 'hidden'} group-hover:block absolute bottom-full ${align === 'left' ? 'left-0' : 'right-0'} mb-2 w-56 rounded-lg border border-slate-700 bg-slate-950 p-2 text-[10px] normal-case leading-relaxed tracking-normal text-slate-300 shadow-xl z-50`}
      >
        {text}
      </span>
    </span>
  );
};

export default InfoTooltip;
