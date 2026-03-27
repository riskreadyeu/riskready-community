import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion } from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Save,
  Loader2,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/components/common';
import { cn } from '@/lib/utils';
import { useAssetForm } from '@/components/itsm/tabs/asset/useAssetForm';
import { ASSET_CATEGORIES } from '@/components/itsm/tabs/asset/asset-form-constants';
import { AssetBasicInfoSection } from '@/components/itsm/tabs/asset/AssetBasicInfoSection';
import { AssetOwnershipSection } from '@/components/itsm/tabs/asset/AssetOwnershipSection';
import { AssetLocationSection } from '@/components/itsm/tabs/asset/AssetLocationSection';
import { AssetTechnicalSection } from '@/components/itsm/tabs/asset/AssetTechnicalSection';
import { AssetSecuritySection } from '@/components/itsm/tabs/asset/AssetSecuritySection';
import { AssetLifecycleSection } from '@/components/itsm/tabs/asset/AssetLifecycleSection';
import { AssetResilienceSection } from '@/components/itsm/tabs/asset/AssetResilienceSection';

export default function AssetFormPage() {
  const {
    id,
    isEdit,
    loading,
    saving,
    form,
    departments,
    locations,
    users,
    openSections,
    setOpenSections,
    selectedCategory,
    setSelectedCategory,
    sectionCompletion,
    overallProgress,
    currentCategory,
    typeFields,
    handleChange,
    handleTypeAttrChange,
    selectAssetType,
    handleSubmit,
  } = useAssetForm();

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Header */}
      <PageHeader
        title={isEdit ? 'Edit Asset' : 'Register New Asset'}
        description={isEdit ? `Editing ${form.assetTag}` : 'Add a new asset to the Configuration Management Database'}
        backLink={isEdit ? `/itsm/assets/${id}` : '/itsm/assets'}
        backLabel={isEdit ? 'Back to Asset' : 'Back to Register'}
      />

      {/* Progress Indicator */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Form Completion</span>
                <span className="text-sm text-muted-foreground">{overallProgress}% complete</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Complete required sections (Identification & Ownership)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Quick Asset Type Selector */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Asset Type</CardTitle>
          <CardDescription>Select the category and type of asset</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {ASSET_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                type="button"
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="gap-2"
              >
                <span className={cn(selectedCategory !== cat.id && cat.color)}>
                  {cat.icon}
                </span>
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Type Selection within Category */}
          {currentCategory && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {currentCategory.types.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={form.assetType === type.value ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => selectAssetType(type.value)}
                  className={cn(
                    'gap-1',
                    form.assetType === type.value && 'ring-2 ring-primary ring-offset-2'
                  )}
                >
                  {form.assetType === type.value && <Check className="h-3 w-3" />}
                  {type.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accordion Sections */}
      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="space-y-4"
      >
        <AssetBasicInfoSection
          form={form}
          isEdit={isEdit}
          sectionCompletion={sectionCompletion}
          handleChange={handleChange}
        />

        <AssetOwnershipSection
          form={form}
          users={users}
          departments={departments}
          sectionCompletion={sectionCompletion}
          handleChange={handleChange}
        />

        <AssetLocationSection
          form={form}
          selectedCategory={selectedCategory}
          locations={locations}
          handleChange={handleChange}
        />

        <AssetTechnicalSection
          form={form}
          selectedCategory={selectedCategory}
          typeFields={typeFields}
          handleChange={handleChange}
          handleTypeAttrChange={handleTypeAttrChange}
        />

        <AssetSecuritySection
          form={form}
          handleChange={handleChange}
        />

        <AssetLifecycleSection
          form={form}
          selectedCategory={selectedCategory}
          handleChange={handleChange}
        />

        <AssetResilienceSection
          form={form}
          selectedCategory={selectedCategory}
          handleChange={handleChange}
        />
      </Accordion>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between py-4 px-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {overallProgress < 100 ? (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>Complete required sections to save</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span>All required fields complete</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" type="button" asChild>
              <Link to={isEdit ? `/itsm/assets/${id}` : '/itsm/assets'}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEdit ? 'Update Asset' : 'Create Asset'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
