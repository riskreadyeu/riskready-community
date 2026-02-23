import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { linkEvidenceToEntity, type LinkEntityType } from "@/lib/evidence-api";
import { getControls } from "@/lib/controls-api";
import { getIncidents } from "@/lib/incidents-api";
import { getRisks } from "@/lib/risks-api";
import { getAssets, getChanges } from "@/lib/itsm-api";
import { getPolicies } from "@/lib/policies-api";

// Link type options for each entity type
const linkTypeOptions: Record<LinkEntityType, string[]> = {
  control: ["design", "implementation", "operating", "general"],
  capability: ["maturity", "assessment", "general"],
  test: ["test_result"],
  nonconformity: ["finding", "root_cause", "cap_implementation", "verification"],
  incident: ["forensic", "communication", "notification", "lessons_learned"],
  risk: ["assessment", "acceptance", "monitoring"],
  treatment: ["implementation", "approval", "progress"],
  policy: ["supporting", "appendix", "acknowledgment"],
  vendor: ["certification", "soc_report", "assessment", "contract"],
  assessment: ["response", "finding", "remediation"],
  contract: ["signed_contract", "amendment", "sla"],
  asset: ["configuration", "vulnerability_scan", "backup_verification"],
  change: ["approval", "test_result", "pir"],
  application: ["security_assessment", "pentest", "configuration"],
  isra: ["bia", "tva", "srl"],
};

// Entity type labels
const entityTypeLabels: Record<LinkEntityType, string> = {
  control: "Control",
  capability: "Capability",
  test: "Effectiveness Test",
  nonconformity: "Nonconformity",
  incident: "Incident",
  risk: "Risk",
  treatment: "Treatment Plan",
  policy: "Policy",
  vendor: "Vendor",
  assessment: "Vendor Assessment",
  contract: "Vendor Contract",
  asset: "Asset",
  change: "Change",
  application: "Application",
  isra: "ISRA",
};

interface Entity {
  id: string;
  name: string;
  reference?: string;
}

interface EvidenceLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidenceId: string;
  evidenceTitle?: string;
  onSuccess?: () => void;
}

// Search entities using real API endpoints where available
async function searchEntities(
  entityType: LinkEntityType,
  searchTerm: string
): Promise<Entity[]> {
  const searchParams = { take: 20, search: searchTerm || undefined };

  switch (entityType) {
    case "control": {
      const data = await getControls(searchParams);
      return data.results.map((c) => ({
        id: c.id,
        name: c.name,
        reference: c.controlId,
      }));
    }
    case "incident": {
      const data = await getIncidents(searchParams);
      return data.results.map((i) => ({
        id: i.id,
        name: i.title,
        reference: i.referenceNumber,
      }));
    }
    case "risk": {
      const data = await getRisks(searchParams);
      return data.results.map((r) => ({
        id: r.id,
        name: r.title,
        reference: r.riskId,
      }));
    }
    case "asset": {
      const data = await getAssets(searchParams);
      return data.results.map((a) => ({
        id: a.id,
        name: a.name,
        reference: a.assetTag,
      }));
    }
    case "change": {
      const data = await getChanges(searchParams);
      return data.results.map((ch) => ({
        id: ch.id,
        name: ch.title,
        reference: ch.changeRef,
      }));
    }
    case "policy": {
      const data = await getPolicies(searchParams);
      return data.results.map((p) => ({
        id: p.id,
        name: p.title,
        reference: p.documentId,
      }));
    }
    // TODO: Add API integration for remaining entity types when endpoints are available
    case "capability":
    case "test":
    case "nonconformity":
    case "treatment":
    case "vendor":
    case "assessment":
    case "contract":
    case "application":
    case "isra":
    default:
      return [];
  }
}

export function EvidenceLinkDialog({
  open,
  onOpenChange,
  evidenceId,
  evidenceTitle,
  onSuccess,
}: EvidenceLinkDialogProps) {
  const [entityType, setEntityType] = useState<LinkEntityType | null>(null);
  const [linkType, setLinkType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setEntityType(null);
      setLinkType("");
      setSearchTerm("");
      setSelectedEntity(null);
      setEntities([]);
      setError(null);
    }
  }, [open]);

  // Search entities when entity type or search term changes
  useEffect(() => {
    if (entityType) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setEntities([]);
    }
  }, [entityType, searchTerm]);

  const performSearch = async () => {
    if (!entityType) return;
    
    setSearching(true);
    setError(null);
    try {
      const results = await searchEntities(entityType, searchTerm);
      setEntities(results);
    } catch (err) {
      setError("Failed to search entities");
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleLink = async () => {
    if (!entityType || !selectedEntity) {
      setError("Please select an entity type and entity");
      return;
    }

    setLinking(true);
    setError(null);

    try {
      await linkEvidenceToEntity(
        evidenceId,
        entityType,
        selectedEntity.id,
        linkType || undefined,
        undefined, // notes - could add a notes field if needed
        undefined // createdById - will use current user from session
      );

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link evidence");
      console.error("Link error:", err);
    } finally {
      setLinking(false);
    }
  };

  const availableLinkTypes = entityType
    ? linkTypeOptions[entityType]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link Evidence to Entity</DialogTitle>
          <DialogDescription>
            {evidenceTitle && (
              <span className="block mt-1 text-sm font-medium">
                Evidence: {evidenceTitle}
              </span>
            )}
            Select an entity type and entity to link this evidence to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Entity Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="entityType">Entity Type *</Label>
            <Select
              value={entityType ?? ""}
              onValueChange={(value) => {
                setEntityType(value as LinkEntityType);
                setSelectedEntity(null);
                setLinkType("");
              }}
            >
              <SelectTrigger id="entityType">
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(entityTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity Search */}
          {entityType && (
            <div className="space-y-2">
              <Label htmlFor="entitySearch">Search Entity *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="entitySearch"
                  placeholder={`Search ${entityTypeLabels[entityType].toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Entity Results */}
              {searching ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : entities.length > 0 ? (
                <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-background">
                  {entities.map((entity) => (
                    <button
                      key={entity.id}
                      type="button"
                      onClick={() => setSelectedEntity(entity)}
                      className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 ${
                        selectedEntity?.id === entity.id
                          ? "bg-primary/10 border-primary/20"
                          : ""
                      }`}
                    >
                      <div className="font-medium text-sm">{entity.name}</div>
                      {entity.reference && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {entity.reference}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No entities found
                </div>
              ) : null}
            </div>
          )}

          {/* Link Type Selection */}
          {entityType && availableLinkTypes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="linkType">Link Type (optional)</Label>
              <Select value={linkType} onValueChange={setLinkType}>
                <SelectTrigger id="linkType">
                  <SelectValue placeholder="Select link type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {availableLinkTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Entity Display */}
          {selectedEntity && (
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <div className="text-xs text-muted-foreground mb-1">Selected Entity</div>
              <div className="font-medium">{selectedEntity.name}</div>
              {selectedEntity.reference && (
                <div className="text-sm text-muted-foreground mt-1">
                  {selectedEntity.reference}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={!entityType || !selectedEntity || linking}
          >
            {linking ? "Linking..." : "Link Evidence"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

