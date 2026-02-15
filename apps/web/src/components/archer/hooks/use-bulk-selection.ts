import { useState, useCallback, useMemo } from "react";

/**
 * Hook for managing bulk selection state in lists and tables.
 *
 * @param items - Array of items that can be selected
 * @param getItemId - Function to extract unique ID from an item
 */
export function useBulkSelection<T>(
  items: T[],
  getItemId: (item: T) => string
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get all item IDs
  const allIds = useMemo(
    () => items.map((item) => getItemId(item)),
    [items, getItemId]
  );

  // Check if an item is selected
  const isSelected = useCallback(
    (item: T): boolean => {
      return selectedIds.has(getItemId(item));
    },
    [selectedIds, getItemId]
  );

  // Check if an item ID is selected
  const isIdSelected = useCallback(
    (id: string): boolean => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  // Toggle selection for a single item
  const toggleItem = useCallback(
    (item: T) => {
      const id = getItemId(item);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [getItemId]
  );

  // Toggle selection for a single item by ID
  const toggleId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select a single item (replacing current selection)
  const selectItem = useCallback(
    (item: T) => {
      const id = getItemId(item);
      setSelectedIds(new Set([id]));
    },
    [getItemId]
  );

  // Add items to selection
  const addToSelection = useCallback(
    (itemsToAdd: T[]) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        itemsToAdd.forEach((item) => {
          next.add(getItemId(item));
        });
        return next;
      });
    },
    [getItemId]
  );

  // Remove items from selection
  const removeFromSelection = useCallback(
    (itemsToRemove: T[]) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        itemsToRemove.forEach((item) => {
          next.delete(getItemId(item));
        });
        return next;
      });
    },
    [getItemId]
  );

  // Select all items
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allIds));
  }, [allIds]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Toggle select all (select all if not all selected, clear if all selected)
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === allIds.length && allIds.length > 0) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [selectedIds.size, allIds.length, clearSelection, selectAll]);

  // Get selected items
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(getItemId(item))),
    [items, selectedIds, getItemId]
  );

  // Get selected IDs as array
  const selectedIdsArray = useMemo(
    () => Array.from(selectedIds),
    [selectedIds]
  );

  // Check various selection states
  const hasSelection = selectedIds.size > 0;
  const selectedCount = selectedIds.size;
  const allSelected = allIds.length > 0 && selectedIds.size === allIds.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < allIds.length;

  return {
    // State
    selectedIds: selectedIdsArray,
    selectedItems,
    selectedCount,
    hasSelection,
    allSelected,
    someSelected,

    // Predicates
    isSelected,
    isIdSelected,

    // Actions
    toggleItem,
    toggleId,
    selectItem,
    addToSelection,
    removeFromSelection,
    selectAll,
    clearSelection,
    toggleSelectAll,

    // Raw setter for advanced use cases
    setSelectedIds: (ids: string[]) => setSelectedIds(new Set(ids)),
  };
}

export type UseBulkSelectionReturn<T> = ReturnType<typeof useBulkSelection<T>>;
