import type {
  RevenueCategoryRead,
  RevenueStreamRead,
  RevenueSubscriptionRead,
  RoleRead,
} from '../../api/types'
import { SettingsPanel } from '../../components/settings/SettingsPanel'

interface SettingsPageViewProps {
  userName: string
  revenueCategoryData: RevenueCategoryRead[]
  revenueStreamData: RevenueStreamRead[]
  revenueSubscriptionData: RevenueSubscriptionRead[]
  roleData: RoleRead[]
  revenueLoadError: string | null
  onRefreshParentCategories: () => void | Promise<void>
  onRefreshSubscriptions: () => void | Promise<void>
  onRefreshRoles: () => void | Promise<void>
}

export function SettingsPageView({
  userName,
  revenueCategoryData,
  revenueStreamData,
  revenueSubscriptionData,
  roleData,
  revenueLoadError,
  onRefreshParentCategories,
  onRefreshSubscriptions,
  onRefreshRoles,
}: SettingsPageViewProps) {
  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page-title">Settings</h1>
      <SettingsPanel
        userName={userName}
        revenueParentCategories={revenueCategoryData}
        revenueStreams={revenueStreamData}
        revenueSubscriptions={revenueSubscriptionData}
        roleData={roleData}
        revenueLoadError={revenueLoadError}
        onRefreshParentCategories={onRefreshParentCategories}
        onRefreshSubscriptions={onRefreshSubscriptions}
        onRefreshRoles={onRefreshRoles}
      />
    </div>
  )
}
