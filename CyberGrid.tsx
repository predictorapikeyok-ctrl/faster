import { useEffect, useState } from 'react';

export default function CyberGrid() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#02020a] pointer-events-none">
      {/* 60% height cyber background playground as specified by user */}
      <div className="bg-animation absolute top-0 left-0 w-full h-[60%] overflow-hidden">
        <div className="grid-overlay w-full h-full absolute"></div>
      </div>

      {/* Cyber gradient radial glow to make the grid pop */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[80%] h-[30%] bg-gradient-to-t from-transparent via-[rgba(0,105,185,0.15)] to-transparent blur-3xl pointer-events-none"></div>
    </div>
  );
}
