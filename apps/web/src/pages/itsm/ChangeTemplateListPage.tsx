import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Play,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getChangeTemplates,
  updateChangeTemplate,
  createChangeFromTemplate,
  type ChangeTemplate,
  type ChangeCategory,
} from '@/lib/itsm-api';

const PAGE_SIZE = 20;

const securityImpactVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CRITICAL: 'destructive',
  HIGH: 'destructive',
  MEDIUM: 'secondary',
  LOW: 'outline',
  NONE: 'outline',
};

export default function ChangeTemplateListPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ChangeTemplate[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('true');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [page, categoryFilter, activeFilter]);

  async function loadTemplates() {
    setLoading(true);
    try {
      const params: any = { skip: page * PAGE_SIZE, take: PAGE_SIZE };
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (activeFilter !== 'all') params.isActive = activeFilter === 'true';
      if (search) params.search = search;
      const data = await getChangeTemplates(params);
      setTemplates(data.results);
      setCount(data.count);
    } catch (err) {
      console.error('Failed to load change templates:', err);
      toast.error('Failed to load change templates');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(template: ChangeTemplate) {
    try {
      await updateChangeTemplate(template.id, { isActive: !template.isActive });
      toast.success(`Template ${template.isActive ? 'deactivated' : 'activated'}`);
      loadTemplates();
    } catch (err) {
      toast.error('Failed to update template');
    }
  }

  async function handleCreateFromTemplate(template: ChangeTemplate) {
    try {
      const change = await createChangeFromTemplate(template.id, {});
      toast.success('Change created from template');
      navigate(`/itsm/changes/${change.id}`);
    } catch (err) {
      toast.error('Failed to create change from template');
    }
  }

  function handleSearch() {
    setPage(0);
    loadTemplates();
  }

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Change Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pre-defined change request templates for common operations
          </p>
        </div>
        <Button onClick={() => navigate('/itsm/change-templates/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <CardTitle className="text-sm font-medium whitespace-nowrap">
            {count} template{count !== 1 ? 's' : ''}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 w-56"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="ACCESS_CONTROL">Access Control</SelectItem>
                <SelectItem value="CONFIGURATION">Configuration</SelectItem>
                <SelectItem value="INFRASTRUCTURE">Infrastructure</SelectItem>
                <SelectItem value="APPLICATION">Application</SelectItem>
                <SelectItem value="DATABASE">Database</SelectItem>
                <SelectItem value="SECURITY">Security</SelectItem>
                <SelectItem value="NETWORK">Network</SelectItem>
                <SelectItem value="BACKUP_DR">Backup/DR</SelectItem>
                <SelectItem value="MONITORING">Monitoring</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(0); }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : templates.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No change templates found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Security Impact</TableHead>
                    <TableHead>Auto Approve</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id} className="cursor-pointer" onClick={() => navigate(`/itsm/change-templates/${template.id}`)}>
                      <TableCell className="font-mono text-xs">{template.templateCode}</TableCell>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {template.category.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={securityImpactVariants[template.securityImpact] || 'outline'} className="text-xs">
                          {template.securityImpact}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {template.autoApprove ? (
                          <Badge variant="secondary" className="text-xs">Auto</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Manual</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? 'default' : 'outline'} className="text-xs">
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCreateFromTemplate(template)}>
                              <Play className="h-4 w-4 mr-2" />
                              Create Change from Template
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(template)}>
                              {template.isActive ? (
                                <>
                                  <ToggleLeft className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
