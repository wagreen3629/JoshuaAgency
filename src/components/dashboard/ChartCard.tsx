import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function ChartCard({ title, children, className, footer }: ChartCardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow", className)}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
}