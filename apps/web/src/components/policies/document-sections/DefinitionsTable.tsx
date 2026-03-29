
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DefinitionEntry } from "./types";

interface DefinitionsTableProps {
  definitions: DefinitionEntry[];
  title?: string;
  searchable?: boolean;
  className?: string;
}

export function DefinitionsTable({
  definitions,
  title = "Definitions",
  searchable = true,
  className,
}: DefinitionsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDefinitions = searchTerm
    ? definitions.filter(
        (d) =>
          d.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.definition.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : definitions;

  // Sort alphabetically by term
  const sortedDefinitions = [...filteredDefinitions].sort((a, b) =>
    a.term.localeCompare(b.term)
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <Badge variant="secondary">{definitions.length} terms</Badge>
        </div>
        {searchable && definitions.length > 5 && (
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search definitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {sortedDefinitions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No definitions match your search" : "No definitions"}
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-1/4">
                    Term
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Definition
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedDefinitions.map((def, index) => (
                  <tr
                    key={def.id || index}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      index % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    <td className="px-4 py-3 align-top">
                      <span className="font-semibold text-sm">{def.term}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                        {def.definition}
                      </p>
                      {def.source && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Source: {def.source}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
