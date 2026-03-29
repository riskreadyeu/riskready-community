
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoleEntry } from "./types";

interface RolesResponsibilitiesProps {
  roles: RoleEntry[];
  title?: string;
  className?: string;
  showRaciMatrix?: boolean;
}

const raciColors: Record<string, string> = {
  R: "bg-blue-500 text-white",
  A: "bg-red-500 text-white",
  C: "bg-amber-500 text-white",
  I: "bg-green-500 text-white",
};

const raciLabels: Record<string, string> = {
  R: "Responsible",
  A: "Accountable",
  C: "Consulted",
  I: "Informed",
};

export function RolesResponsibilities({
  roles,
  title = "Roles & Responsibilities",
  className,
  showRaciMatrix = true,
}: RolesResponsibilitiesProps) {
  // Check if we have RACI data
  const hasRaciData = roles.some((role) => role.raciMatrix && Object.keys(role.raciMatrix).length > 0);
  
  // Get all unique activities from RACI matrices
  const activities = hasRaciData
    ? [...new Set(roles.flatMap((r) => Object.keys(r.raciMatrix || {})))]
    : [];

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Role Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-2">{role.role}</h4>
                  {role.responsibilities.length > 0 && (
                    <ul className="space-y-1.5">
                      {role.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          {resp}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RACI Matrix */}
        {showRaciMatrix && hasRaciData && activities.length > 0 && (
          <div className="mt-8">
            <h4 className="text-sm font-semibold mb-4">RACI Matrix</h4>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Activity
                    </th>
                    {roles.map((role, i) => (
                      <th
                        key={i}
                        className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {role.role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activities.map((activity, aIndex) => (
                    <tr
                      key={activity}
                      className={aIndex % 2 === 0 ? "bg-background" : "bg-muted/10"}
                    >
                      <td className="px-4 py-3 text-sm font-medium">{activity}</td>
                      {roles.map((role, rIndex) => {
                        const raci = role.raciMatrix?.[activity];
                        return (
                          <td key={rIndex} className="px-4 py-3 text-center">
                            {raci && (
                              <Badge
                                className={cn(
                                  "w-8 h-8 rounded-full p-0 flex items-center justify-center text-xs font-bold",
                                  raciColors[raci]
                                )}
                                title={raciLabels[raci]}
                              >
                                {raci}
                              </Badge>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* RACI Legend */}
            <div className="mt-4 flex flex-wrap gap-4">
              {Object.entries(raciColors).map(([key, color]) => (
                <div key={key} className="flex items-center gap-2">
                  <Badge className={cn("w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs", color)}>
                    {key}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{raciLabels[key]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
