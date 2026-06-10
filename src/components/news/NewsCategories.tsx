import React, { useState } from 'react'
import type { GridColDef } from '@mui/x-data-grid'
import type { NewsCategoryRead } from '../../api/types'
import { newsCategories as api } from '../../api/endpoints'
import { DashboardDialog } from '../DashboardDialog'
import { DashboardDataGrid } from '../table/DashboardDataGrid'
import {
  alertError,
  alertInfo,
  alertSuccess,
  closeAlert,
  confirmAction,
  showLoading,
} from '../../utils/alerts'

interface NewsCategoriesProps {
  categories: NewsCategoryRead[]
  onRefresh: () => void
}

type FormState = {
  name: string
  description: string
}

const emptyForm = (): FormState => ({
  name: '',
  description: '',
})

export const NewsCategories: React.FC<NewsCategoriesProps> = ({
  categories,
  onRefresh,
}) => {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<NewsCategoryRead | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm())
    setCreateOpen(true)
  }

  const openEdit = (row: NewsCategoryRead) => {
    setCreateOpen(false)
    setEditTarget(row)
    setForm({
      name: row.name,
      description: row.description ?? '',
    })
  }

  const closeDialogs = () => {
    setCreateOpen(false)
    setEditTarget(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      showLoading('Saving category', 'Please wait…')
      await api.create({
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      closeDialogs()
      await onRefresh()
      closeAlert()
      await alertSuccess('Saved', 'News category created.')
    } catch (error) {
      console.error(error)
      closeAlert()
      await alertError('Failed', 'Could not create news category.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget || !form.name.trim()) return
    setSaving(true)
    try {
      showLoading('Saving category', 'Please wait…')
      await api.update(editTarget.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      closeDialogs()
      await onRefresh()
      closeAlert()
      await alertSuccess('Saved', 'News category updated.')
    } catch (error) {
      console.error(error)
      closeAlert()
      await alertError('Failed', 'Could not update news category.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: 'Archive this news category?',
      confirmButtonText: 'Archive',
    })
    if (!ok) return
    try {
      showLoading('Archiving category', 'Please wait…')
      await api.delete(id)
      await onRefresh()
      closeAlert()
      await alertSuccess('Archived', 'The news category was archived.')
    } catch (error) {
      console.error(error)
      closeAlert()
      await alertError('Failed', 'Could not archive news category.')
    }
  }

  const columns: GridColDef<NewsCategoryRead>[] = [
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
      width: 124,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <button
            type="button"
            className="secondary-button"
            style={{ width: 30, height: 30, padding: 0 }}
            title="View"
            aria-label="View category"
            onClick={() =>
              void alertInfo(
                params.row.name,
                params.row.description || 'No description',
              )
            }
          >
            <i className="fa fa-eye" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ width: 30, height: 30, padding: 0 }}
            title="Edit"
            aria-label="Edit category"
            onClick={() => openEdit(params.row)}
          >
            <i className="fa fa-pencil" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ width: 30, height: 30, padding: 0, color: '#ef4444' }}
            title="Archive"
            aria-label="Archive category"
            onClick={() => void handleDelete(params.row.id)}
          >
            <i className="fa fa-archive" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className="dashboard-page-header-row" style={{ marginBottom: '1rem' }}>
        <button type="button" className="primary-button" onClick={openCreate}>
          + New category
        </button>
      </div>

      <DashboardDialog
        open={createOpen}
        onClose={closeDialogs}
        title="New news category"
        titleId="news-category-create-title"
      >
        <form className="dashboard-dialog-form" onSubmit={handleCreate}>
          <label className="dashboard-dialog-field">
            <span>Name *</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
        title="Edit news category"
        titleId="news-category-edit-title"
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
        <DashboardDataGrid<NewsCategoryRead>
          rows={categories}
          columns={columns}
          getRowId={(row) => row.id}
          localeText={{ noRowsLabel: 'No news categories yet.' }}
        />
      </div>
    </div>
  )
}
