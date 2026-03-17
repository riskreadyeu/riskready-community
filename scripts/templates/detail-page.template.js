/**
 * Detail Page Template
 * 
 * Generates a standardized detail page with:
 * - DetailHero header
 * - 2-column layout (main + sidebar)
 * - DetailStatCards
 * - Related items section
 */

function generate({ name, modulePath }) {
  const entityLower = name.toLowerCase();
  const entityPlural = `${entityLower}s`;
  
  return `import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { DetailHero } from "@/components/controls/detail-components/detail-hero";
import { DetailStatCard } from "@/components/controls/detail-components/detail-stat-card";
import {
  Edit,
  Calendar,
  User,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

// TODO: Import your API functions
// import { get${name}, type ${name} } from "@/lib/${modulePath}-api";

export default function ${name}DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [${entityLower}, set${name}] = useState<any>(null);

  useEffect(() => {
    if (id && id !== 'new') loadData();
  }, [id]);

  const loadData = async () => {
    if (!id || id === 'new') return;
    try {
      setLoading(true);
      
      // TODO: Replace with your API call
      // const data = await get${name}(id);
      const data = null;
      
      set${name}(data);
    } catch (err) {
      console.error("Error loading ${entityLower}:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!${entityLower}) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">${name} Not Found</h3>
          <Button onClick={() => navigate("/${modulePath}/${entityPlural}")} className="mt-4">
            Back to ${name} List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <DetailHero
        backLink="/${modulePath}/${entityPlural}"
        backLabel="Back to ${name} List"
        icon={<AlertCircle className="w-6 h-6 text-primary" />}
        badge={
          <>
            <Badge variant="outline">Status Badge</Badge>
          </>
        }
        title={${entityLower}.name || "${name} Title"}
        subtitle={${entityLower}.id || "ID"}
        description={${entityLower}.description || "Description"}
        metadata={[
          { 
            label: "Created", 
            value: ${entityLower}.createdAt 
              ? format(new Date(${entityLower}.createdAt), "dd MMM yyyy")
              : "N/A",
            icon: <Calendar className="w-3 h-3 text-muted-foreground" />
          },
          // TODO: Add more metadata
        ]}
        actions={
          <>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Description
                </Label>
                <p className="mt-2 text-sm whitespace-pre-wrap">
                  {${entityLower}.description || "No description available"}
                </p>
              </div>

              <Separator />

              {/* TODO: Add more sections */}
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Additional Information
                </Label>
                <p className="mt-2 text-sm text-muted-foreground italic">
                  Add your content here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata Stats */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailStatCard
                icon={<Calendar className="w-4 h-4 text-primary" />}
                label="Created"
                value={
                  ${entityLower}.createdAt
                    ? format(new Date(${entityLower}.createdAt), "dd MMM yyyy")
                    : "N/A"
                }
              />

              {/* TODO: Add more stat cards */}
            </CardContent>
          </Card>

          {/* Related Items */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Related Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* TODO: Add related items */}
              <p className="text-sm text-muted-foreground italic">
                No related items
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
`;
}

module.exports = { generate };
