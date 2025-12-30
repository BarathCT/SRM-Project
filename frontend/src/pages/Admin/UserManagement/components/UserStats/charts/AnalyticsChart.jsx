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

  // Check if data is empty
  const isEmpty = !data || 
    !data.labels || 
    data.labels.length === 0 || 
    !data.datasets || 
    data.datasets.length === 0 ||
    (data.datasets[0] && (!data.datasets[0].data || data.datasets[0].data.every(val => val === 0 || !val)));

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <h5 className="font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
        {Icon && <Icon className={`w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 ${iconColor}`} />}
        {title}
        {badgeText && (
          <Badge variant="outline" className={`ml-1.5 sm:ml-2 text-xs ${badgeColor}`}>
            {badgeText}
          </Badge>
        )}
      </h5>
      <div className={`${type === 'bar' ? 'h-64 sm:h-72 lg:h-80' : 'h-64 sm:h-72 lg:h-80'} relative min-h-[200px]`}>
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <div className="text-center">
              <p className="font-medium text-gray-500">No data available</p>
              <p className="text-xs mt-1 text-gray-400">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChartComponent data={data} options={options} />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}