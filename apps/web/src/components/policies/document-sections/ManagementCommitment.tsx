
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Quote, PenLine, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ManagementCommitmentData } from "./types";

interface ManagementCommitmentProps {
  data: ManagementCommitmentData;
  className?: string;
}

export function ManagementCommitment({ data, className }: ManagementCommitmentProps) {
  return (
    <Card className={cn("border-l-4 border-l-primary", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Quote className="h-5 w-5 text-primary" />
          Management Commitment Statement
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main Statement */}
        <blockquote className="bg-primary/5 rounded-lg p-6 border-l-4 border-primary/30">
          <p className="text-sm leading-relaxed text-foreground/90 italic whitespace-pre-wrap">
            {data.statement}
          </p>

          {/* Bullet Point Commitments */}
          {data.commitments && data.commitments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-primary/20">
              <p className="text-sm font-medium mb-3">We commit to:</p>
              <ul className="space-y-2">
                {data.commitments.map((commitment, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{commitment}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </blockquote>

        {/* Signature Area */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <PenLine className="h-4 w-4" />
            <span className="text-sm font-medium">Authorized Signature</span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Signature
              </p>
              <div className="h-12 border-b-2 border-dashed border-muted-foreground/30" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Name
              </p>
              {data.signatory ? (
                <p className="font-medium">{data.signatory}</p>
              ) : (
                <div className="h-6 border-b border-dashed border-muted-foreground/30 w-32" />
              )}
              {data.signatoryTitle ? (
                <p className="text-sm text-muted-foreground">{data.signatoryTitle}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">[Title]</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Date
              </p>
              {data.signatureDate ? (
                <p className="font-medium">
                  {new Date(data.signatureDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              ) : (
                <div className="h-6 border-b-2 border-dashed border-muted-foreground/30 w-32" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
