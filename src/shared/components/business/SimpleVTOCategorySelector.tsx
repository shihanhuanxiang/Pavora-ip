
import React from 'react';
import Button from '../common/Button';

interface VTOCategory {
    id: string;
    name: string;
    icon: string;
    subCategories?: string[];
}

const VTO_CATEGORIES: VTOCategory[] = [
    { id: 'tops', name: '上衣', icon: '👕', subCategories: ['短袖', '長袖', '無袖'] },
    { id: 'bottoms', name: '褲/裙', icon: '👖', subCategories: ['長褲', '短褲', '裙子'] },
    { id: 'outerwear', name: '外套', icon: '🧥' },
    { id: 'one-piece', name: '套裝/洋裝', icon: '👗' },
    { id: 'bags', name: '包/袋', icon: '👜' },
    { id: 'shoes', name: '鞋子', icon: '👟' },
    { id: 'accessories', name: '帽子/眼鏡', icon: '👓' },
];

interface SimpleVTOCategorySelectorProps {
    onSelect: (category: string, subCategory?: string) => void;
    selectedCategory?: string;
}

const SimpleVTOCategorySelector: React.FC<SimpleVTOCategorySelectorProps> = ({ onSelect, selectedCategory }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
                {VTO_CATEGORIES.map(cat => (
                    <div key={cat.id} className="space-y-2">
                        <Button 
                            variant="secondary" 
                            className={`w-full justify-start py-4 px-6 text-lg font-bold tracking-widest border-2 ${selectedCategory === cat.id ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold)]' : 'border-white/5'}`}
                            onClick={() => !cat.subCategories && onSelect(cat.name)}
                        >
                            <span className="text-2xl mr-4">{cat.icon}</span>
                            {cat.name}
                        </Button>
                        
                        {cat.subCategories && (
                            <div className="grid grid-cols-3 gap-2 pl-4">
                                {cat.subCategories.map(sub => (
                                    <button
                                        key={sub}
                                        onClick={() => onSelect(cat.name, sub)}
                                        className="py-2 px-3 bg-white/5 hover:bg-[var(--color-gold)]/20 border border-white/10 rounded-md text-sm text-gray-300 hover:text-[var(--color-gold)] transition-all"
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SimpleVTOCategorySelector;
