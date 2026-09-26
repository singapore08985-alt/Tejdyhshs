import React from 'react';
import { 
  Grid, 
  Smartphone, 
  Palette, 
  Code, 
  Cpu, 
  BookOpen 
} from 'lucide-react';
import { ProductCategory, CategoryInfo } from '../types';
import { CATEGORIES } from '../data/products';
import { triggerHapticFeedback } from '../utils/haptics';

interface CategoryFilterProps {
  selectedCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
  selectedSort: 'popular' | 'newest' | 'priceAsc' | 'priceDesc';
  onSelectSort: (sort: 'popular' | 'newest' | 'priceAsc' | 'priceDesc') => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedSort,
  onSelectSort,
}) => {
  const getIcon = (icon: string) => {
    switch (icon) {
      case 'Smartphone':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'Palette':
        return <Palette className="w-4 h-4 text-teal-400" />;
      case 'Code':
        return <Code className="w-4 h-4 text-cyan-400" />;
      case 'Cpu':
        return <Cpu className="w-4 h-4 text-amber-400" />;
      default:
        return <Grid className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      
      {/* Categories chips */}
      <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                triggerHapticFeedback(10);
                onSelectCategory(cat.id);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {getIcon(cat.icon)}
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sorting dropdown */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        <span className="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
        <select
          value={selectedSort}
          onChange={(e) => {
            triggerHapticFeedback(10);
            onSelectSort(e.target.value as any);
          }}
          className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest Releases</option>
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
        </select>
      </div>

    </div>
  );
};
