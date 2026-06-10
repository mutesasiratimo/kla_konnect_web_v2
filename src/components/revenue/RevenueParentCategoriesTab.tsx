import React, { useState } from 'react'
import type { GridColDef } from '@mui/x-data-grid'
import type { RevenueCategoryRead } from '../../api/types'
import { revenueCategories as api } from '../../api/endpoints'
import { suggestedCodeFromCategoryName } from '../../utils/codeFromCategoryName'
import { DashboardDialog } from '../DashboardDialog'
import { DashboardDataGrid } from '../table/DashboardDataGrid'
import {
  alertError,
  alertSuccess,
  closeAlert,
  confirmAction,
  showLoading,
} from '../../utils/alerts'

interface RevenueParentCategoriesTabProps {
  categories: RevenueCategoryRead[]
  onRefresh: () => void | Promise<void>
}

type CatForm = { code: string; name: string; description: string }
const emptyCatForm = (): CatForm => ({ code: '', name: '', description: '' })

const iconBtn: React.CSSProperties = { width: 30, height: 30, padding: 0 }

export const RevenueParentCategoriesTab: React.FC<
  RevenueParentCategoriesTabProps
> = ({ categories, onRefresh }) => {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RevenueCategoryRead | null>(null)
  const [form, setForm] = useState<CatForm>(emptyCatForm())
  const [saving, setSaving] = useState(false)
  /** While true, code updates from name on create; cleared when user edits code. */
  const [createCodeFollowsName, setCreateCodeFollowsName] = useState(true)
  const closeDialogs = () => {
    setCreateOpen(false)
    setEditTarget(null)
    setForm(emptyCatForm())
    setCreateCodeFollowsName(true)
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyCatForm())
    setCreateCodeFollowsName(true)
    setCreateOpen(true)
  }

  const openEdit = (row: RevenueCategoryRead) => {
    setCreateOpen(false)
    setEditTarget(row)
    setForm({
      code: row.code,
      name: row.name,
      description: row.description ?? '',
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.name.trim()) return
    setSaving(true)
    try {
      showLoading('Saving category', 'Please wait…')
      await api.create({
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      closeDialogs()
      await onRefresh()
      closeAlert()
      await alertSuccess('Saved', 'Parent category created.')
    } catch (err) {
      console.error(err)
      closeAlert()
      await alertError('Failed', 'Could not create parent category.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget || !form.code.trim() || !form.name.trim()) return
    setSaving(true)
    try {
      showLoading('Saving category', 'Please wait…')
      await api.update(editTarget.id, {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      closeDialogs()
      await onRefresh()
      closeAlert()
      await alertSuccess('Saved', 'Parent category updated.')
    } catch (err) {
      console.error(err)
      closeAlert()
      await alertError('Failed', 'Could not update parent category.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: 'Delete this parent category?',
      confirmButtonText: 'Delete',
    })
    if (!ok) return
    try {
      showLoading('Deleting category', 'Please wait…')
      await api.delete(id, false)
      await onRefresh()
      closeAlert()
      await alertSuccess('Deleted', 'The parent category was removed.')
    } catch (err) {
      console.error(err)
      closeAlert()
      await alertError('Failed', 'Could not delete parent category.')
    }
  }

  const columns: GridColDef<RevenueCategoryRead>[] = [
    { field: 'code', headerName: 'Code', width: 120 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 180,
      valueGetter: (_v, r) => r.description || '—',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <button
            type="button"
            className="secondary-button"
            style={iconBtn}
            title="Edit"
            aria-label="Edit parent category"
            onClick={() => openEdit(params.row)}
          >
            <i className="fa fa-pencil" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ ...iconBtn, color: '#ef4444' }}
            title="Delete"
            aria-label="Delete parent category"
            onClick={() => void handleDelete(params.row.id)}
          >
            <i className="fa fa-trash" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div style={{ marginTop: '1rem' }}>
      <div
        className="dashboard-page-header-row"
        style={{ marginBottom: '1rem', justifyContent: 'flex-end' }}
      >
        <button type="button" className="primary-button" onClick={openCreate}>
          + New parent category
        </button>
      </div>

      <DashboardDialog
        open={createOpen}
        onClose={closeDialogs}
        title="New parent category"
        titleId="revenue-parent-cat-create-title"
      >
        <form className="dashboard-dialog-form" onSubmit={handleCreate}>
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
        title="Edit parent category"
        titleId="revenue-parent-cat-edit-title"
      >
        <form className="dashboard-dialog-form" onSubmit={handleUpdate}>
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

      <div className="dashboard-table-shell">
        <DashboardDataGrid<RevenueCategoryRead>
          rows={categories}
          columns={columns}
          getRowId={(row) => row.id}
          localeText={{ noRowsLabel: 'No parent categories yet.' }}
        />
      </div>
    </div>
  )
}
