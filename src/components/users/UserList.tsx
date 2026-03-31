import React, { useMemo, useState } from 'react'
import type { RoleRead, UserCreate, UserRead, UserUpdate } from '../../api/types'
import { users as usersApi } from '../../api/endpoints'
import { DashboardDialog } from '../DashboardDialog'

interface UserListProps {
  users: UserRead[]
  roles: RoleRead[]
  onRefresh: () => void
}

function displayName(u: UserRead): string {
  const fromParts = [u.firstname, u.lastothernames].filter(Boolean).join(' ').trim()
  return (
    u.full_name?.trim() ||
    fromParts ||
    u.email
  )
}

type CreateForm = {
  email: string
  password: string
  full_name: string
  phone: string
  id_type: string
  id_number: string
  role_id: string
}

const emptyCreate = (): CreateForm => ({
  email: '',
  password: '',
  full_name: '',
  phone: '',
  id_type: '',
  id_number: '',
  role_id: '',
})

type EditForm = {
  full_name: string
  phone: string
  id_type: string
  id_number: string
  role_id: string
  is_active: boolean
  is_verified: boolean
}

const toEditForm = (u: UserRead): EditForm => ({
  full_name: u.full_name ?? '',
  phone: u.phone ?? '',
  id_type: u.id_type ?? '',
  id_number: u.id_number ?? '',
  role_id: u.role_id ?? '',
  is_active: u.is_active,
  is_verified: u.is_verified,
})

export const UserList: React.FC<UserListProps> = ({
  users,
  roles,
  onRefresh,
}) => {
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate)
  const [editTarget, setEditTarget] = useState<UserRead | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [viewTarget, setViewTarget] = useState<UserRead | null>(null)
  const [filterText, setFilterText] = useState('')
  const [saving, setSaving] = useState(false)

  const roleNameById = useMemo(
    () => Object.fromEntries(roles.map((r) => [r.id, r.name])),
    [roles],
  )

  const filteredUsers = useMemo(() => {
    const q = filterText.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => {
      const blob = [
        displayName(u),
        u.email,
        u.id_number ?? '',
        u.phone ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [users, filterText])

  const closeDialogs = () => {
    setCreateOpen(false)
    setCreateForm(emptyCreate())
    setEditTarget(null)
    setEditForm(null)
    setViewTarget(null)
  }

  const openCreate = () => {
    setEditTarget(null)
    setEditForm(null)
    setViewTarget(null)
    setCreateForm(emptyCreate())
    setCreateOpen(true)
  }

  const openEdit = (u: UserRead) => {
    setCreateOpen(false)
    setViewTarget(null)
    setEditTarget(u)
    setEditForm(toEditForm(u))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.email.trim() || createForm.password.length < 6) return
    const payload: UserCreate = {
      email: createForm.email.trim(),
      password: createForm.password,
      full_name: createForm.full_name.trim() || null,
      phone: createForm.phone.trim() || null,
      id_type: createForm.id_type.trim() || null,
      id_number: createForm.id_number.trim() || null,
      role_id: createForm.role_id || null,
    }
    setSaving(true)
    try {
      await usersApi.register(payload)
      closeDialogs()
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not create user.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget || !editForm) return
    const body: UserUpdate = {
      full_name: editForm.full_name.trim() || null,
      phone: editForm.phone.trim() || null,
      id_type: editForm.id_type.trim() || null,
      id_number: editForm.id_number.trim() || null,
      role_id: editForm.role_id || null,
      is_active: editForm.is_active,
      is_verified: editForm.is_verified,
    }
    setSaving(true)
    try {
      await usersApi.update(editTarget.id, body)
      closeDialogs()
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not update user.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this user account?')) return
    try {
      await usersApi.delete(id)
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not delete user.')
    }
  }

  const iconBtnStyle: React.CSSProperties = {
    width: 30,
    height: 30,
    padding: 0,
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div
        className="dashboard-page-header-row"
        style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}
      >
        <label className="dashboard-dialog-field" style={{ margin: 0, flex: '1 1 220px' }}>
          <span>Filter</span>
          <input
            type="search"
            placeholder="Name, email, phone, ID…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </label>
        <button type="button" className="primary-button" onClick={openCreate}>
          + New user
        </button>
      </div>

      <DashboardDialog
        open={createOpen}
        onClose={closeDialogs}
        title="New user"
        titleId="user-create-title"
        wide
      >
        <form className="dashboard-dialog-form" onSubmit={handleCreate}>
          <label className="dashboard-dialog-field">
            <span>Email *</span>
            <input
              type="email"
              autoComplete="off"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Password * (min 6 characters)</span>
            <input
              type="password"
              autoComplete="new-password"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, password: e.target.value }))
              }
              minLength={6}
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Full name</span>
            <input
              value={createForm.full_name}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, full_name: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Phone</span>
            <input
              value={createForm.phone}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>ID type</span>
            <input
              value={createForm.id_type}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, id_type: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>ID number</span>
            <input
              value={createForm.id_number}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, id_number: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Role</span>
            <select
              className="dashboard-dialog-select"
              value={createForm.role_id}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, role_id: e.target.value }))
              }
            >
              <option value="">— None —</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <div className="dashboard-dialog-actions">
            <button type="button" className="secondary-button" onClick={closeDialogs}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              Create
            </button>
          </div>
        </form>
      </DashboardDialog>

      <DashboardDialog
        open={editTarget !== null && editForm !== null}
        onClose={closeDialogs}
        title="Edit user"
        titleId="user-edit-title"
        wide
      >
        {editTarget && editForm && (
          <form className="dashboard-dialog-form" onSubmit={handleUpdate}>
            <label className="dashboard-dialog-field">
              <span>Email</span>
              <input type="email" value={editTarget.email} readOnly disabled />
            </label>
            <label className="dashboard-dialog-field">
              <span>Full name</span>
              <input
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm((f) => (f ? { ...f, full_name: e.target.value } : f))
                }
              />
            </label>
            <label className="dashboard-dialog-field">
              <span>Phone</span>
              <input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((f) => (f ? { ...f, phone: e.target.value } : f))
                }
              />
            </label>
            <label className="dashboard-dialog-field">
              <span>ID type</span>
              <input
                value={editForm.id_type}
                onChange={(e) =>
                  setEditForm((f) => (f ? { ...f, id_type: e.target.value } : f))
                }
              />
            </label>
            <label className="dashboard-dialog-field">
              <span>ID number</span>
              <input
                value={editForm.id_number}
                onChange={(e) =>
                  setEditForm((f) =>
                    f ? { ...f, id_number: e.target.value } : f,
                  )
                }
              />
            </label>
            <label className="dashboard-dialog-field">
              <span>Role</span>
              <select
                className="dashboard-dialog-select"
                value={editForm.role_id}
                onChange={(e) =>
                  setEditForm((f) => (f ? { ...f, role_id: e.target.value } : f))
                }
              >
                <option value="">— None —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, is_active: e.target.checked } : f,
                    )
                  }
                />
                <span>Active</span>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={editForm.is_verified}
                  onChange={(e) =>
                    setEditForm((f) =>
                      f ? { ...f, is_verified: e.target.checked } : f,
                    )
                  }
                />
                <span>Verified</span>
              </label>
            </div>
            <div className="dashboard-dialog-actions">
              <button type="button" className="secondary-button" onClick={closeDialogs}>
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={saving}>
                Save
              </button>
            </div>
          </form>
        )}
      </DashboardDialog>

      <DashboardDialog
        open={viewTarget !== null}
        onClose={closeDialogs}
        title="User details"
        titleId="user-view-title"
        wide
      >
        <div className="dashboard-dialog-body">
          {viewTarget && (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <p>
                <strong>Name:</strong> {displayName(viewTarget)}
              </p>
              <p>
                <strong>Email:</strong> {viewTarget.email}
              </p>
              <p>
                <strong>Phone:</strong> {viewTarget.phone ?? '—'}
              </p>
              <p>
                <strong>ID type / number:</strong>{' '}
                {[viewTarget.id_type, viewTarget.id_number].filter(Boolean).join(' ') ||
                  '—'}
              </p>
              <p>
                <strong>Role:</strong>{' '}
                {viewTarget.role_id
                  ? roleNameById[viewTarget.role_id] ?? viewTarget.role_id
                  : '—'}
              </p>
              <p>
                <strong>Active:</strong> {viewTarget.is_active ? 'Yes' : 'No'}
              </p>
              <p>
                <strong>Verified:</strong>{' '}
                {viewTarget.is_verified ? 'Yes' : 'No'}
              </p>
            </div>
          )}
        </div>
      </DashboardDialog>

      <div className="dashboard-table-shell">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>ID number</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((row) => (
              <tr key={row.id}>
                <td>{displayName(row)}</td>
                <td>{row.id_number ?? '—'}</td>
                <td>{row.email}</td>
                <td>{row.phone ?? '—'}</td>
                <td>
                  {row.role_id ? roleNameById[row.role_id] ?? row.role_id : '—'}
                </td>
                <td>
                  {row.is_active ? 'Active' : 'Inactive'}
                  {row.is_verified ? ' · Verified' : ''}
                </td>
                <td>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.35rem',
                      alignItems: 'center',
                    }}
                  >
                    <button
                      type="button"
                      className="secondary-button"
                      style={iconBtnStyle}
                      title="View"
                      aria-label="View user"
                      onClick={() => setViewTarget(row)}
                    >
                      <i className="fa fa-eye" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={iconBtnStyle}
                      title="Edit"
                      aria-label="Edit user"
                      onClick={() => openEdit(row)}
                    >
                      <i className="fa fa-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ ...iconBtnStyle, color: '#ef4444' }}
                      title="Delete"
                      aria-label="Delete user"
                      onClick={() => handleDelete(row.id)}
                    >
                      <i className="fa fa-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <p style={{ padding: '1rem', color: 'var(--dashboard-muted, #64748b)' }}>
            {users.length === 0
              ? 'No users loaded.'
              : 'No users match this filter.'}
          </p>
        )}
      </div>
    </div>
  )
}
