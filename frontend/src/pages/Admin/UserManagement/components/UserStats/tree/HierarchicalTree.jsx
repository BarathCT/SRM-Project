import { useState, useCallback } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, ChevronRight, Layers, TreePine } from 'lucide-react';

// Adjust roleConfig import if you have it in a separate file, or copy the relevant icon/color logic here
const roleConfig = {
  campus_admin: {
    text: 'text-blue-800',
    icon: Layers,
    label: 'Campus Admin',
  },
  faculty: {
    text: 'text-emerald-800',
    icon: Layers,
    label: 'Faculty',
  }
};

export default function HierarchicalTree({ data, title, type }) {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpansion = useCallback((key) => {
    setExpandedItems(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(key)) {
        newExpanded.delete(key);
      } else {
        newExpanded.add(key);
      }
      return newExpanded;
    });
  }, []);

  return (
    <div className="space-y-4">
      <h5 className="font-semibold text-gray-800 flex items-center">
        <TreePine className="w-4 h-4 mr-2 text-green-600" />
        {title}
      </h5>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {Object.entries(data).map(([college, institutes]) => (
          <Collapsible key={college}>
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-white/90 border border-blue-100 rounded-lg hover:bg-blue-50/50 transition-colors"
              onClick={() => toggleExpansion(college)}
            >
              <div className="flex items-center space-x-3">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-800">{college}</span>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {Object.keys(institutes).length} {type}s
                </Badge>
              </div>
              {expandedItems.has(college) ?
                <ChevronDown className="w-4 h-4 text-gray-500" /> :
                <ChevronRight className="w-4 h-4 text-gray-500" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 ml-6 space-y-2">
              {Object.entries(institutes).map(([item, roles]) => (
                <div key={item} className="p-3 bg-white/95 rounded-lg border border-gray-100 border-l-4 border-l-green-400">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-3 h-3 text-green-600" />
                      <span className="font-medium text-sm text-gray-800">{item}</span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {Object.values(roles).filter((count, index) =>
                        Object.keys(roles)[index] !== 'super_admin'
                      ).reduce((sum, count) => sum + count, 0)} users
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(roles).map(([role, count]) => {
                      if (count === 0 || role === 'super_admin') return null;
                      const config = roleConfig[role];
                      return (
                        <div key={role} className="flex items-center justify-between p-2 bg-white/90 rounded border border-gray-100">
                          <div className="flex items-center space-x-1">
                            {config && <config.icon className={`w-3 h-3 ${config.text}`} />}
                            <span className="text-xs">{config?.label}</span>
                          </div>
                          <span className="text-xs font-mono">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}