import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { DocumentReview } from "@/lib/policies-api";

interface PolicyReviewsTabProps {
  reviews: DocumentReview[];
}

export function PolicyReviewsTab({ reviews }: PolicyReviewsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Review History</CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-lg bg-secondary/30 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{review.outcome.replace(/_/g, " ")}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.reviewDate).toLocaleDateString()}
                  </span>
                </div>
                {review.findings && (
                  <p className="text-sm mb-2">
                    <span className="font-medium">Findings:</span> {review.findings}
                  </p>
                )}
                {review.recommendations && (
                  <p className="text-sm mb-2">
                    <span className="font-medium">Recommendations:</span>{" "}
                    {review.recommendations}
                  </p>
                )}
                {review.reviewedBy && (
                  <p className="text-xs text-muted-foreground">
                    Reviewed by {review.reviewedBy.firstName} {review.reviewedBy.lastName}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No reviews yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
