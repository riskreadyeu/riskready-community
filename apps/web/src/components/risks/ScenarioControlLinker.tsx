import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Shield,
  ShieldPlus,
  ShieldMinus,
  ShieldCheck,
  Search,
  Loader2,
  Star,
  StarOff,
  Settings,
  ExternalLink,
  Check,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getControls, type Control } from "@/lib/controls-api";
import {
  getScenarioLinkedControls,
  linkControlToScenario,
  unlinkControlFromScenario,
  updateScenarioControlLink,
  type ScenarioControlLink,
} from "@/lib/risks-api";

interface ScenarioControlLinkerProps {
  scenarioId: string;
  onLinksChanged?: () => void;
}

export function ScenarioControlLinker({
  scenarioId,
  onLinksChanged,
}: ScenarioControlLinkerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkedControls, setLinkedControls] = useState<ScenarioControlLink[]>([]);
  const [availableControls, setAvailableControls] = useState<Control[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [linkingControlId, setLinkingControlId] = useState<string | null>(null);
  const [unlinkingControlId, setUnlinkingControlId] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState<ScenarioControlLink | null>(null);
  const [editingLink, setEditingLink] = useState<ScenarioControlLink | null>(null);
  const [effectivenessWeight, setEffectivenessWeight] = useState(100);
  const [isPrimaryControl, setIsPrimaryControl] = useState(false);

  // Load linked controls and available controls when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, scenarioId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [linked, controls] = await Promise.all([
        getScenarioLinkedControls(scenarioId),
        getControls({ take: 500 }),
      ]);
      setLinkedControls(linked);
      setAvailableControls(controls.results);
    } catch (err) {
      console.error("Failed to load controls:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter available controls based on search and exclude already linked
  const linkedControlIds = new Set(linkedControls.map((lc) => lc.control.id));
  const filteredControls = availableControls.filter((control) => {
    if (linkedControlIds.has(control.id)) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      control.controlId.toLowerCase().includes(query) ||
      control.name.toLowerCase().includes(query) ||
      control.theme.toLowerCase().includes(query)
    );
  });

  const handleLink = async (control: Control) => {
    setLinkingControlId(control.id);
    try {
      const newLink = await linkControlToScenario(scenarioId, control.id, {
        effectivenessWeight: 100,
        isPrimaryControl: false,
      });
      setLinkedControls((prev) => [...prev, newLink]);
      onLinksChanged?.();
    } catch (err) {
      console.error("Failed to link control:", err);
    } finally {
      setLinkingControlId(null);
    }
  };

  const handleUnlink = async (link: ScenarioControlLink) => {
    setUnlinkingControlId(link.controlId);
    try {
      await unlinkControlFromScenario(scenarioId, link.controlId);
      setLinkedControls((prev) => prev.filter((lc) => lc.controlId !== link.controlId));
      onLinksChanged?.();
    } catch (err) {
      console.error("Failed to unlink control:", err);
    } finally {
      setUnlinkingControlId(null);
      setConfirmUnlink(null);
    }
  };

  const handleUpdateLink = async () => {
    if (!editingLink) return;
    try {
      const updated = await updateScenarioControlLink(
        scenarioId,
        editingLink.controlId,
        {
          effectivenessWeight,
          isPrimaryControl,
        }
      );
      setLinkedControls((prev) =>
        prev.map((lc) => (lc.controlId === editingLink.controlId ? updated : lc))
      );
      onLinksChanged?.();
      setEditingLink(null);
    } catch (err) {
      console.error("Failed to update link:", err);
    }
  };

  const openEditDialog = (link: ScenarioControlLink) => {
    setEditingLink(link);
    setEffectivenessWeight(link.effectivenessWeight);
    setIsPrimaryControl(link.isPrimaryControl);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <ShieldPlus className="w-4 h-4" />
            Manage Controls
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[600px] sm:w-[700px] lg:w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Link Controls to Scenario
            </SheetTitle>
            <SheetDescription>
              Link controls that mitigate this risk scenario. Control effectiveness
              affects residual risk calculation.
            </SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="space-y-4 py-4 mt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="space-y-6 mt-6">
              {/* Linked Controls Section */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  Linked Controls ({linkedControls.length})
                </h3>
                {linkedControls.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/30">
                    No controls linked to this scenario yet
                  </div>
                ) : (
                  <ScrollArea className="h-[250px] border rounded-lg">
                    <div className="p-2 space-y-2">
                      {linkedControls.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between p-2 rounded border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">
                                  {link.control.controlId}
                                </span>
                                {link.isPrimaryControl && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1 py-0"
                                  >
                                    <Star className="w-3 h-3 mr-0.5 fill-warning text-warning" />
                                    Primary
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0"
                                >
                                  {link.effectivenessWeight}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {link.control.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => openEditDialog(link)}
                                  >
                                    <Settings className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit link settings</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => setConfirmUnlink(link)}
                                    disabled={unlinkingControlId === link.controlId}
                                  >
                                    {unlinkingControlId === link.controlId ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <ShieldMinus className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Unlink control</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Available Controls Section */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ShieldPlus className="w-4 h-4" />
                  Available Controls
                </h3>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search controls by ID, name, or theme..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="h-[250px] border rounded-lg">
                  <div className="p-2 space-y-2">
                    {filteredControls.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4 text-center">
                        {searchQuery
                          ? "No controls found matching your search"
                          : "All controls are already linked"}
                      </div>
                    ) : (
                      filteredControls.map((control) => (
                        <button
                          type="button"
                          key={control.id}
                          className="w-full flex items-center justify-between p-3 rounded border bg-card hover:bg-primary/5 hover:border-primary/40 transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleLink(control)}
                          disabled={linkingControlId === control.id}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-medium">
                                  {control.controlId}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0"
                                >
                                  {control.theme}
                                </Badge>
                                <Badge
                                  variant={
                                    control.implementationStatus === "IMPLEMENTED"
                                      ? "default"
                                      : control.implementationStatus === "PARTIAL"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="text-[10px] px-1 py-0"
                                >
                                  {control.implementationStatus.replace("_", " ")}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {control.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            {linkingControlId === control.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : (
                              <ShieldPlus className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm Unlink Dialog */}
      <Dialog
        open={!!confirmUnlink}
        onOpenChange={() => setConfirmUnlink(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unlink Control?</DialogTitle>
            <DialogDescription>
              Are you sure you want to unlink{" "}
              <span className="font-mono font-medium">
                {confirmUnlink?.control.controlId}
              </span>{" "}
              from this scenario? This will affect residual risk calculation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUnlink(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmUnlink && handleUnlink(confirmUnlink)}
            >
              Unlink
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Link Settings Dialog */}
      <Dialog open={!!editingLink} onOpenChange={() => setEditingLink(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Control Link Settings
            </DialogTitle>
            <DialogDescription>
              Configure how this control affects residual risk calculation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Control</Label>
                <Link
                  to={`/controls/${editingLink?.control.id}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {editingLink?.control.controlId}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                {editingLink?.control.name}
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm flex items-center gap-2">
                Effectiveness Weight
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        How much of the control's effectiveness applies to this
                        scenario. 100% means full effect, 50% means half effect.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={effectivenessWeight}
                  onChange={(e) => setEffectivenessWeight(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="isPrimary"
                className="text-sm flex items-center gap-2"
              >
                {isPrimaryControl ? (
                  <Star className="w-4 h-4 fill-warning text-warning" />
                ) : (
                  <StarOff className="w-4 h-4 text-muted-foreground" />
                )}
                Primary Control
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Mark as primary if this is the main control for mitigating
                        this scenario. Only one control can be primary.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Switch
                id="isPrimary"
                checked={isPrimaryControl}
                onCheckedChange={(checked) =>
                  setIsPrimaryControl(checked)
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingLink(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLink}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
