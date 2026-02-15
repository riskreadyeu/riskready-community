"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Clock, User, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RevisionEntry } from "./types";

interface RevisionHistoryProps {
  revisions: RevisionEntry[];
  title?: string;
  className?: string;
  maxVisible?: number;
}

export function RevisionHistory({
  revisions,
  title = "Revision History",
  className,
  maxVisible,
}: RevisionHistoryProps) {
  // Sort by date descending (newest first)
  const sortedRevisions = [...revisions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const visibleRevisions = maxVisible
    ? sortedRevisions.slice(0, maxVisible)
    : sortedRevisions;
  const hasMore = maxVisible && sortedRevisions.length > maxVisible;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <Badge variant="secondary">{revisions.length} revisions</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {revisions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No revision history available
          </div>
        ) : (
          <div className="relative">
            {/* Timeline */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {visibleRevisions.map((revision, index) => (
                <div key={index} className="relative flex gap-4 pl-10">
                  {/* Timeline Dot */}
                  <div
                    className={cn(
                      "absolute left-2 w-5 h-5 rounded-full flex items-center justify-center",
                      index === 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border-2 border-background"
                    )}
                  >
                    {index === 0 ? (
                      <span className="text-[10px] font-bold">v</span>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      "flex-1 p-4 rounded-lg border",
                      index === 0 && "bg-primary/5 border-primary/30"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={index === 0 ? "default" : "outline"}
                          className="font-mono"
                        >
                          v{revision.version}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(revision.date)}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm mb-3">{revision.description}</p>

                    {/* Footer */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>By {revision.author}</span>
                      </div>
                      {revision.approvedBy && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span>Approved by {revision.approvedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Show More */}
            {hasMore && (
              <div className="relative mt-4 pl-10">
                <div className="absolute left-2 w-5 h-5 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                </div>
                <div className="text-sm text-muted-foreground">
                  + {sortedRevisions.length - maxVisible} more revision
                  {sortedRevisions.length - maxVisible !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
