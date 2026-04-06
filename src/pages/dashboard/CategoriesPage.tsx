import type { RevenueCategoryRead, RevenueSubcategoryRead } from '../../api/types'
import { RevenueCategoriesCrudList } from '../../components/revenue/RevenueCategoriesCrudList'

interface CategoriesPageProps {
  revenueLoadError: string | null
  revenueCategoryData: RevenueCategoryRead[]
  revenueSubcategoryData: RevenueSubcategoryRead[]
  revenueSubParentFilter: string
  setRevenueSubParentFilter: (id: string) => void
  onRefreshRevenue: () => void | Promise<void>
}

export function CategoriesPage({
  revenueLoadError,
  revenueCategoryData,
  revenueSubcategoryData,
  revenueSubParentFilter,
  setRevenueSubParentFilter,
  onRefreshRevenue,
}: CategoriesPageProps) {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header-row">
        <h1 className="dashboard-page-title">Categories</h1>
      </div>
      {revenueLoadError && (
        <p className="dashboard-page-lead" style={{ color: '#ef4444' }}>
          {revenueLoadError}
        </p>
      )}
      <RevenueCategoriesCrudList
        parentCategories={revenueCategoryData}
        categories={revenueSubcategoryData}
        parentCategoryIdFilter={revenueSubParentFilter}
        onParentCategoryIdFilterChange={setRevenueSubParentFilter}
        onRefresh={onRefreshRevenue}
      />
    </div>
  )
}
