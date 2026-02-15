import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { createSOA, createSOAFromControls } from '@/lib/controls-api';
import { PageHeader } from '@/components/common';

export default function SOACreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<'from-controls' | 'empty'>('from-controls');
  
  const [formData, setFormData] = useState({
    version: '2.0',
    name: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.version.trim()) {
      setError('Version is required');
      return;
    }

    try {
      setLoading(true);
      // TODO: Get organisationId from auth context
      const orgId = 'cmj7b9wys0000eocjc9zm0j9m'; // Default org from seed
      
      const payload = {
        version: formData.version,
        name: formData.name || undefined,
        notes: formData.notes || undefined,
        organisationId: orgId,
      };

      let soa;
      if (createMode === 'from-controls') {
        soa = await createSOAFromControls(payload);
      } else {
        soa = await createSOA(payload);
      }
      
      navigate(`/controls/soa/${soa.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create SOA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Create New SOA"
        description="Create a new Statement of Applicability version"
        actions={
          <Button variant="outline" onClick={() => navigate('/controls/soa')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to SOA List
          </Button>
        }
      />

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>SOA Details</CardTitle>
            <CardDescription>
              Define the version and metadata for this Statement of Applicability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Creation Mode */}
            <div className="space-y-3">
              <Label>Creation Method</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setCreateMode('from-controls')}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-lg border-2 text-left transition-colors",
                    createMode === 'from-controls'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div className="font-medium">From Existing Controls</div>
                  <div className="text-xs text-muted-foreground">
                    Pre-populate with all 93 ISO 27001 controls
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode('empty')}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-lg border-2 text-left transition-colors",
                    createMode === 'empty'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div className="font-medium">Empty SOA</div>
                  <div className="text-xs text-muted-foreground">
                    Start with a blank document
                  </div>
                </button>
              </div>
            </div>

            {/* Version */}
            <div className="space-y-2">
              <Label htmlFor="version">Version *</Label>
              <Input
                id="version"
                placeholder="e.g., 1.0, 2.0"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Use semantic versioning (e.g., 1.0, 1.1, 2.0)
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                placeholder="e.g., Initial SOA, 2024 Annual Review"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or context for this SOA version..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/controls/soa')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              'Creating...'
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create SOA
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
