import React, { useState } from 'react'
import type { GridColDef } from '@mui/x-data-grid'
import type { IncidentCategoryRead } from '../../api/types'
import { resolveApiMediaUrl } from '../../api/client'
import { incidentCategories as categoryApi } from '../../api/endpoints'
import { DashboardDialog } from '../DashboardDialog'
import { ImageUploadDropzone } from '../FileUploadDropzone'
import { DashboardDataGrid } from '../table/DashboardDataGrid'

interface CategoryProps {
  categories: IncidentCategoryRead[]
  onRefresh: () => void
}

type FormState = {
  name: string
  description: string
  image: string
  autoapprove: boolean
  parent_category_id: string
}

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  image: '',
  autoapprove: false,
  parent_category_id: '',
})

function formFromCategory(cat: IncidentCategoryRead): FormState {
  return {
    name: cat.name,
    description: cat.description ?? '',
    image: cat.image ?? '',
    autoapprove: !!cat.autoapprove,
    parent_category_id: cat.parent_category_id ?? '',
  }
}

export const IncidentCategories: React.FC<CategoryProps> = ({
  categories,
  onRefresh,
}) => {
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<FormState>(emptyForm)
  const [editTarget, setEditTarget] = useState<IncidentCategoryRead | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)
  const [viewTarget, setViewTarget] = useState<IncidentCategoryRead | null>(null)
  const [saving, setSaving] = useState(false)
  const iconBtn: React.CSSProperties = { width: 30, height: 30, padding: 0 }

  const editingId = editTarget?.id ?? null
  const parentOptions = categories.filter((c) => c.id !== editingId)
  const parentNameById = Object.fromEntries(
    categories.map((c) => [c.id, c.name]),
  )

  const closeCreate = () => {
    setCreateOpen(false)
    setCreateForm(emptyForm())
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name.trim()) return
    setSaving(true)
    try {
      await categoryApi.create({
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
        image: createForm.image.trim() || null,
        autoapprove: createForm.autoapprove,
        parent_category_id: createForm.parent_category_id || null,
      })
      closeCreate()
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not create category.')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (cat: IncidentCategoryRead) => {
    setViewTarget(null)
    setEditTarget(cat)
    setEditForm(formFromCategory(cat))
  }

  const closeEdit = () => {
    setEditTarget(null)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget || !editForm.name.trim()) return
    setSaving(true)
    try {
      await categoryApi.update(editTarget.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        image: editForm.image.trim() || null,
        autoapprove: editForm.autoapprove,
        parent_category_id: editForm.parent_category_id || null,
      })
      closeEdit()
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
      await categoryApi.delete(id)
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not delete category.')
    }
  }

  const columns: GridColDef<IncidentCategoryRead>[] = [
    {
      field: 'image',
      headerName: 'Image',
      width: 72,
      sortable: false,
      renderCell: (params) => {
        const src = resolveApiMediaUrl(params.row.image)
        return src ? (
          <img
            src={src}
            alt=""
            style={{
              width: 40,
              height: 40,
              objectFit: 'cover',
              borderRadius: 6,
              display: 'block',
              border: '1px solid #e2e8f0',
            }}
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.visibility = 'hidden'
            }}
          />
        ) : (
          <span style={{ color: 'var(--dashboard-muted, #94a3b8)' }}>—</span>
        )
      },
    },
    {
      field: 'name',
      headerName: 'Category name',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => <strong>{params.row.name}</strong>,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 160,
      valueGetter: (_v, r) => r.description || '—',
    },
    {
      field: 'autoapprove',
      headerName: 'Auto-approve',
      width: 120,
      valueGetter: (_v, r) => (r.autoapprove ? 'Yes' : 'No'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 124,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <button
            type="button"
            className="secondary-button"
            style={iconBtn}
            title="View"
            aria-label="View category"
            onClick={() => setViewTarget(params.row)}
          >
            <i className="fa fa-eye" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="secondary-button"
            style={iconBtn}
            title="Edit"
            aria-label="Edit category"
            onClick={() => openEdit(params.row)}
          >
            <i className="fa fa-pencil" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ ...iconBtn, color: '#ef4444' }}
            title="Delete"
            aria-label="Delete category"
            onClick={() => void handleDelete(params.row.id)}
          >
            <i className="fa fa-trash" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className="dashboard-page-header-row" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setCreateForm(emptyForm())
            setCreateOpen(true)
          }}
        >
          + New category
        </button>
      </div>

      <DashboardDialog
        open={createOpen}
        onClose={closeCreate}
        title="New category"
        titleId="incident-cat-create-title"
        wide
      >
        <form className="dashboard-dialog-form" onSubmit={handleCreate}>
          <div className="dashboard-dialog-side-image">
            <div className="dashboard-dialog-side-image__media">
              <div className="incident-details-image-pane dashboard-dialog-side-image__pane-fill">
                <ImageUploadDropzone
                  label="Category image"
                  valueUrl={createForm.image.trim() || null}
                  onUrlChange={(url) =>
                    setCreateForm((f) => ({ ...f, image: url ?? '' }))
                  }
                  disabled={saving}
                />
              </div>
            </div>
            <div className="dashboard-dialog-side-image__fields">
              <label className="dashboard-dialog-field">
                <span>Name *</span>
                <input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  autoComplete="off"
                />
              </label>
              <label className="dashboard-dialog-field">
                <span>Description</span>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </label>
              <label
                className="dashboard-dialog-field"
                style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}
              >
                <input
                  type="checkbox"
                  checked={createForm.autoapprove}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, autoapprove: e.target.checked }))
                  }
                />
                <span style={{ margin: 0 }}>Auto-approve</span>
              </label>
              <label className="dashboard-dialog-field">
                <span>Parent category</span>
                <select
                  className="dashboard-dialog-select"
                  value={createForm.parent_category_id}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      parent_category_id: e.target.value,
                    }))
                  }
                >
                  <option value="">None (root)</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="dashboard-dialog-actions">
            <button type="button" className="secondary-button" onClick={closeCreate}>
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
        onClose={closeEdit}
        title="Edit category"
        titleId="incident-cat-edit-title"
        wide
      >
        <form className="dashboard-dialog-form" onSubmit={handleUpdate}>
          <div className="dashboard-dialog-side-image">
            <div className="dashboard-dialog-side-image__media">
              <div className="incident-details-image-pane dashboard-dialog-side-image__pane-fill">
                <ImageUploadDropzone
                  label="Category image"
                  valueUrl={editForm.image.trim() || null}
                  onUrlChange={(url) =>
                    setEditForm((f) => ({ ...f, image: url ?? '' }))
                  }
                  disabled={saving}
                />
              </div>
            </div>
            <div className="dashboard-dialog-side-image__fields">
              <label className="dashboard-dialog-field">
                <span>Name *</span>
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  autoComplete="off"
                />
              </label>
              <label className="dashboard-dialog-field">
                <span>Description</span>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </label>
              <label
                className="dashboard-dialog-field"
                style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}
              >
                <input
                  type="checkbox"
                  checked={editForm.autoapprove}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, autoapprove: e.target.checked }))
                  }
                />
                <span style={{ margin: 0 }}>Auto-approve</span>
              </label>
              <label className="dashboard-dialog-field">
                <span>Parent category</span>
                <select
                  className="dashboard-dialog-select"
                  value={editForm.parent_category_id}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      parent_category_id: e.target.value,
                    }))
                  }
                >
                  <option value="">None (root)</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="dashboard-dialog-actions">
            <button type="button" className="secondary-button" onClick={closeEdit}>
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
        onClose={() => setViewTarget(null)}
        title="Category details"
        titleId="incident-cat-view-title"
        wide
      >
        <div className="dashboard-dialog-body">
          {viewTarget && (() => {
            const viewImageSrc = resolveApiMediaUrl(viewTarget.image)
            return (
            <div className="dashboard-dialog-side-image">
              <div className="dashboard-dialog-side-image__media">
                <div className="dashboard-dialog-side-image__frame-square">
                  {viewImageSrc ? (
                    <img
                      src={viewImageSrc}
                      alt=""
                      className="incident-details-image dashboard-dialog-side-image__frame-img"
                      loading="lazy"
                    />
                  ) : (
                    <p className="incident-details-image-empty">No category image</p>
                  )}
                </div>
              </div>
              <div
                className="dashboard-dialog-side-image__fields"
                style={{ display: 'grid', gap: '0.5rem' }}
              >
                <p>
                  <strong>Name:</strong> {viewTarget.name}
                </p>
                <p>
                  <strong>Description:</strong> {viewTarget.description || '—'}
                </p>
                <p>
                  <strong>Auto-approve:</strong>{' '}
                  {viewTarget.autoapprove ? 'Yes' : 'No'}
                </p>
                <p>
                  <strong>Parent:</strong>{' '}
                  {viewTarget.parent_category_id
                    ? parentNameById[viewTarget.parent_category_id] ??
                      viewTarget.parent_category_id
                    : '— (root)'}
                </p>
                {viewImageSrc && (
                  <p style={{ margin: 0 }}>
                    <a href={viewImageSrc} target="_blank" rel="noreferrer">
                      Open image in new tab
                    </a>
                  </p>
                )}
              </div>
            </div>
            )
          })()}
        </div>
      </DashboardDialog>

      <div className="dashboard-table-shell">
        <DashboardDataGrid<IncidentCategoryRead>
          rows={categories}
          columns={columns}
          getRowId={(row) => row.id}
          localeText={{
            noRowsLabel: 'No categories yet. Create one to classify incidents.',
          }}
        />
      </div>
    </div>
  )
}
