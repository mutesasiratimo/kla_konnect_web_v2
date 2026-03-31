import React, { useState } from 'react'
import type { RevenueCategoryRead } from '../../api/types'
import { RevenueParentCategoriesTab } from '../revenue/RevenueParentCategoriesTab'

export type SettingsTabId = 'profile' | 'parent-categories'

interface SettingsPanelProps {
  userName: string
  revenueParentCategories: RevenueCategoryRead[]
  revenueLoadError: string | null
  onRefreshParentCategories: () => void | Promise<void>
}

const tabs: { id: SettingsTabId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'parent-categories', label: 'Parent categories' },
]

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  userName,
  revenueParentCategories,
  revenueLoadError,
  onRefreshParentCategories,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile')

  return (
    <>
      <div className="dashboard-settings-tabs" role="tablist" aria-label="Settings sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={`dashboard-settings-tab ${activeTab === t.id ? 'dashboard-settings-tab--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="settings-tab-panel" role="tabpanel">
          <p className="dashboard-page-lead">
            Signed in as <strong>{userName || 'User'}</strong>. Profile and password
            changes can be wired here when endpoints are available.
          </p>
        </div>
      )}

      {activeTab === 'parent-categories' && (
        <div className="settings-tab-panel" role="tabpanel">
          {revenueLoadError && (
            <p className="dashboard-page-lead" style={{ color: '#ef4444' }}>
              {revenueLoadError}
            </p>
          )}
          <RevenueParentCategoriesTab
            categories={revenueParentCategories}
            onRefresh={onRefreshParentCategories}
          />
        </div>
      )}
    </>
  )
}
