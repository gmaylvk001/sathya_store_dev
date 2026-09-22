// components/CompareButton.jsx
//
// Reusable "Add to Compare" toggle button.
// Used in: product cards (icon-only variant) and product detail pages (text variant).
//
// Props:
//   product   — full product object (needs _id, category_new, name)
//   variant   — 'icon' | 'text' (default: 'icon')
//   className — optional override

'use client';

import { useState, useEffect } from 'react';
import { useCompare } from '@/context/CompareContext';
import { GitCompare } from 'lucide-react';

const CompareButton = ({
  product,
  variant = 'icon',
  className = '',
}) => {
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const [inCompare, setInCompare] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Keep local state in sync with context (product card re-renders)
  useEffect(() => {
    setInCompare(isInCompare(product?._id));
  }, [product?._id, isInCompare]);

  if (!product?._id) return null;

  const handleClick = async (e) => {
    e.preventDefault();    // Prevent card link navigation
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    if (inCompare) {
      await removeFromCompare(product._id);
    } else {
      await addToCompare(product);
    }
    setIsLoading(false);
  };

  // ── Icon-only variant (used in product cards) ─────────────────────────────
  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        aria-label={
          inCompare
            ? `Remove ${product.name || 'product'} from compare`
            : `Add ${product.name || 'product'} to compare`
        }
        title={inCompare ? 'Remove from Compare' : 'Add to Compare'}
        className={
          className
            ? `${className} ${
                inCompare
                  ? 'text-blue-600 border-blue-500 bg-blue-50'
                  : 'text-gray-500 hover:text-blue-600'
              }`
            : `w-7 h-7 rounded-full bg-white/90 backdrop-blur-md shadow-xs border flex items-center justify-center transition-all active:scale-95 ${
                inCompare
                  ? 'border-blue-400 text-blue-600 bg-blue-50'
                  : 'border-gray-100 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 hover:scale-110'
              }`
        }
      >
        <GitCompare
          size={14}
          strokeWidth={inCompare ? 2.5 : 1.8}
          className={`transition-colors ${isLoading ? 'opacity-50' : ''}`}
        />
      </button>
    );
  }

  // ── Text variant (used in product detail pages) ───────────────────────────
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      aria-label={
        inCompare
          ? `Remove ${product.name || 'product'} from compare list`
          : `Add ${product.name || 'product'} to compare list`
      }
      className={
        className ||
        `inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-200 active:scale-95 ${
          inCompare
            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
        }`
      }
    >
      <GitCompare size={16} strokeWidth={2} />
      <span>{isLoading ? '...' : inCompare ? 'Added to Compare' : 'Compare'}</span>
    </button>
  );
};

export default CompareButton;
