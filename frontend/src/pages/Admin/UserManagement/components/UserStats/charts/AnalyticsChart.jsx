import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Badge } from '@/components/ui/badge';

const chartMap = {
  bar: Bar,
  pie: Pie,
  doughnut: Doughnut,
};

export default function AnalyticsChart({
  type = 'bar',
  data,
  options,
  title,
  icon: Icon,
  iconColor = 'text-gray-600',
  badgeText,
  badgeColor = 'bg-blue-50 text-blue-700 border-blue-200',
  className = '',
  children,
}) {
  const ChartComponent = chartMap[type];

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm ${className}`}>
      <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
        {Icon && <Icon className={`w-4 h-4 mr-2 ${iconColor}`} />}
        {title}
        {badgeText && (
          <Badge variant="outline" className={`ml-2 text-xs ${badgeColor}`}>
            {badgeText}
          </Badge>
        )}
      </h5>
      <div className={type === 'bar' ? 'h-80' : 'h-80 relative'}>
        <ChartComponent data={data} options={options} />
      </div>
      {children}
    </div>
  );
}