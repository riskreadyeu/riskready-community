import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Plus, Eye, Edit3, Trash2, Users, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  CriticalityBadge,
  StatCard,
  StatCardGrid,
  FormDialog,
  ConfirmDialog,
  FormField,
  FormRow,
  type Column,
  type RowAction,
} from "@/components/common";
import {
  getProductsServices,
  createProductService,
  updateProductService,
  deleteProductService,
  type ProductService,
} from "@/lib/organisation-api";

const productTypeLabels: Record<string, string> = {
  product: "Product",
  service: "Service",
  solution: "Solution",
  platform: "Platform",
};

const lifecycleLabels: Record<string, string> = {
  development: "Development",
  beta: "Beta",
  active: "Active",
  mature: "Mature",
  sunset: "Sunset",
  retired: "Retired",
};

const lifecycleVariants: Record<string, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  development: "secondary",
  beta: "warning",
  active: "success",
  mature: "default",
  sunset: "warning",
  retired: "destructive",
};

interface ProductFormData {
  productCode: string;
  name: string;
  productType: string;
  description: string;
  category: string;
  customerFacing: boolean;
  lifecycleStage: string;
  dataClassification: string;
  containsPersonalData: boolean;
  inIsmsScope: boolean;
  isActive: boolean;
}

const emptyFormData: ProductFormData = {
  productCode: "",
  name: "",
  productType: "product",
  description: "",
  category: "",
  customerFacing: true,
  lifecycleStage: "active",
  dataClassification: "internal",
  containsPersonalData: false,
  inIsmsScope: true,
  isActive: true,
};

export default function ProductsServicesPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductService[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");

  // CRUD state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getProductsServices();
      setProducts(data.results);
    } catch (err) {
      console.error("Error loading products:", err);
      toast.error("Failed to load products & services");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormMode("create");
    setFormData(emptyFormData);
    setEditingId(null);
    setFormOpen(true);
  };

  const handleEdit = (product: ProductService) => {
    setFormMode("edit");
    setFormData({
      productCode: product.productCode,
      name: product.name,
      productType: product.productType,
      description: product.description || "",
      category: product.category || "",
      customerFacing: product.customerFacing,
      lifecycleStage: product.lifecycleStage || "active",
      dataClassification: product.dataClassification || "internal",
      containsPersonalData: product.containsPersonalData,
      inIsmsScope: product.inIsmsScope,
      isActive: product.isActive,
    });
    setEditingId(product.id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (formMode === "create") {
        await createProductService(formData);
        toast.success("Product/Service created successfully");
      } else if (editingId) {
        await updateProductService(editingId, formData);
        toast.success("Product/Service updated successfully");
      }
      setFormOpen(false);
      await loadData();
    } catch (err) {
      console.error("Error saving product:", err);
      toast.error("Failed to save product/service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (product: ProductService) => {
    setDeletingProduct(product);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    try {
      setIsDeleting(true);
      await deleteProductService(deletingProduct.id);
      toast.success("Product/Service deleted successfully");
      setDeleteOpen(false);
      setDeletingProduct(null);
      await loadData();
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product/service");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateField = <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.name.trim() !== "" && formData.productCode.trim() !== "";

  const filteredProducts = products.filter((p) => {
    if (typeFilter !== "all" && p.productType !== typeFilter) return false;
    return true;
  });

  const columns: Column<ProductService>[] = [
    {
      key: "name",
      header: "Product/Service",
      render: (product) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{product.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{product.productCode}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (product) => (
        <Badge variant="outline" className="text-xs">
          {productTypeLabels[product.productType] || product.productType}
        </Badge>
      ),
    },
    {
      key: "lifecycle",
      header: "Lifecycle",
      render: (product) => (
        <StatusBadge
          status={lifecycleLabels[product.lifecycleStage || ""] || product.lifecycleStage || "-"}
          variant={lifecycleVariants[product.lifecycleStage || ""] || "secondary"}
        />
      ),
    },
    {
      key: "customerFacing",
      header: "Customer Facing",
      render: (product) => (
        <div className="flex items-center gap-1">
          {product.customerFacing ? (
            <Badge variant="default" className="text-xs">Yes</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">No</Badge>
          )}
        </div>
      ),
    },
    {
      key: "inScope",
      header: "In ISMS Scope",
      render: (product) => (
        <div className="flex items-center gap-1">
          {product.inIsmsScope ? (
            <Shield className="h-4 w-4 text-success" />
          ) : (
            <Shield className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (product) => (
        <StatusBadge
          status={product.isActive ? "Active" : "Inactive"}
          variant={product.isActive ? "success" : "secondary"}
        />
      ),
    },
  ];

  const rowActions: RowAction<ProductService>[] = [
    {
      label: "Edit",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (product) => handleEdit(product),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (product) => handleDeleteClick(product),
      variant: "destructive",
      separator: true,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const activeCount = products.filter((p) => p.isActive).length;
  const customerFacingCount = products.filter((p) => p.customerFacing).length;
  const inScopeCount = products.filter((p) => p.inIsmsScope).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Products & Services"
        description="Manage products and services in scope for ISMS"
        backLink="/organisation"
        backLabel="Back"
        actions={
          <Button className="gap-2 rounded-lg glow-primary" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add Product/Service
          </Button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Products/Services"
          value={products.length}
          icon={<Package className="h-4 w-4" />}
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={<Package className="h-4 w-4" />}
          iconClassName="text-success"
        />
        <StatCard
          title="Customer Facing"
          value={customerFacingCount}
          icon={<Users className="h-4 w-4" />}
          iconClassName="text-primary"
        />
        <StatCard
          title="In ISMS Scope"
          value={inScopeCount}
          icon={<Shield className="h-4 w-4" />}
          iconClassName="text-warning"
        />
      </StatCardGrid>

      <DataTable
        title="Products & Services Register"
        data={filteredProducts}
        columns={columns}
        keyExtractor={(product) => product.id}
        searchPlaceholder="Search products..."
        searchFilter={(product, query) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.productCode.toLowerCase().includes(query.toLowerCase())
        }
        rowActions={rowActions}
        emptyMessage="No products or services found"
        filterSlot={
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 bg-transparent">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="solution">Solution</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={formMode === "create" ? "Add Product/Service" : "Edit Product/Service"}
        description={formMode === "create" ? "Add a new product or service to the register" : "Update product/service details"}
        onSubmit={handleSubmit}
        submitLabel={formMode === "create" ? "Create" : "Save Changes"}
        isSubmitting={isSubmitting}
        isValid={isFormValid}
        size="lg"
      >
        <FormRow>
          <FormField
            type="text"
            name="productCode"
            label="Product Code"
            value={formData.productCode}
            onChange={(v) => updateField("productCode", v)}
            placeholder="e.g., PROD-001"
            required
          />
          <FormField
            type="text"
            name="name"
            label="Name"
            value={formData.name}
            onChange={(v) => updateField("name", v)}
            placeholder="Product/Service name"
            required
          />
        </FormRow>

        <FormField
          type="textarea"
          name="description"
          label="Description"
          value={formData.description}
          onChange={(v) => updateField("description", v)}
          placeholder="Describe the product or service..."
          rows={2}
        />

        <FormRow>
          <FormField
            type="select"
            name="productType"
            label="Type"
            value={formData.productType}
            onChange={(v) => updateField("productType", v)}
            options={[
              { value: "product", label: "Product" },
              { value: "service", label: "Service" },
              { value: "solution", label: "Solution" },
              { value: "platform", label: "Platform" },
            ]}
          />
          <FormField
            type="select"
            name="lifecycleStage"
            label="Lifecycle Stage"
            value={formData.lifecycleStage}
            onChange={(v) => updateField("lifecycleStage", v)}
            options={[
              { value: "development", label: "Development" },
              { value: "beta", label: "Beta" },
              { value: "active", label: "Active" },
              { value: "mature", label: "Mature" },
              { value: "sunset", label: "Sunset" },
              { value: "retired", label: "Retired" },
            ]}
          />
        </FormRow>

        <FormRow>
          <FormField
            type="select"
            name="dataClassification"
            label="Data Classification"
            value={formData.dataClassification}
            onChange={(v) => updateField("dataClassification", v)}
            options={[
              { value: "public", label: "Public" },
              { value: "internal", label: "Internal" },
              { value: "confidential", label: "Confidential" },
              { value: "restricted", label: "Restricted" },
            ]}
          />
          <FormField
            type="switch"
            name="customerFacing"
            label="Customer Facing"
            value={formData.customerFacing}
            onChange={(v) => updateField("customerFacing", v)}
          />
        </FormRow>

        <FormRow>
          <FormField
            type="switch"
            name="containsPersonalData"
            label="Contains Personal Data"
            value={formData.containsPersonalData}
            onChange={(v) => updateField("containsPersonalData", v)}
          />
          <FormField
            type="switch"
            name="inIsmsScope"
            label="In ISMS Scope"
            value={formData.inIsmsScope}
            onChange={(v) => updateField("inIsmsScope", v)}
          />
        </FormRow>

        <FormField
          type="switch"
          name="isActive"
          label="Active"
          value={formData.isActive}
          onChange={(v) => updateField("isActive", v)}
          description="Product/Service is currently active"
        />
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Product/Service"
        description={`Are you sure you want to delete "${deletingProduct?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
