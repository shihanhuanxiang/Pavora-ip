
import React, { useState } from 'react';
import type { TaxonomyEntry, ApparelMainCategory } from '../../types/types';

interface DeepApparelSelectorProps {
    masterTaxonomy: TaxonomyEntry[];
    apparelStructure: ApparelMainCategory[];
    onSelect: (entry: TaxonomyEntry) => void;
    selectedId?: string;
    label?: string;
}

const DeepApparelSelector: React.FC<DeepApparelSelectorProps> = ({ 
    masterTaxonomy, 
    apparelStructure, 
    onSelect, 
    selectedId,
    label = "專業服裝分類 (Professional Taxonomy)"
}) => {
    const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

    const toggleCat = (cat: string) => {
        setExpandedCats(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
                {label}
            </label>
            <div className="bg-black/30 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {apparelStructure.map(cat => {
                        const isExpanded = expandedCats.has(cat.mainCategory);
                        return (
                            <div key={cat.mainCategory} className="space-y-2">
                                <button 
                                    onClick={() => toggleCat(cat.mainCategory)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group border border-white/5 hover:border-white/20"
                                >
                                    <span className="text-sm font-bold text-[var(--color-gold)] uppercase tracking-[0.2em]">{cat.mainCategory}</span>
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        strokeWidth={2} 
                                        stroke="currentColor" 
                                        className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                                
                                {isExpanded && (
                                    <div className="pl-4 space-y-5 py-3 animate-fade-in border-l border-white/5 ml-2">
                                        {cat.groups.map(group => (
                                            <div key={group.groupName} className="space-y-2">
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest px-2">{group.groupName}</p>
                                                <div className="flex flex-wrap gap-2 pl-2">
                                                    {group.items.map(item => {
                                                        const isSelected = selectedId === item.id;
                                                        return (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => {
                                                                    const entry = masterTaxonomy.find(t => t.id === item.id);
                                                                    if (entry) onSelect(entry);
                                                                }}
                                                                className={`text-xs px-4 py-2 rounded-lg border transition-all duration-300 ${
                                                                    isSelected 
                                                                    ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] font-bold shadow-[0_0_15px_rgba(var(--color-gold-rgb),0.3)]' 
                                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-[var(--color-gold)]/50 hover:text-white'
                                                                }`}
                                                            >
                                                                {item.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DeepApparelSelector;
