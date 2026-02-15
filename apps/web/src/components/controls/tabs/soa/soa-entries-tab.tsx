import { useState } from "react";
import { Section } from "@/components/archer/section";
import { SOAEntryTable, type SOAEntryTableFilters } from "@/components/controls/soa/soa-entry-table";
import { List } from "lucide-react";
import type { ImplementationStatus } from "@/lib/controls-api";

// =============================================================================
// Types
// =============================================================================

export interface SOAEntriesTabProps {
  entries: import("@/lib/controls-api").SOAEntry[];
  isEditable: boolean;
  onEntryUpdate: (
    entryId: string,
    data: {
      applicable: boolean;
      justificationIfNa?: string;
      implementationStatus: ImplementationStatus;
      implementationDesc?: string;
      parentRiskId?: string;
      scenarioIds?: string;
    }
  ) => Promise<void>;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SOAEntriesTab - Control entries table with inline editing.
 *
 * Uses SOAEntryTable for display with filters. Clicking a row expands
 * an inline edit form below it (no modal).
 */
export function SOAEntriesTab({ entries, isEditable, onEntryUpdate }: SOAEntriesTabProps) {
  const [filters, setFilters] = useState<SOAEntryTableFilters>({
    search: "",
    theme: "all",
    applicable: "all",
    implStatus: "all",
  });

  const handleFiltersChange = (newFilters: Partial<SOAEntryTableFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return (
    <Section title="Control Entries" icon={List}>
      <SOAEntryTable
        entries={entries}
        isEditable={isEditable}
        onEntrySave={onEntryUpdate}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
    </Section>
  );
}
