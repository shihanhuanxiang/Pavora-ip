import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

// Color conversion utilities
const hexToRgb = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  return { r, g, b };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToRgb = (h: number, s: number, v: number) => {
  h /= 360; s /= 100; v /= 100;
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [hsv, setHsv] = useState(() => {
    const { r, g, b } = hexToRgb(color);
    return rgbToHsv(r, g, b);
  });
  const [inputValue, setInputValue] = useState(color);

  const saturationRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    setInputValue(color.toUpperCase());
    const { r, g, b } = hexToRgb(color);
    setHsv(rgbToHsv(r, g, b));
  }, [color]);

  const handleColorChange = (newHsv: { h: number; s: number; v: number }) => {
    setHsv(newHsv);
    const { r, g, b } = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const newHex = rgbToHex(r, g, b);
    onChange(newHex);
  };
  
  const handleSaturationChange = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (saturationRef.current) {
      const rect = saturationRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      const s = (x / rect.width) * 100;
      const v = 100 - (y / rect.height) * 100;
      handleColorChange({ ...hsv, s, v });
    }
  }, [hsv]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
      isDragging.current = true;
      handleSaturationChange(e);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
      if (isDragging.current) {
          handleSaturationChange(e);
      }
  }, [handleSaturationChange]);

  const handleMouseUp = useCallback(() => {
      isDragging.current = false;
  }, []);

  useEffect(() => {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [handleMouseMove, handleMouseUp]);


  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleColorChange({ ...hsv, h: Number(e.target.value) });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    setInputValue(newHex);
    if (/^#[0-9A-F]{6}$/i.test(newHex) || /^#[0-9A-F]{3}$/i.test(newHex)) {
      onChange(newHex);
    }
  };

  const hueColor = `hsl(${hsv.h}, 100%, 50%)`;
  const pickerLeft = `${hsv.s}%`;
  const pickerTop = `${100 - hsv.v}%`;

  return (
    <div className="w-full max-w-xs space-y-3">
      <div
        ref={saturationRef}
        onMouseDown={handleMouseDown}
        className="w-full h-40 rounded-lg cursor-pointer relative"
        style={{ backgroundColor: hueColor, background: `linear-gradient(to right, white, ${hueColor})` }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, black, transparent)' }} />
        <div
          className="w-4 h-4 rounded-full border-2 border-white shadow-md absolute"
          style={{ top: pickerTop, left: pickerLeft, transform: 'translate(-50%, -50%)', backgroundColor: color }}
        />
      </div>
      <div className="flex items-center gap-2">
         <div className="w-8 h-8 rounded-full" style={{ backgroundColor: color }} />
        <div className="flex-grow">
            <input
                type="range"
                min="0"
                max="360"
                value={hsv.h}
                onChange={handleHueChange}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                style={{ background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)' }}
            />
        </div>
      </div>
      <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg">
          <div className="w-8 h-8 rounded-md flex items-center justify-center font-mono text-xs" style={{ backgroundColor: color, color: hsv.v > 50 ? '#000' : '#FFF' }}>
              #
          </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          className="bg-transparent w-full text-white font-mono tracking-wider focus:outline-none"
        />
      </div>
    </div>
  );
};

export default ColorPicker;