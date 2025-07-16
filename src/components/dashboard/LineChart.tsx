import React from 'react';

interface LineChartProps {
  data: {
    label: string;
    value: number;
  }[];
  height?: number;
  maxValue?: number;
  lineColor?: string;
  areaColor?: string;
  showDots?: boolean;
  showLabels?: boolean;
  valueFormatter?: (value: number) => string;
}

export function LineChart({ 
  data, 
  height = 200, 
  maxValue: customMaxValue,
  lineColor = 'stroke-blue-500',
  areaColor = 'fill-blue-100',
  showDots = true,
  showLabels = true,
  valueFormatter = (value) => value.toString()
}: LineChartProps) {
  if (data.length < 2) return <div className="text-center py-4">Not enough data</div>;
  
  // Calculate the maximum value for scaling
  const maxValue = customMaxValue || Math.max(...data.map(item => item.value)) * 1.1;
  
  // Calculate points for the SVG path
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item.value / maxValue) * 100);
    return `${x},${y}`;
  });
  
  // Create the path string for the line
  const linePath = `M ${points.join(' L ')}`;
  
  // Create the path string for the area
  const areaPath = `${linePath} L ${(data.length - 1) / (data.length - 1) * 100},100 L 0,100 Z`;
  
  return (
    <div style={{ height: `${height}px` }} className="w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {/* Area under the line */}
        <path d={areaPath} className={`${areaColor} opacity-30`} />
        
        {/* Line */}
        <path d={linePath} fill="none" className={`${lineColor} stroke-2`} />
        
        {/* Dots at data points */}
        {showDots && data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((item.value / maxValue) * 100);
          
          return (
            <circle 
              key={index} 
              cx={x} 
              cy={y} 
              r="1.5" 
              className={lineColor.replace('stroke', 'fill')}
            />
          );
        })}
      </svg>
      
      {/* X-axis labels */}
      {showLabels && (
        <div className="flex justify-between mt-2">
          {data.map((item, index) => (
            <div key={index} className="text-xs text-gray-500 truncate" style={{ width: `${100 / data.length}%` }}>
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
