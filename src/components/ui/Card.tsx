'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export function Card({
  children,
  className = '',
  title,
  subtitle,
  icon,
  actions,
  variant = 'default',
  padding = 'md',
}: CardProps) {
  const variantStyles = {
    default: 'bg-white border border-gray-200 shadow-sm hover:shadow-md',
    outlined: 'bg-transparent border-2 border-gray-300',
    elevated: 'bg-white shadow-lg hover:shadow-xl',
    gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-md',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  return (
    <div
      className={`rounded-xl transition-all duration-300 ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
    >
      {(title || subtitle || icon || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            {icon && (
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center text-white shadow-md">
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: 'teal' | 'blue' | 'green' | 'red' | 'amber' | 'purple';
}

export function StatCard({ label, value, icon, trend, color = 'teal' }: StatCardProps) {
  const colorStyles = {
    teal: 'from-teal-400 to-teal-600',
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    red: 'from-red-400 to-red-600',
    amber: 'from-amber-400 to-amber-600',
    purple: 'from-purple-400 to-purple-600',
  };

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isUp ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">dari kemarin</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`w-14 h-14 bg-gradient-to-br ${colorStyles[color]} rounded-xl flex items-center justify-center text-white shadow-lg`}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
