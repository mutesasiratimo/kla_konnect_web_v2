import React, { useState } from 'react'
import type {
  RevenueCategoryRead,
  RevenueStreamRead,
  RevenueSubscriptionRead,
  RoleRead,
} from '../../api/types'
import { getSession, setSession } from '../../api/client'
import { auth, users } from '../../api/endpoints'
import { RevenueParentCategoriesTab } from '../revenue/RevenueParentCategoriesTab'
import { RevenueSubscriptionsCrudList } from '../revenue/RevenueSubscriptionsCrudList'

export type SettingsTabId =
  | 'profile'
  | 'roles'
  | 'subscriptions'
  | 'parent-categories'

interface SettingsPanelProps {
  userName: string
  revenueParentCategories: RevenueCategoryRead[]
  revenueStreams: RevenueStreamRead[]
  revenueSubscriptions: RevenueSubscriptionRead[]
  roleData: RoleRead[]
  revenueLoadError: string | null
  onRefreshParentCategories: () => void | Promise<void>
  onRefreshSubscriptions: () => void | Promise<void>
}

const tabs: { id: SettingsTabId; label: string; icon: string }[] = [
  { id: 'profile', label: 'Profile', icon: 'fa-user-circle-o' },
  { id: 'roles', label: 'Roles', icon: 'fa-shield' },
  {
    id: 'subscriptions',
    label: 'Subscription Packages',
    icon: 'fa-credit-card',
  },
  {
    id: 'parent-categories',
    label: 'Parent categories',
    icon: 'fa-sitemap',
  },
]

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  userName,
  revenueParentCategories,
  revenueStreams,
  revenueSubscriptions,
  roleData,
  revenueLoadError,
  onRefreshParentCategories,
  onRefreshSubscriptions,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile')
  const session = getSession()
  const currentUser = session?.user
  const currentRoleLabel =
    session?.role?.name || currentUser?.role_id || '—'
  const [accountName, setAccountName] = useState(
    currentUser?.full_name || userName || '',
  )
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '')
  const [emailAddress] = useState(currentUser?.email || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [sendingResetCode, setSendingResetCode] = useState(false)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const s = getSession()
    const userId = s?.user?.id
    if (!userId) {
      window.alert('No active user session found.')
      return
    }
    setSavingProfile(true)
    try {
      const updated = await users.update(userId, {
        full_name: accountName.trim() || null,
        phone: phoneNumber.trim() || null,
      })
      if (s) {
        setSession({
          access_token: s.access_token,
          refresh_token: s.refresh_token,
          role: s.role ?? null,
          permissions: s.permissions ?? null,
          user: updated,
        })
      }
      window.alert('Profile updated successfully.')
    } catch (err) {
      console.error(err)
      window.alert('Could not update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSendResetCode = async () => {
    if (!emailAddress) {
      window.alert('No email address available.')
      return
    }
    setSendingResetCode(true)
    try {
      await auth.forgotPassword(emailAddress)
      window.alert('Password reset code sent to your email.')
    } catch (err) {
      console.error(err)
      window.alert('Could not send reset code.')
    } finally {
      setSendingResetCode(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword !== confirmPassword) {
      window.alert('Passwords do not match.')
      return
    }
    if (!resetCode.trim()) {
      window.alert('Enter the reset code sent to your email.')
      return
    }
    setSavingPassword(true)
    try {
      await auth.resetPassword({
        email: emailAddress,
        code: resetCode.trim(),
        new_password: newPassword,
      })
      window.alert('Password updated successfully.')
      setCurrentPassword('')
      setResetCode('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error(err)
      window.alert('Could not update password.')
    } finally {
      setSavingPassword(false)
    }
  }

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
            <i className={`fa ${t.icon}`} aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="settings-tab-panel" role="tabpanel">
          <div className="dashboard-settings-profile-card">
            <div className="dashboard-settings-profile-header">
              <h3>Profile information</h3>
              <p>Update your account details and password.</p>
            </div>
            <div className="dashboard-settings-profile-layout">
              <form className="dashboard-settings-profile-form" onSubmit={handleProfileSave}>
                <label className="dashboard-dialog-field">
                  <span>Account name</span>
                  <input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Enter account name"
                  />
                </label>
                <label className="dashboard-dialog-field">
                  <span>Role</span>
                  <input value={currentRoleLabel} readOnly disabled />
                </label>
                <label className="dashboard-dialog-field">
                  <span>Phone number</span>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </label>
                <label className="dashboard-dialog-field">
                  <span>Email address</span>
                  <input value={emailAddress} disabled readOnly />
                </label>
                <div className="dashboard-dialog-actions">
                  <button type="submit" className="primary-button" disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
              <form
                className="dashboard-settings-profile-form"
                onSubmit={handlePasswordSave}
              >
                <label className="dashboard-dialog-field">
                  <span>Current password</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="For your reference only"
                  />
                </label>
                <label className="dashboard-dialog-field">
                  <span>Reset code</span>
                  <input
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter code from email"
                  />
                </label>
                <label className="dashboard-dialog-field">
                  <span>New password</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </label>
                <label className="dashboard-dialog-field">
                  <span>Confirm new password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </label>
                <div className="dashboard-dialog-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleSendResetCode}
                    disabled={sendingResetCode}
                  >
                    {sendingResetCode ? 'Sending code...' : 'Send reset code'}
                  </button>
                  <button type="submit" className="primary-button" disabled={savingPassword}>
                    {savingPassword ? 'Saving...' : 'Update password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
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

      {activeTab === 'roles' && (
        <div className="settings-tab-panel" role="tabpanel">
          <div className="dashboard-table-shell">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Permissions</th>
                </tr>
              </thead>
              <tbody>
                {roleData.map((role) => (
                  <tr key={role.id}>
                    <td>{role.name}</td>
                    <td>{role.id}</td>
                    <td>{role.description || '—'}</td>
                    <td>{role.permissions?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {roleData.length === 0 && (
              <p style={{ padding: '1rem', color: 'var(--dashboard-muted, #64748b)' }}>
                No roles loaded.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="settings-tab-panel" role="tabpanel">
          <RevenueSubscriptionsCrudList
            subscriptions={revenueSubscriptions}
            categories={revenueParentCategories}
            streams={revenueStreams}
            onRefresh={onRefreshSubscriptions}
          />
        </div>
      )}
    </>
  )
}
