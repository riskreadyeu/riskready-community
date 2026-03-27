import { Section } from "@/components/archer/section";
import { EmptyState } from "@/components/archer/empty-state";
import { GitCompare } from "lucide-react";

// =============================================================================
// Component
// =============================================================================

/**
 * SOAChangesTab - Version comparison placeholder (future feature).
 *
 * Displays EmptyState indicating this feature is planned for future release.
 * Will eventually show version-to-version diff of SOA entries.
 */
export function SOAChangesTab() {
  return (
    <Section title="Version Changes" icon={GitCompare}>
      <EmptyState
        icon={<GitCompare />}
        title="Version Comparison Coming Soon"
        description="This tab will display changes between SOA versions, allowing you to see what entries were added, modified, or removed."
      />
    </Section>
  );
}
