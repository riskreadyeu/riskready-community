import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Construction } from "lucide-react";

export default function IncidentLessonsPage() {
  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Lessons Learned
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggregate view of all post-incident learnings and improvements
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
            <Lightbulb className="h-8 w-8 text-yellow-500" />
          </div>
          <h2 className="mt-6 text-lg font-semibold">Knowledge Base</h2>
          <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
            This page will aggregate lessons learned from all incidents,
            track corrective action implementation, and identify recurring themes
            across detection, response, communication, and tooling categories.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Construction className="h-4 w-4" />
            <span>Coming soon</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

