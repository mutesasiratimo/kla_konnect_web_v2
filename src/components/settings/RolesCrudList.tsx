import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { GridColDef } from '@mui/x-data-grid'
import type { RoleRead, RoleWithPermissionsRead } from '../../api/types'
import { roles as rolesApi } from '../../api/endpoints'
import { ApiError, getSession } from '../../api/client'
import { DashboardDialog } from '../DashboardDialog'
import { DashboardDataGrid } from '../table/DashboardDataGrid'
import { Checkbox } from '../ui/Checkbox'
import {
  alertError,
  alertSuccess,
  closeAlert,
  confirmAction,
  showLoading,
} from '../../utils/alerts'
import {
  coercePermissionStringList,
  groupPermissionKeys,
  isEffectivePermissionChecked,
  mergeCatalogKeys,
  permissionCountLabel,
  permissionsPayloadFromSelection,
  roleHasAllPermission,
  selectionFromRolePermissions,
  togglePermissionSelection,
} from '../../utils/rolePermissions'

interface RolesCrudListProps {
  roles: RoleRead[]
  onRefresh: () => void | Promise<void>
}

const iconBtn: React.CSSProperties = { width: 30, height: 30, padding: 0 }

export const RolesCrudList: React.FC<RolesCrudListProps> = ({
  roles,
  onRefresh,
}) => {
  const canManage = useMemo(() => {
    const permissions = getSession()?.permissions ?? null
    return Boolean(permissions?.all || permissions?.['users:manage_roles'])
  }, [])

  const [catalog, setCatalog] = useState<string[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RoleRead | null>(null)
  const [permTarget, setPermTarget] = useState<RoleRead | null>(null)
  const [viewTarget, setViewTarget] = useState<RoleRead | null>(null)

  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createSelected, setCreateSelected] = useState<Record<string, boolean>>(
    {},
  )

  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSelected, setEditSelected] = useState<Record<string, boolean>>({})

  const [permSelected, setPermSelected] = useState<Record<string, boolean>>({})
  const [permRoleDetail, setPermRoleDetail] =
    useState<RoleWithPermissionsRead | null>(null)

  const [saving, setSaving] = useState(false)

  const loadCatalog = useCallback(async () => {
    try {
      const list = await rolesApi.listAllPermissions()
      const sorted = [...list].sort()
      setCatalog(sorted)
      setCatalogError(null)
      return sorted
    } catch (e) {
      console.error(e)
      setCatalogError('Could not load the permission catalog.')
      return []
    }
  }, [])

  useEffect(() => {
    if (canManage) void loadCatalog()
  }, [canManage, loadCatalog])

  const closeCreate = () => {
    setCreateOpen(false)
    setCreateName('')
    setCreateDescription('')
    setCreateSelected({})
  }

  const openCreate = async () => {
    const list = catalog.length ? catalog : await loadCatalog()
    if (!list.length && catalogError) {
      void alertError('Permission catalog', catalogError)
      return
    }
    const catalogKeys = mergeCatalogKeys(list)
    const sel: Record<string, boolean> = {}
    for (const p of catalogKeys) sel[p] = false
    setCreateSelected(sel)
    setCreateOpen(true)
  }

  const closeEdit = () => {
    setEditTarget(null)
    setEditSelected({})
  }

  const openEdit = async (row: RoleRead) => {
    showLoading('Loading role', 'Fetching details and permissions…')
    try {
      let detail: RoleWithPermissionsRead
      try {
        detail = await rolesApi.get(row.id)
      } catch {
        detail = {
          id: row.id,
          name: row.name,
          description: row.description,
          is_system: row.is_system,
          permissions: coercePermissionStringList(row.permissions),
        }
      }
      const list = catalog.length ? catalog : await loadCatalog()
      const rolePerms = coercePermissionStringList(detail.permissions)
      const catalogKeys = mergeCatalogKeys([...list, ...rolePerms])
      const sel = selectionFromRolePermissions(rolePerms, catalogKeys)
      setEditName(detail.name)
      setEditDescription(detail.description ?? '')
      setEditSelected(sel)
      setEditTarget(row)
    } catch (e) {
      console.error(e)
      const msg =
        e instanceof ApiError
          ? `Could not load role (HTTP ${e.status}).`
          : 'Could not load role for editing.'
      void alertError('Role', msg)
    } finally {
      closeAlert()
    }
  }

  const openView = (row: RoleRead) => {
    setViewTarget(row)
  }

  const openPermissions = async (row: RoleRead) => {
    showLoading('Loading role', 'Fetching permissions…')
    try {
      let detail: RoleWithPermissionsRead
      try {
        detail = await rolesApi.get(row.id)
      } catch {
        detail = {
          id: row.id,
          name: row.name,
          description: row.description,
          is_system: row.is_system,
          permissions: coercePermissionStringList(row.permissions),
        }
      }
      const list = catalog.length ? catalog : await loadCatalog()
      const rolePerms = coercePermissionStringList(detail.permissions)
      const catalogKeys = mergeCatalogKeys([...list, ...rolePerms])
      const sel = selectionFromRolePermissions(rolePerms, catalogKeys)
      setPermRoleDetail(detail)
      setPermSelected(sel)
      setPermTarget(row)
    } catch (e) {
      console.error(e)
      const msg =
        e instanceof ApiError
          ? `Could not load permissions (HTTP ${e.status}). The role detail or permission catalog request was rejected.`
          : 'Could not load role permissions.'
      void alertError('Role', msg)
    } finally {
      closeAlert()
    }
  }

  const closePerm = () => {
    setPermTarget(null)
    setPermRoleDetail(null)
    setPermSelected({})
  }

  const catalogKeysForCreate = mergeCatalogKeys(Object.keys(createSelected))
  const catalogKeysForEdit = mergeCatalogKeys(Object.keys(editSelected))

  const toggleCreatePerm = (key: string) => {
    setCreateSelected((prev) =>
      togglePermissionSelection(key, mergeCatalogKeys(Object.keys(prev)), prev),
    )
  }

  const togglePerm = (key: string) => {
    setPermSelected((prev) =>
      togglePermissionSelection(key, mergeCatalogKeys(Object.keys(prev)), prev),
    )
  }

  const toggleEditPerm = (key: string) => {
    setEditSelected((prev) =>
      togglePermissionSelection(key, mergeCatalogKeys(Object.keys(prev)), prev),
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = createName.trim()
    if (!name) return
    setSaving(true)
    try {
      const permissions = permissionsPayloadFromSelection(
        createSelected,
        catalogKeysForCreate,
      )
      await rolesApi.create({
        name,
        description: createDescription.trim() || null,
        permissions: permissions.length ? permissions : undefined,
      })
      closeCreate()
      await onRefresh()
      void alertSuccess('Role created')
    } catch (err) {
      console.error(err)
      void alertError('Create role', 'Could not create role.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    const name = editName.trim()
    if (!name) return
    setSaving(true)
    try {
      await rolesApi.update(editTarget.id, {
        name,
        description: editDescription.trim() || null,
      })
      const permissions = permissionsPayloadFromSelection(
        editSelected,
        catalogKeysForEdit,
      )
      await rolesApi.setPermissions(editTarget.id, { permissions })
      closeEdit()
      await onRefresh()
      void alertSuccess('Role updated')
    } catch (err) {
      console.error(err)
      void alertError(
        'Update role',
        'Could not save role details or permissions.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!permTarget) return
    setSaving(true)
    try {
      const catalogKeys = mergeCatalogKeys(Object.keys(permSelected))
      const permissions = permissionsPayloadFromSelection(
        permSelected,
        catalogKeys,
      )
      await rolesApi.setPermissions(permTarget.id, { permissions })
      closePerm()
      await onRefresh()
      void alertSuccess('Permissions saved')
    } catch (err) {
      console.error(err)
      void alertError('Permissions', 'Could not save permissions.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: RoleRead) => {
    if (row.is_system) return
    const ok = await confirmAction({
      title: 'Delete role?',
      text: `Remove “${row.name}”? Users assigned to this role may need to be reassigned.`,
      confirmButtonText: 'Delete',
    })
    if (!ok) return
    setSaving(true)
    try {
      await rolesApi.delete(row.id)
      await onRefresh()
      void alertSuccess('Role deleted')
    } catch (err) {
      console.error(err)
      void alertError('Delete role', 'Could not delete role.')
    } finally {
      setSaving(false)
    }
  }

  const createGroups = groupPermissionKeys(
    mergeCatalogKeys(Object.keys(createSelected)),
  )
  const permGroups = groupPermissionKeys(
    mergeCatalogKeys(Object.keys(permSelected)),
  )
  const editGroups = groupPermissionKeys(
    mergeCatalogKeys(Object.keys(editSelected)),
  )

  const columns: GridColDef<RoleRead>[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
    {
      field: 'is_system',
      headerName: 'System',
      width: 100,
      valueGetter: (_v, r) => (r.is_system ? 'Yes' : '—'),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 160,
      valueGetter: (_v, r) => r.description || '—',
    },
    {
      field: 'permissions',
      headerName: 'Permissions',
      flex: 1,
      minWidth: 120,
      sortable: false,
      valueGetter: (_v, r) => permissionCountLabel(r.permissions),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="icon-button"
            style={iconBtn}
            title="View"
            onClick={() => openView(params.row)}
          >
            <i className="fa fa-eye" aria-hidden />
          </button>
          {canManage && (
            <>
              <button
                type="button"
                className="icon-button"
                style={iconBtn}
                title="Edit"
                onClick={() => void openEdit(params.row)}
              >
                <i className="fa fa-pencil" aria-hidden />
              </button>
              <button
                type="button"
                className="icon-button"
                style={iconBtn}
                title="Permissions"
                onClick={() => void openPermissions(params.row)}
              >
                <i className="fa fa-key" aria-hidden />
              </button>
              {!params.row.is_system && (
                <button
                  type="button"
                  className="icon-button"
                  style={iconBtn}
                  title="Delete"
                  onClick={() => void handleDelete(params.row)}
                  disabled={saving}
                >
                  <i className="fa fa-trash" aria-hidden />
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="dashboard-table-shell">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        {canManage && (
          <button
            type="button"
            className="primary-button"
            onClick={() => void openCreate()}
            disabled={saving}
          >
            New role
          </button>
        )}
        {catalogError && canManage && (
          <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>
            {catalogError}{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => void loadCatalog()}
            >
              Retry
            </button>
          </span>
        )}
      </div>

      <DashboardDataGrid<RoleRead>
        rows={roles}
        columns={columns}
        getRowId={(row) => row.id}
        localeText={{ noRowsLabel: 'No roles loaded.' }}
      />

      <DashboardDialog
        open={createOpen}
        onClose={closeCreate}
        title="New role"
        wide
      >
        <form
          className="dashboard-dialog-form roles-role-form-dialog"
          onSubmit={(e) => void handleCreate(e)}
        >
          <section className="roles-role-form-section" aria-labelledby="roles-create-details-heading">
            <h3
              className="dashboard-dialog-section-label"
              id="roles-create-details-heading"
            >
              Role details
            </h3>
            <p className="roles-role-form-hint">
              This name appears when assigning users and in settings. Description
              is optional.
            </p>
            <label className="dashboard-dialog-field">
              <span>
                Role name{' '}
                <span className="roles-role-form-required" aria-label="required">
                  *
                </span>
              </span>
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Enforcement supervisor"
                autoComplete="off"
                required
              />
            </label>
            <label className="dashboard-dialog-field">
              <span>Description</span>
              <textarea
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Optional — summarize what this role is for."
                rows={3}
              />
            </label>
          </section>

          <section
            className="roles-role-form-section"
            aria-labelledby="roles-create-perms-heading"
          >
            <h3
              className="dashboard-dialog-section-label"
              id="roles-create-perms-heading"
            >
              Permissions
            </h3>
            <p className="roles-role-form-hint">
              Optional. Choose specific access, or enable <code>all</code> for full
              access. Leave everything off to set permissions later.
            </p>
            {createSelected.all && (
              <p className="roles-role-form-callout">
                Only <code>all</code> will be stored; it grants every permission.
              </p>
            )}
            <div className="roles-permission-picker roles-permission-picker--dialog">
              {[...createGroups.entries()].map(([prefix, keys]) => (
                <div className="roles-permission-group" key={prefix}>
                  <div className="roles-permission-group-title">{prefix}</div>
                  {keys.map((key) => (
                    <div className="roles-permission-checkbox-row" key={key}>
                      <Checkbox
                        checked={isEffectivePermissionChecked(key, createSelected)}
                        onCheckedChange={() => toggleCreatePerm(key)}
                        ariaLabel={key}
                      />
                      <code className="roles-permission-key">{key}</code>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <div className="dashboard-dialog-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={closeCreate}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving…' : 'Create role'}
            </button>
          </div>
        </form>
      </DashboardDialog>

      <DashboardDialog
        open={Boolean(editTarget)}
        onClose={closeEdit}
        title="Edit role"
        wide
      >
        {editTarget && (
          <form
            className="dashboard-dialog-form roles-role-form-dialog"
            onSubmit={(e) => void handleEdit(e)}
          >
            <section
              className="roles-role-form-section"
              aria-labelledby="roles-edit-details-heading"
            >
              <h3
                className="dashboard-dialog-section-label"
                id="roles-edit-details-heading"
              >
                Role details
              </h3>
              <p className="roles-role-form-meta">
                <span className="roles-role-form-meta-label">Role ID</span>
                <code className="roles-role-form-meta-code">{editTarget.id}</code>
                {editTarget.is_system && (
                  <span className="roles-role-form-meta-badge">System</span>
                )}
              </p>
              {editTarget.is_system && (
                <p className="roles-role-form-callout roles-role-form-callout--system">
                  The API may not allow changing the name, description, or
                  permissions of system roles.
                </p>
              )}
              <p className="roles-role-form-hint">
                Update the display name and description. Permissions can be
                adjusted below or from the key icon on the roles list.
              </p>
              <label className="dashboard-dialog-field">
                <span>
                  Role name{' '}
                  <span className="roles-role-form-required" aria-label="required">
                    *
                  </span>
                </span>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Role name"
                  autoComplete="off"
                  required
                />
              </label>
              <label className="dashboard-dialog-field">
                <span>Description</span>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Optional — summarize what this role is for."
                  rows={3}
                />
              </label>
            </section>

            <section
              className="roles-role-form-section"
              aria-labelledby="roles-edit-perms-heading"
            >
              <h3
                className="dashboard-dialog-section-label"
                id="roles-edit-perms-heading"
              >
                Permissions
              </h3>
              <p className="roles-role-form-hint">
                Grant or revoke permissions below. <strong>Save changes</strong>{' '}
                updates the role details above and this permission set together.
                The <code>all</code> option still means every permission.
              </p>
              {catalogError && (
                <p className="roles-role-form-hint" style={{ color: '#b45309' }}>
                  {catalogError}{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => void loadCatalog()}
                  >
                    Retry catalog
                  </button>
                </p>
              )}
              {editSelected.all && (
                <p className="roles-role-form-callout">
                  Only <code>all</code> will be stored; it grants every permission.
                </p>
              )}
              <div className="roles-permission-picker roles-permission-picker--dialog roles-permission-picker--edit">
                {[...editGroups.entries()].map(([prefix, keys]) => (
                  <div className="roles-permission-group" key={prefix}>
                    <div className="roles-permission-group-title">{prefix}</div>
                    {keys.map((key) => (
                      <div className="roles-permission-checkbox-row" key={key}>
                        <Checkbox
                          checked={isEffectivePermissionChecked(key, editSelected)}
                          onCheckedChange={() => toggleEditPerm(key)}
                          ariaLabel={key}
                        />
                        <code className="roles-permission-key">{key}</code>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            <div className="dashboard-dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeEdit}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </DashboardDialog>

      <DashboardDialog
        open={Boolean(permTarget)}
        onClose={closePerm}
        title={permTarget ? `Permissions — ${permTarget.name}` : 'Permissions'}
        wide
      >
        {permTarget && (
          <form onSubmit={(e) => void handleSavePermissions(e)}>
            {permRoleDetail?.is_system && (
              <p style={{ color: '#b45309', marginTop: 0, fontSize: '0.875rem' }}>
                System role: changes may be limited by the API.
              </p>
            )}
            {permSelected.all && (
              <p style={{ marginTop: 0, fontSize: '0.875rem', color: 'var(--dashboard-muted, #64748b)' }}>
                The <code>all</code> permission is stored once on the role and
                grants every permission.
              </p>
            )}
            <div
              className="roles-permission-picker"
              style={{
                maxHeight: 360,
                overflowY: 'auto',
                border: '1px solid var(--dashboard-border, #e2e8f0)',
                borderRadius: 8,
                padding: '0.75rem',
              }}
            >
              {[...permGroups.entries()].map(([prefix, keys]) => (
                <div key={prefix} style={{ marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      color: 'var(--dashboard-muted, #64748b)',
                      marginBottom: 6,
                    }}
                  >
                    {prefix}
                  </div>
                  {keys.map((key) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4,
                        fontSize: '0.875rem',
                      }}
                    >
                      <Checkbox
                        checked={isEffectivePermissionChecked(key, permSelected)}
                        onCheckedChange={() => togglePerm(key)}
                        ariaLabel={key}
                      />
                      <span style={{ fontFamily: 'monospace' }}>{key}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {canManage && (
              <div className="dashboard-dialog-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closePerm}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? 'Saving…' : 'Save permissions'}
                </button>
              </div>
            )}
          </form>
        )}
      </DashboardDialog>

      <DashboardDialog
        open={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        title={viewTarget ? viewTarget.name : 'Role'}
        wide
      >
        {viewTarget && (
          <div className="dashboard-dialog-body dashboard-dialog-body--role-details">
            <dl
              style={{
                display: 'grid',
                gridTemplateColumns: '8rem 1fr',
                gap: '0.35rem 1rem',
                fontSize: '0.9rem',
              }}
            >
              <dt style={{ color: 'var(--dashboard-muted)' }}>ID</dt>
              <dd style={{ margin: 0 }}>
                <code>{viewTarget.id}</code>
              </dd>
              <dt style={{ color: 'var(--dashboard-muted)' }}>System</dt>
              <dd style={{ margin: 0 }}>{viewTarget.is_system ? 'Yes' : 'No'}</dd>
              <dt style={{ color: 'var(--dashboard-muted)' }}>Description</dt>
              <dd style={{ margin: 0 }}>{viewTarget.description || '—'}</dd>
            </dl>
            <p
              style={{
                fontWeight: 600,
                marginTop: '1rem',
                marginBottom: '0.5rem',
              }}
            >
              {roleHasAllPermission(viewTarget.permissions)
                ? 'Permissions — full access'
                : `Permissions (${viewTarget.permissions?.length ?? 0})`}
            </p>
            {roleHasAllPermission(viewTarget.permissions) && (
              <p
                style={{
                  marginTop: '-0.25rem',
                  marginBottom: '0.75rem',
                  fontSize: '0.875rem',
                  color: 'var(--dashboard-muted, #64748b)',
                }}
              >
                The <code>all</code> permission includes every permission in the
                catalog.
              </p>
            )}
            <div
              style={{
                maxHeight: 240,
                overflowY: 'auto',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {(viewTarget.permissions ?? []).length === 0 && (
                <span style={{ color: 'var(--dashboard-muted)' }}>None listed</span>
              )}
              {(viewTarget.permissions ?? []).map((p) => (
                <span
                  key={p}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'var(--dashboard-surface-2, #f1f5f9)',
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
            <div className="dashboard-dialog-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => setViewTarget(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </DashboardDialog>
    </div>
  )
}
