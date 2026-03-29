
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ExternalLink, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ISOControlEntry } from "./types";

interface ISOControlsTableProps {
  controls: ISOControlEntry[];
  title?: string;
  sectionNumber?: string;
  className?: string;
}

export function ISOControlsTable({
  controls,
  title = "ISO 27001:2022 Controls Addressed",
  sectionNumber,
  className,
}: ISOControlsTableProps) {
  // Separate primary and supporting controls
  const primaryControls = controls.filter((c) => c.isPrimary);
  const supportingControls = controls.filter((c) => !c.isPrimary);

  const renderControlsTable = (controlList: ISOControlEntry[], showRelevance = true) => (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-24">
              Control
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-48">
              Title
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {showRelevance ? "Description and Relevance" : "Relevance to This Document"}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {controlList.map((control, index) => (
            <tr
              key={control.controlId}
              className={cn(
                "hover:bg-muted/30 transition-colors",
                index % 2 === 0 ? "bg-background" : "bg-muted/10"
              )}
            >
              <td className="px-4 py-3 align-top">
                <Link
                  to={`/controls/${control.controlId}`}
                  className="font-mono text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span className="font-bold">{control.controlId}</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </td>
              <td className="px-4 py-3 align-top">
                <span className="text-sm font-semibold">
                  {control.controlTitle}
                </span>
              </td>
              <td className="px-4 py-3 align-top">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {control.relevance}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          {sectionNumber && <span className="text-muted-foreground">{sectionNumber}.</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {controls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No ISO 27001 controls mapped
          </div>
        ) : (
          <div className="space-y-8">
            {/* Primary Controls Section */}
            {primaryControls.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <h4 className="text-sm font-semibold">
                    {sectionNumber ? `${sectionNumber}.1` : ""} Primary Controls
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {primaryControls.length}
                  </Badge>
                </div>
                {renderControlsTable(primaryControls, true)}
              </div>
            )}

            {/* Supporting Controls Section */}
            {supportingControls.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-sm font-semibold">
                    {sectionNumber ? `${sectionNumber}.2` : ""} Supporting Controls
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {supportingControls.length}
                  </Badge>
                </div>
                {renderControlsTable(supportingControls, false)}
              </div>
            )}

            {/* If no primary/supporting distinction, show all controls */}
            {primaryControls.length === 0 && supportingControls.length === 0 && controls.length > 0 && (
              renderControlsTable(controls, true)
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
