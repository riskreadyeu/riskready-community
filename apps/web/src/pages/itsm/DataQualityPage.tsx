import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  BarChart3,
  Users,
  Building,
  MapPin,
  FileText,
  Clock,
  Shield,
  RefreshCw,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common';
import { getDataQuality } from '@/lib/itsm-api';

interface DataQualityResult {
  totalAssets: number;
  completeness: {
    withOwner: number;
    withDepartment: number;
    withLocation: number;
    withDescription: number;
    withDataClassification: number;
    withCriticality: number;
    withRto: number;
    withRpo: number;
  };
  percentages: {
    ownerPercent: number;
    departmentPercent: number;
    locationPercent: number;
    descriptionPercent: number;
    rtoRpoPercent: number;
    overallScore: number;
  };
  issues: Array<{
    type: string;
    count: number;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }>;
}

export default function DataQualityPage() {
  const [data, setData] = useState<DataQualityResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDataQuality();
  }, []);

  async function loadDataQuality() {
    setLoading(true);
    try {
      const result = await getDataQuality();
      setData(result);
    } catch (err) {
      console.error('Failed to load data quality:', err);
      toast.error('Failed to load data quality metrics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-6">Failed to load data</div>;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="CMDB Data Quality"
        description="Monitor and improve configuration data completeness and accuracy"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadDataQuality}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Export coming soon")}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      {/* Overall Score */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Overall Data Quality Score</h2>
              <p className="text-sm text-muted-foreground">
                Based on completeness of key asset fields
              </p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${getScoreColor(data.percentages.overallScore)}`}>
                {data.percentages.overallScore}%
              </div>
              <div className="text-sm text-muted-foreground">
                {data.totalAssets} total assets
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={data.percentages.overallScore}
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      {data.issues.length > 0 && (
        <Card className="glass-card border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Data Quality Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.issues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div>
                      <div className="font-medium">{issue.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {issue.count} asset{issue.count !== 1 ? 's' : ''} affected
                      </div>
                    </div>
                  </div>
                  {getSeverityBadge(issue.severity)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completeness Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Asset Ownership</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className={`text-2xl font-bold ${getScoreColor(data.percentages.ownerPercent)}`}>
                {data.percentages.ownerPercent}%
              </div>
              <div className="text-sm text-muted-foreground">
                {data.completeness.withOwner} / {data.totalAssets}
              </div>
            </div>
            <Progress
              value={data.percentages.ownerPercent}
              className="mt-2 h-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Assets with assigned owner
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Department Assignment</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className={`text-2xl font-bold ${getScoreColor(data.percentages.departmentPercent)}`}>
                {data.percentages.departmentPercent}%
              </div>
              <div className="text-sm text-muted-foreground">
                {data.completeness.withDepartment} / {data.totalAssets}
              </div>
            </div>
            <Progress
              value={data.percentages.departmentPercent}
              className="mt-2 h-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Assets linked to department
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Location Data</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className={`text-2xl font-bold ${getScoreColor(data.percentages.locationPercent)}`}>
                {data.percentages.locationPercent}%
              </div>
              <div className="text-sm text-muted-foreground">
                {data.completeness.withLocation} / {data.totalAssets}
              </div>
            </div>
            <Progress
              value={data.percentages.locationPercent}
              className="mt-2 h-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Assets with location or cloud provider
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Description</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className={`text-2xl font-bold ${getScoreColor(data.percentages.descriptionPercent)}`}>
                {data.percentages.descriptionPercent}%
              </div>
              <div className="text-sm text-muted-foreground">
                {data.completeness.withDescription} / {data.totalAssets}
              </div>
            </div>
            <Progress
              value={data.percentages.descriptionPercent}
              className="mt-2 h-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Assets with description
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">RTO/RPO (NIS2)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className={`text-2xl font-bold ${getScoreColor(data.percentages.rtoRpoPercent)}`}>
                {data.percentages.rtoRpoPercent}%
              </div>
              <div className="text-sm text-muted-foreground">
                RTO: {data.completeness.withRto}, RPO: {data.completeness.withRpo}
              </div>
            </div>
            <Progress
              value={data.percentages.rtoRpoPercent}
              className="mt-2 h-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Recovery objectives defined
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Classification</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-green-500">100%</div>
              <div className="text-sm text-muted-foreground">
                {data.completeness.withCriticality} / {data.totalAssets}
              </div>
            </div>
            <Progress value={100} className="mt-2 h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              All assets have default classification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.percentages.ownerPercent < 100 && (
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Assign owners to all assets</div>
                  <div className="text-sm text-muted-foreground">
                    {data.totalAssets - data.completeness.withOwner} assets need an owner assigned
                  </div>
                </div>
              </div>
            )}
            {data.percentages.rtoRpoPercent < 80 && (
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Define RTO/RPO for critical assets (NIS2)</div>
                  <div className="text-sm text-muted-foreground">
                    Recovery objectives are required for NIS2 compliance
                  </div>
                </div>
              </div>
            )}
            {data.percentages.locationPercent < 100 && (
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Set location or cloud provider</div>
                  <div className="text-sm text-muted-foreground">
                    {data.totalAssets - data.completeness.withLocation} assets need location data
                  </div>
                </div>
              </div>
            )}
            {data.percentages.overallScore >= 90 && (
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                <div>
                  <div className="font-medium text-green-600">Excellent data quality!</div>
                  <div className="text-sm text-muted-foreground">
                    Your CMDB data quality is above 90%. Keep up the good work!
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
