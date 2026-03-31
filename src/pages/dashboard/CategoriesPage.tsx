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
        <div>
          <h1 className="dashboard-page-title">Categories</h1>
          <p className="dashboard-page-lead">
            Categories shown here are child records linked to a parent. Manage
            parent categories under Settings → Parent categories.
          </p>
        </div>
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
