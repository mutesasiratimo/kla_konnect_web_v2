import type { RevenueCategoryRead } from '../../api/types'
import { SettingsPanel } from '../../components/settings/SettingsPanel'

interface SettingsPageViewProps {
  userName: string
  revenueCategoryData: RevenueCategoryRead[]
  revenueLoadError: string | null
  onRefreshParentCategories: () => void | Promise<void>
}

export function SettingsPageView({
  userName,
  revenueCategoryData,
  revenueLoadError,
  onRefreshParentCategories,
}: SettingsPageViewProps) {
  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page-title">Settings</h1>
      <p className="dashboard-page-lead">Profile and application settings.</p>
      <SettingsPanel
        userName={userName}
        revenueParentCategories={revenueCategoryData}
        revenueLoadError={revenueLoadError}
        onRefreshParentCategories={onRefreshParentCategories}
      />
    </div>
  )
}
