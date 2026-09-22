// context/CompareContext.js
//
// Compare feature state management.
//
// Routing logic:
//   - Guest (no localStorage 'token'): state lives entirely in localStorage
//     under key 'compare_list' as Array<{ productId, category_slug }>.
//     No MongoDB writes — purely client-side until login.
//   - Logged-in user: state is fetched from / written to MongoDB via the
//     /api/compare API routes. localStorage is used as an offline-first backup
//     and for the initial merge on login.
//
// On login event: call syncOnLogin() once to merge the localStorage list into
// MongoDB, then clear the localStorage list.
//
// Design principle: The context stores only references (productId, category_slug)
// for compare management. Full product data (productData) is fetched separately
// on the /compare page — the context does NOT embed product details.

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { toast } from 'react-toastify';
import { trackCompareAdd, trackCompareRemove } from '@/utils/compareHelpers';

const STORAGE_KEY = 'compare_list';
const MAX_COMPARE = 4;

const CompareContext = createContext({
  compareList: [],
  loading: false,
  error: null,
  addToCompare: () => {},
  removeFromCompare: () => {},
  clearCompare: () => {},
  isInCompare: () => false,
  syncOnLogin: async () => {},
  fetchFromDB: async () => {},
});

export const CompareProvider = ({ children }) => {
  // compareList: Array<{ productId: string, category_slug: string, productData?: object }>
  const [compareList, setCompareList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce ref to prevent rapid-fire API calls
  const debounceRef = useRef({});

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  };

  const isLoggedIn = () => Boolean(getToken());

  /** Read from localStorage for guests */
  const readLocalList = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  /** Write to localStorage for guests */
  const writeLocalList = useCallback((list) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      // Trigger cross-tab sync (mirrors WishlistContext pattern)
      localStorage.setItem('compare_updated', Date.now().toString());
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, []);

  /** Fetch the logged-in user's compare list from MongoDB */
  const fetchFromDB = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/compare', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCompareList(data.items || []);
      }
    } catch (err) {
      console.error('[CompareContext] fetchFromDB failed:', err);
      // Offline-first fallback: keep current state (or load from localStorage backup)
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initialization ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isLoggedIn()) {
      fetchFromDB();
    } else {
      // Guest: hydrate from localStorage
      setCompareList(readLocalList());
    }

    // Cross-tab sync via storage event (mirrors WishlistContext pattern)
    const handleStorageChange = (event) => {
      if (event.key === 'compare_updated') {
        if (isLoggedIn()) {
          fetchFromDB();
        } else {
          setCompareList(readLocalList());
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── isInCompare ────────────────────────────────────────────────────────────

  const isInCompare = useCallback(
    (productId) => {
      if (!productId) return false;
      return compareList.some(
        (item) => String(item.productId) === String(productId)
      );
    },
    [compareList]
  );

  // ── addToCompare ───────────────────────────────────────────────────────────

  const addToCompare = useCallback(
    async (product) => {
      if (!product?._id) return;

      const productId = String(product._id);
      const category_slug = product.category_new || '';

      // Already in list — nothing to do
      if (isInCompare(productId)) return;

      // ── Guest flow ──────────────────────────────────────────────────────
      if (!isLoggedIn()) {
        const currentList = readLocalList();

        // Validate max-4
        if (currentList.length >= MAX_COMPARE) {
          toast.error('Compare list is full. Remove an item to add a new one.', {
            position: 'top-center',
            autoClose: 3000,
          });
          return;
        }

        // Validate same-category
        if (
          currentList.length > 0 &&
          currentList[0].category_slug &&
          category_slug &&
          currentList[0].category_slug !== category_slug
        ) {
          toast.warn(
            `You can only compare products from the same category.`,
            { position: 'top-center', autoClose: 4000 }
          );
          return;
        }

        const newList = [...currentList, { productId, category_slug }];
        writeLocalList(newList);
        setCompareList(newList);
        toast.success(`"${product.name || 'Product'}" added to compare!`, {
          position: 'bottom-right',
          autoClose: 2000,
        });
        trackCompareAdd({ productId, productName: product.name, category_slug });
        return;
      }

      // ── Logged-in flow (optimistic UI) ──────────────────────────────────
      const optimisticItem = { productId, category_slug, productData: product };
      const previousList = compareList;

      // Optimistic add
      setCompareList((prev) => [...prev, optimisticItem]);

      // Debounce rapid clicks
      clearTimeout(debounceRef.current[productId]);
      debounceRef.current[productId] = setTimeout(async () => {
        try {
          const token = getToken();
          const res = await fetch('/api/compare', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ productId }),
          });

          const data = await res.json();

          if (!res.ok) {
            // Rollback optimistic update on error
            setCompareList(previousList);
            toast.error(data.error || 'Failed to add to compare', {
              position: 'top-center',
              autoClose: 3500,
            });
            return;
          }

          // Sync with server-confirmed list
          setCompareList(data.items || []);
          toast.success(`"${product.name || 'Product'}" added to compare!`, {
            position: 'bottom-right',
            autoClose: 2000,
          });
          trackCompareAdd({ productId, productName: product.name, category_slug });

        } catch (err) {
          // Network failure — rollback
          setCompareList(previousList);
          console.error('[CompareContext] addToCompare failed:', err);
        }
      }, 300);
    },
    [compareList, isInCompare, readLocalList, writeLocalList] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── removeFromCompare ──────────────────────────────────────────────────────

  const removeFromCompare = useCallback(
    async (productId) => {
      if (!productId) return;
      const pid = String(productId);

      // ── Guest flow ──────────────────────────────────────────────────────
      if (!isLoggedIn()) {
        const newList = readLocalList().filter((item) => String(item.productId) !== pid);
        writeLocalList(newList);
        setCompareList(newList);
        trackCompareRemove({ productId: pid, productName: '' });
        return;
      }

      // ── Logged-in flow (optimistic UI + rollback) ────────────────────────
      const previousList = compareList;
      // Optimistic remove
      setCompareList((prev) =>
        prev.filter((item) => String(item.productId) !== pid)
      );

      try {
        const token = getToken();
        const res = await fetch(`/api/compare/${pid}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          // Rollback on failure
          setCompareList(previousList);
          toast.error('Failed to remove from compare. Please try again.', {
            position: 'top-center',
            autoClose: 3000,
          });
          return;
        }

        const data = await res.json();
        // Sync with server-confirmed list
        setCompareList(data.items || []);
        trackCompareRemove({ productId: pid, productName: '' });

      } catch (err) {
        // Network failure — rollback
        setCompareList(previousList);
        console.error('[CompareContext] removeFromCompare failed:', err);
      }
    },
    [compareList, readLocalList, writeLocalList] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── clearCompare ───────────────────────────────────────────────────────────

  const clearCompare = useCallback(async () => {
    // ── Guest flow ────────────────────────────────────────────────────────
    if (!isLoggedIn()) {
      writeLocalList([]);
      setCompareList([]);
      return;
    }

    // ── Logged-in flow (optimistic UI) ────────────────────────────────────
    const previousList = compareList;
    setCompareList([]);

    try {
      const token = getToken();
      const res = await fetch('/api/compare', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setCompareList(previousList);
        toast.error('Failed to clear compare list.', {
          position: 'top-center',
          autoClose: 3000,
        });
      }
    } catch (err) {
      setCompareList(previousList);
      console.error('[CompareContext] clearCompare failed:', err);
    }
  }, [compareList, writeLocalList]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── syncOnLogin ────────────────────────────────────────────────────────────
  // Call this once immediately after a successful login to merge the guest's
  // localStorage compare list into MongoDB. Clears localStorage on success.

  const syncOnLogin = useCallback(async () => {
    const localList = readLocalList();
    setLoading(true);

    try {
      const token = getToken();
      if (!token) return;

      if (localList.length > 0) {
        // Send localStorage list to the merge endpoint
        const res = await fetch('/api/compare/merge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ localList }),
        });

        if (res.ok) {
          const data = await res.json();
          setCompareList(data.items || []);
          // Clear localStorage now that DB owns the authoritative list
          writeLocalList([]);
        } else {
          // Merge failed — fall back to plain DB fetch; keep localStorage intact
          await fetchFromDB();
        }
      } else {
        // No local items — just load DB list
        await fetchFromDB();
      }
    } catch (err) {
      console.error('[CompareContext] syncOnLogin failed:', err);
      // Fallback: try loading from DB anyway
      await fetchFromDB();
    } finally {
      setLoading(false);
    }
  }, [readLocalList, writeLocalList, fetchFromDB]);

  // ── Context value ──────────────────────────────────────────────────────────

  return (
    <CompareContext.Provider
      value={{
        compareList,
        loading,
        error,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        syncOnLogin,
        fetchFromDB,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => useContext(CompareContext);
