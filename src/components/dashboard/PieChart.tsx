import React from 'react';

interface PieChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  size?: number;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
}

export function PieChart({ 
  data, 
  size = 200, 
  showLegend = true,
  valueFormatter = (value) => value.toString()
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    
    // Calculate the SVG arc path
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    const startX = 50 + 40 * Math.cos((startAngle - 90) * (Math.PI / 180));
    const startY = 50 + 40 * Math.sin((startAngle - 90) * (Math.PI / 180));
    const endX = 50 + 40 * Math.cos((endAngle - 90) * (Math.PI / 180));
    const endY = 50 + 40 * Math.sin((endAngle - 90) * (Math.PI / 180));
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M 50 50`,
      `L ${startX} ${startY}`,
      `A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `Z`
    ].join(' ');
    
    return {
      path: pathData,
      color: item.color,
      label: item.label,
      value: item.value,
      percentage
    };
  });
  
  return (
    <div className="flex flex-col items-center">
      <div style={{ width: `${size}px`, height: `${size}px` }} className="relative">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.path}
              fill={segment.color}
              stroke="#fff"
              strokeWidth="1"
            />
          ))}
          <circle cx="50" cy="50" r="25" fill="white" />
        </svg>
      </div>
      
      {showLegend && (
        <div className="mt-4 grid grid-cols-2 gap-2 w-full">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center">
              <div className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: segment.color }} />
              <div className="text-xs">
                <span className="font-medium">{segment.label}</span>
                <span className="ml-1 text-gray-500">
                  ({valueFormatter(segment.value)}, {segment.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
