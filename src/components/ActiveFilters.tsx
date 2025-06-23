import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Tag, FilterOptions } from '../types';

interface ActiveFiltersProps {
  tags: Tag[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  tags,
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange
}) => {
  const hasActiveFilters = filters.tags.length > 0 || filters.sortBy !== 'newest' || searchQuery.trim();
  
  if (!hasActiveFilters) return null;

  const removeTag = (tagId: string) => {
    onFiltersChange({
      ...filters,
      tags: filters.tags.filter(id => id !== tagId)
    });
  };

  const resetSort = () => {
    onFiltersChange({
      ...filters,
      sortBy: 'newest'
    });
  };

  const clearSearch = () => {
    onSearchChange('');
  };

  const clearAllFilters = () => {
    onFiltersChange({ tags: [], sortBy: 'newest' });
    onSearchChange('');
  };

  const selectedTags = tags.filter(tag => filters.tags.includes(tag.id));

  const getSortLabel = (sortBy: string) => {
    switch (sortBy) {
      case 'newest': return '新しい順';
      case 'oldest': return '古い順';
      case 'popular': return '人気順';
      case 'random': return 'ランダム';
      default: return sortBy;
    }
  };

  return (
    <div className="w-full bg-gray-50 border-b border-gray-200 px-2 sm:px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <span className="text-sm text-gray-600 font-medium">アクティブフィルター:</span>
            
            <AnimatePresence>
              {/* Search Query Badge */}
              {searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  <span className="mr-1">🔍</span>
                  <span className="max-w-20 truncate">"{searchQuery}"</span>
                  <button
                    onClick={clearSearch}
                    className="ml-2 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}

              {/* Sort Badge */}
              {filters.sortBy !== 'newest' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  <span className="mr-1">📊</span>
                  <span>{getSortLabel(filters.sortBy)}</span>
                  <button
                    onClick={resetSort}
                    className="ml-2 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}

              {/* Tag Badges */}
              {selectedTags.map((tag) => (
                <motion.div
                  key={tag.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center text-white px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: tag.color }}
                >
                  <span>{tag.name}</span>
                  <button
                    onClick={() => removeTag(tag.id)}
                    className="ml-2 hover:bg-black hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Clear All Button */}
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            すべてクリア
          </button>
        </div>
      </div>
    </div>
  );
};