import React, { useMemo, useState } from 'react'
import type {
  RevenueCategoryRead,
  RevenueSubcategoryRead,
} from '../../api/types'
import { revenueSubcategories as api } from '../../api/endpoints'
import { suggestedCodeFromCategoryName } from '../../utils/codeFromCategoryName'
import { DashboardDialog } from '../DashboardDialog'
import { ImageUploadDropzone } from '../FileUploadDropzone'
import { DataTablePagination } from '../table/DataTablePagination'

interface RevenueCategoriesCrudListProps {
  parentCategories: RevenueCategoryRead[]
  categories: RevenueSubcategoryRead[]
  parentCategoryIdFilter: string
  onParentCategoryIdFilterChange: (id: string) => void
  onRefresh: () => void | Promise<void>
}

type FormState = {
  parent_category_id: string
  code: string
  name: string
  description: string
  photo_url: string
  can_hail: boolean
}

const emptyForm = (defaultParent = ''): FormState => ({
  parent_category_id: defaultParent,
  code: '',
  name: '',
  description: '',
  photo_url: '',
  can_hail: false,
})

const iconBtn: React.CSSProperties = { width: 30, height: 30, padding: 0 }

export const RevenueCategoriesCrudList: React.FC<
  RevenueCategoriesCrudListProps
> = ({
  parentCategories,
  categories,
  parentCategoryIdFilter,
  onParentCategoryIdFilterChange,
  onRefresh,
}) => {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RevenueSubcategoryRead | null>(
    null,
  )
  const [viewTarget, setViewTarget] = useState<RevenueSubcategoryRead | null>(
    null,
  )
  const [form, setForm] = useState<FormState>(
    emptyForm(parentCategories[0]?.id ?? ''),
  )
  const [saving, setSaving] = useState(false)
  const [createCodeFollowsName, setCreateCodeFollowsName] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const parentNameById = useMemo(
    () => Object.fromEntries(parentCategories.map((c) => [c.id, c.name])),
    [parentCategories],
  )
  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedCategories = useMemo(
    () =>
      categories.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [categories, currentPage],
  )

  const closeDialogs = () => {
    setCreateOpen(false)
    setEditTarget(null)
    setViewTarget(null)
    setForm(emptyForm(parentCategories[0]?.id ?? ''))
    setCreateCodeFollowsName(true)
  }

  const openCreate = () => {
    setEditTarget(null)
    setViewTarget(null)
    setForm(emptyForm(parentCategories[0]?.id ?? parentCategoryIdFilter ?? ''))
    setCreateCodeFollowsName(true)
    setCreateOpen(true)
  }

  const openEdit = (row: RevenueSubcategoryRead) => {
    setCreateOpen(false)
    setViewTarget(null)
    setEditTarget(row)
    setForm({
      parent_category_id: row.category_id,
      code: row.code,
      name: row.name,
      description: row.description ?? '',
      photo_url: row.photo_url ?? '',
      can_hail: row.can_hail === true,
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.parent_category_id || !form.code.trim() || !form.name.trim())
      return
    setSaving(true)
    try {
      await api.create({
        category_id: form.parent_category_id,
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        photo_url: form.photo_url.trim() || null,
        can_hail: form.can_hail,
      })
      closeDialogs()
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not create category.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget || !form.code.trim() || !form.name.trim()) return
    setSaving(true)
    try {
      await api.update(editTarget.id, {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        photo_url: form.photo_url.trim() || null,
        can_hail: form.can_hail,
      })
      closeDialogs()
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not update category.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category?')) return
    try {
      await api.delete(id, false)
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not delete category.')
    }
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div
        className="dashboard-page-header-row"
        style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}
      >
        <label className="dashboard-dialog-field" style={{ margin: 0, minWidth: 220 }}>
          <span>Filter by parent category</span>
          <select
            className="dashboard-dialog-select"
            value={parentCategoryIdFilter}
            onChange={(e) => onParentCategoryIdFilterChange(e.target.value)}
          >
            <option value="">All</option>
            {parentCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="primary-button"
          onClick={openCreate}
          disabled={parentCategories.length === 0}
          title={
            parentCategories.length === 0
              ? 'Create a parent category under Settings first'
              : undefined
          }
        >
          + New category
        </button>
      </div>

      <DashboardDialog
        open={createOpen}
        onClose={closeDialogs}
        title="New category"
        titleId="revenue-cat-create-title"
        wide
      >
        <form className="dashboard-dialog-form" onSubmit={handleCreate}>
          <label className="dashboard-dialog-field">
            <span>Parent category *</span>
            <select
              className="dashboard-dialog-select"
              value={form.parent_category_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, parent_category_id: e.target.value }))
              }
              required
            >
              <option value="">Select parent</option>
              {parentCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-dialog-field">
            <span>Name *</span>
            <input
              value={form.name}
              onChange={(e) => {
                const name = e.target.value
                setForm((f) => ({
                  ...f,
                  name,
                  ...(createCodeFollowsName
                    ? { code: suggestedCodeFromCategoryName(name) }
                    : {}),
                }))
              }}
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Code *</span>
            <input
              value={form.code}
              onChange={(e) => {
                setCreateCodeFollowsName(false)
                setForm((f) => ({ ...f, code: e.target.value }))
              }}
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>
          <ImageUploadDropzone
            label="Photo"
            valueUrl={form.photo_url.trim() || null}
            onUrlChange={(url) =>
              setForm((f) => ({ ...f, photo_url: url ?? '' }))
            }
            disabled={saving}
          />
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
              checked={form.can_hail}
              onChange={(e) =>
                setForm((f) => ({ ...f, can_hail: e.target.checked }))
              }
            />
            <span>Can hail (commute)</span>
          </label>
          <div className="dashboard-dialog-actions">
            <button type="button" className="secondary-button" onClick={closeDialogs}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              Save
            </button>
          </div>
        </form>
      </DashboardDialog>

      <DashboardDialog
        open={editTarget !== null}
        onClose={closeDialogs}
        title="Edit category"
        titleId="revenue-cat-edit-title"
        wide
      >
        <form className="dashboard-dialog-form" onSubmit={handleUpdate}>
          <label className="dashboard-dialog-field">
            <span>Parent category</span>
            <input
              type="text"
              readOnly
              disabled
              value={
                editTarget
                  ? parentNameById[editTarget.category_id] ??
                    editTarget.category_id
                  : ''
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Name *</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Code *</span>
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>
          <ImageUploadDropzone
            label="Photo"
            valueUrl={form.photo_url.trim() || null}
            onUrlChange={(url) =>
              setForm((f) => ({ ...f, photo_url: url ?? '' }))
            }
            disabled={saving}
          />
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
              checked={form.can_hail}
              onChange={(e) =>
                setForm((f) => ({ ...f, can_hail: e.target.checked }))
              }
            />
            <span>Can hail (commute)</span>
          </label>
          <div className="dashboard-dialog-actions">
            <button type="button" className="secondary-button" onClick={closeDialogs}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              Update
            </button>
          </div>
        </form>
      </DashboardDialog>

      <DashboardDialog
        open={viewTarget !== null}
        onClose={closeDialogs}
        title="Category details"
        titleId="revenue-cat-view-title"
        wide
      >
        <div className="dashboard-dialog-body">
          {viewTarget && (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <p>
                <strong>Parent:</strong>{' '}
                {parentNameById[viewTarget.category_id] ??
                  viewTarget.category_id}
              </p>
              <p>
                <strong>Code:</strong> {viewTarget.code}
              </p>
              <p>
                <strong>Name:</strong> {viewTarget.name}
              </p>
              <p>
                <strong>Description:</strong> {viewTarget.description || '—'}
              </p>
              <p>
                <strong>Can hail:</strong>{' '}
                {viewTarget.can_hail === true ? 'Yes' : 'No'}
              </p>
              {viewTarget.photo_url && (
                <p>
                  <strong>Photo:</strong>{' '}
                  <a href={viewTarget.photo_url} target="_blank" rel="noreferrer">
                    {viewTarget.photo_url}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      </DashboardDialog>

      <div className="dashboard-table-shell">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Parent category</th>
              <th>Code</th>
              <th>Name</th>
              <th>Can hail</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedCategories.map((row) => (
              <tr key={row.id}>
                <td>{parentNameById[row.category_id] ?? row.category_id}</td>
                <td>{row.code}</td>
                <td>{row.name}</td>
                <td>{row.can_hail === true ? 'Yes' : 'No'}</td>
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
                      style={iconBtn}
                      title="View"
                      aria-label="View category"
                      onClick={() => setViewTarget(row)}
                    >
                      <i className="fa fa-eye" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={iconBtn}
                      title="Edit"
                      aria-label="Edit category"
                      onClick={() => openEdit(row)}
                    >
                      <i className="fa fa-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ ...iconBtn, color: '#ef4444' }}
                      title="Delete"
                      aria-label="Delete category"
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
        {categories.length === 0 && (
          <p style={{ padding: '1rem', color: 'var(--dashboard-muted, #64748b)' }}>
            No categories for this filter.
          </p>
        )}
        <DataTablePagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={categories.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPage(1)
            setPageSize(size)
          }}
        />
      </div>
    </div>
  )
}
