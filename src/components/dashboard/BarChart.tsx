import React from 'react';

interface BarChartProps {
  data: {
    label: string;
    value: number;
    color?: string;
  }[];
  height?: number;
}

export function BarChart({
  data,
  height = 240
}: BarChartProps) {
  const maxValue = Math.max(...data.map(item => item.value)) * 1.1;

  //console.log('📊 BarChart rendering...');
  //console.log('Data:', data);
  //console.log('Max value (scaled):', maxValue);

  return (
    <div className="w-full overflow-x-auto" style={{ height }}>
      <div className="flex items-end justify-between h-full px-2 space-x-2 bg-gray-50">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 60); // space for text
          //console.log(`${item.label}: value = ${item.value}, barHeight = ${barHeight}`);

          return (
            <div key={index} className="flex flex-col items-center min-w-[30px]">
              <div className="text-xs text-gray-600 mb-1">{item.value}</div>
              <div
                style={{
                  height: `${barHeight}px`,
                  width: '20px',
                  backgroundColor: '#3B82F6',
                  borderRadius: '4px',
                }}
                className="transition-all duration-200 hover:opacity-80"
              />
              <div className="text-xs text-gray-600 mt-1 text-center">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
