import React from 'react';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function Slider({ 
  value, 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  className = '' 
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onValueChange([newValue]);
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={handleChange}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${className}`}
      style={{
        background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((value[0] - min) / (max - min)) * 100}%, #E5E7EB ${((value[0] - min) / (max - min)) * 100}%, #E5E7EB 100%)`
      }}
    />
  );
} 