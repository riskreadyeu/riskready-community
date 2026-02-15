import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  Edit3,
  Trash2,
  Users,
  DollarSign,
  Calendar,
  Shield,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageHeader,
  StatusBadge,
  ConfirmDialog,
  FormDialog,
  FormField,
  FormRow,
  ArcherTabs,
  ArcherTabsList,
  ArcherTabsTrigger,
  ArcherTabsContent,
  HistoryTab,
  RecordActionsMenu,
} from "@/components/common";
import {
  getProductService,
  updateProductService,
  deleteProductService,
  type ProductService,
} from "@/lib/organisation-api";

export default function ProductServiceDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductService | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<ProductService>>({
    name: "",
    productCode: "",
    productType: "",
    description: "",
    customerFacing: true,
    internalOnly: false,
    containsPersonalData: false,
    containsSensitiveData: false,
    inIsmsScope: true,
    isActive: true,
  });

  useEffect(() => {
    if (productId) {
      loadData();
    }
  }, [productId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getProductService(productId!);
      setProduct(data);
      if (data) {
        setFormData({
          name: data.name,
          productCode: data.productCode,
          productType: data.productType,
          description: data.description || "",
          category: data.category || "",
          customerFacing: data.customerFacing,
          internalOnly: data.internalOnly,
          containsPersonalData: data.containsPersonalData,
          containsSensitiveData: data.containsSensitiveData,
          inIsmsScope: data.inIsmsScope,
          isActive: data.isActive,
        });
      }
    } catch (err) {
      console.error("Error loading product:", err);
      toast.error("Failed to load product/service");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setIsSubmitting(true);
      await updateProductService(productId!, formData);
      toast.success("Product/service updated successfully");
      setEditOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error updating product:", err);
      toast.error("Failed to update product/service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteProductService(productId!);
      toast.success("Product/service deleted successfully");
      navigate("/organisation/products-services");
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product/service");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof ProductService>(field: K, value: ProductService[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product/service not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/organisation/products-services")}>
          Back to Products & Services
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={product.name}
        description={product.description || "Product/service details"}
        backLink="/organisation/products-services"
        backLabel="Back to Products & Services"
        badge={
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono text-xs">{product.productCode}</Badge>
            <Badge variant="secondary">{product.productType}</Badge>
            {product.inIsmsScope && (
              <Badge variant="default">
                <Shield className="h-3 w-3 mr-1" />
                ISMS Scope
              </Badge>
            )}
            <StatusBadge
              status={product.isActive ? "Active" : "Inactive"}
              variant={product.isActive ? "success" : "secondary"}
            />
          </div>
        }
        actions={
          <div className="flex gap-2">
            <RecordActionsMenu
              onEdit={() => setEditOpen(true)}
              onDelete={() => setDeleteOpen(true)}
            />
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{product.productType.replace("_", " ")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer Facing</p>
                <p className="font-medium">{product.customerFacing ? "Yes" : "No"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Personal Data</p>
                <p className="font-medium">{product.containsPersonalData ? "Yes" : "No"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lifecycle</p>
                <p className="font-medium capitalize">{product.lifecycleStage?.replace("_", " ") || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ArcherTabs defaultValue="overview" className="space-y-4" syncWithUrl>
        <ArcherTabsList>
          <ArcherTabsTrigger value="overview">Overview</ArcherTabsTrigger>
          <ArcherTabsTrigger value="data">Data Classification</ArcherTabsTrigger>
          <ArcherTabsTrigger value="history">History</ArcherTabsTrigger>
        </ArcherTabsList>

        <ArcherTabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p>{product.category || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Market</p>
                  <p>{product.targetMarket || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pricing Model</p>
                  <p className="capitalize">{product.pricingModel?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Contribution</p>
                  <p>{product.revenueContribution || "-"}</p>
                </div>
              </div>
              {product.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data Classification</p>
                  <p className="capitalize">{product.dataClassification?.replace("_", " ") || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contains Personal Data</p>
                  <p>{product.containsPersonalData ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contains Sensitive Data</p>
                  <p>{product.containsSensitiveData ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In ISMS Scope</p>
                  <p>{product.inIsmsScope ? "Yes" : "No"}</p>
                </div>
              </div>
              {product.scopeJustification && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Scope Justification</p>
                  <p className="text-sm">{product.scopeJustification}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ArcherTabsContent>

        <ArcherTabsContent value="history">
          <HistoryTab
            entityType="product_service"
            entityId={productId!}
          />
        </ArcherTabsContent>
      </ArcherTabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Product/Service"
        description="Update product/service details"
        onSubmit={handleEdit}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        isValid={formData.name?.trim() !== "" && formData.productCode?.trim() !== ""}
        size="lg"
      >
        <FormRow>
          <FormField
            type="text"
            name="name"
            label="Name"
            value={formData.name || ""}
            onChange={(v) => updateField("name", v)}
            required
          />
          <FormField
            type="text"
            name="productCode"
            label="Product Code"
            value={formData.productCode || ""}
            onChange={(v) => updateField("productCode", v)}
            required
          />
        </FormRow>
        <FormRow>
          <FormField
            type="select"
            name="productType"
            label="Type"
            value={formData.productType || ""}
            onChange={(v) => updateField("productType", v)}
            options={[
              { value: "product", label: "Product" },
              { value: "service", label: "Service" },
              { value: "platform", label: "Platform" },
              { value: "solution", label: "Solution" },
            ]}
          />
          <FormField
            type="text"
            name="category"
            label="Category"
            value={formData.category || ""}
            onChange={(v) => updateField("category", v)}
          />
        </FormRow>
        <FormField
          type="textarea"
          name="description"
          label="Description"
          value={formData.description || ""}
          onChange={(v) => updateField("description", v)}
          rows={2}
        />
        <FormRow>
          <FormField
            type="switch"
            name="customerFacing"
            label="Customer Facing"
            value={formData.customerFacing ?? true}
            onChange={(v) => updateField("customerFacing", v)}
          />
          <FormField
            type="switch"
            name="inIsmsScope"
            label="In ISMS Scope"
            value={formData.inIsmsScope ?? true}
            onChange={(v) => updateField("inIsmsScope", v)}
          />
        </FormRow>
        <FormRow>
          <FormField
            type="switch"
            name="containsPersonalData"
            label="Contains Personal Data"
            value={formData.containsPersonalData ?? false}
            onChange={(v) => updateField("containsPersonalData", v)}
          />
          <FormField
            type="switch"
            name="containsSensitiveData"
            label="Contains Sensitive Data"
            value={formData.containsSensitiveData ?? false}
            onChange={(v) => updateField("containsSensitiveData", v)}
          />
        </FormRow>
        <FormField
          type="switch"
          name="isActive"
          label="Active"
          value={formData.isActive ?? true}
          onChange={(v) => updateField("isActive", v)}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Product/Service"
        description={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
