
import React, { memo } from 'react';
import Card from '../../../shared/components/common/Card';
import type { ModelData } from '../../../shared/types/types';

interface ModelInfoPanelProps {
  modelData: ModelData;
  onDataChange: (field: string, value: any) => void;
}

const ModelInfoPanel: React.FC<ModelInfoPanelProps> = ({ modelData, onDataChange }) => {
  return (
    <Card>
      <h3 className="text-lg font-bold text-[var(--color-gold)] mb-4 border-l-4 border-[var(--color-gold)] pl-3">1. 模特兒資料</h3>
      <div className="space-y-3">
        <input 
          value={modelData.name} 
          onChange={e => onDataChange('name', e.target.value)} 
          placeholder="姓名" 
          className="w-full bg-gray-800 p-2 rounded text-[var(--color-text-title)] border-none outline-none focus:ring-1 focus:ring-[var(--color-gold)]" 
        />
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: '身高 cm', key: 'height' },
            { label: '胸圍', key: 'bust' },
            { label: '腰圍', key: 'waist' },
            { label: '臀圍', key: 'hip' },
            { label: '髮色', key: 'hair' },
            { label: '眼色', key: 'eyes' }
          ].map(stat => (
            <input 
              key={stat.key}
              value={(modelData.stats as any)[stat.key]} 
              onChange={e => onDataChange(stat.key, e.target.value)} 
              placeholder={stat.label} 
              className="bg-gray-800 p-2 rounded text-[var(--color-text-title)] border-none" 
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default memo(ModelInfoPanel);
