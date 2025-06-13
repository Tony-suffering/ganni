import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag as TagIcon } from 'lucide-react';
import { Tag, FilterOptions } from '../types';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  tags,
  filters,
  onFiltersChange
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Save and restore scroll position
  useEffect(() => {
    const panelElement = panelRef.current;
    
    const handleScroll = () => {
      if (panelElement) {
        setScrollPosition(panelElement.scrollTop);
      }
    };

    if (panelElement && isOpen) {
      panelElement.addEventListener('scroll', handleScroll, { passive: true });
      // Restore scroll position
      setTimeout(() => {
        if (panelElement) {
          panelElement.scrollTop = scrollPosition;
        }
      }, 100);
      
      return () => {
        panelElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isOpen, scrollPosition]);

  const handleTagToggle = (tagId: string) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter(id => id !== tagId)
      : [...filters.tags, tagId];
    
    onFiltersChange({ ...filters, tags: newTags });
  };

  const clearFilters = () => {
    onFiltersChange({
      tags: [],
      sortBy: 'newest'
    });
    setScrollPosition(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-semibold text-neutral-900">
                  フィルター
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div 
              ref={panelRef}
              className="flex-1 p-6 overflow-y-auto scroll-container"
            >
              <div className="space-y-6">
                {/* Sort By */}
                <div>
                  <h3 className="flex items-center text-sm font-medium text-neutral-700 mb-3">
                    <TagIcon className="w-4 h-4 mr-2" />
                    並び順
                  </h3>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as any })}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                  >
                    <option value="newest">新しい順</option>
                    <option value="oldest">古い順</option>
                    <option value="popular">人気順（AI応答数）</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="flex items-center text-sm font-medium text-neutral-700 mb-3">
                    <TagIcon className="w-4 h-4 mr-2" />
                    タグ
                  </h3>
                  <div className="max-h-48 overflow-y-auto scroll-container border border-neutral-200 rounded-lg p-3">
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => handleTagToggle(tag.id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                            filters.tags.includes(tag.id)
                              ? 'text-white'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                          style={{
                            backgroundColor: filters.tags.includes(tag.id) ? tag.color : undefined
                          }}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={clearFilters}
                  className="w-full py-2 text-sm text-neutral-600 hover:text-neutral-800 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  フィルターをクリア
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};