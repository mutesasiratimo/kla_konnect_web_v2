import React, { useMemo, useState } from 'react'
import type { GridColDef } from '@mui/x-data-grid'
import type {
  NewsArticleCreate,
  NewsArticleRead,
  NewsArticleStatus,
} from '../../api/types'
import { newsArticles as api } from '../../api/endpoints'
import { DashboardDialog } from '../DashboardDialog'
import { ImageUploadDropzone } from '../FileUploadDropzone'
import { getSession, resolveApiMediaUrl } from '../../api/client'
import { DashboardDataGrid } from '../table/DashboardDataGrid'
import {
  alertError,
  alertSuccess,
  closeAlert,
  confirmAction,
  showLoading,
} from '../../utils/alerts'

interface NewsListProps {
  articles: NewsArticleRead[]
  categories: { id: string; name: string }[]
  onRefresh: () => void
}

type ArticleForm = {
  category_id: string
  title: string
  image: string
  body: string
  status: NewsArticleStatus
  url: string
}

const emptyForm = (defaultCategoryId = ''): ArticleForm => ({
  category_id: defaultCategoryId,
  title: '',
  image: '',
  body: '',
  status: 0,
  url: '',
})

const statusLabel = (status: number) =>
  status === 0 ? 'Draft' : status === 1 ? 'Published' : 'Archived'

export const NewsList: React.FC<NewsListProps> = ({
  articles,
  categories,
  onRefresh,
}) => {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<NewsArticleRead | null>(null)
  const [viewTarget, setViewTarget] = useState<NewsArticleRead | null>(null)
  const [form, setForm] = useState<ArticleForm>(
    emptyForm(categories[0]?.id ?? ''),
  )
  const [saving, setSaving] = useState(false)
  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const resetAndOpenCreate = () => {
    setEditTarget(null)
    setForm(emptyForm(categories[0]?.id ?? ''))
    setCreateOpen(true)
  }

  const closeDialogs = () => {
    setCreateOpen(false)
    setEditTarget(null)
    setViewTarget(null)
  }

  const openEdit = (row: NewsArticleRead) => {
    setCreateOpen(false)
    setEditTarget(row)
    setForm({
      category_id: row.category_id,
      title: row.title,
      image: row.image ?? '',
      body: row.body,
      status: row.status,
      url: row.url,
    })
  }

  const buildPayload = (): NewsArticleCreate => {
    const userId = getSession()?.user?.id ?? 'system'
    return {
      category_id: form.category_id,
      title: form.title.trim(),
      image: form.image.trim() || null,
      body: form.body.trim(),
      status: form.status,
      url: form.url.trim(),
      userid: userId,
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category_id || !form.title.trim() || !form.body.trim()) return
    setSaving(true)
    try {
      showLoading('Saving article', 'Please wait…')
      await api.create(buildPayload())
      closeDialogs()
      await onRefresh()
      closeAlert()
      await alertSuccess('Saved', 'News article created.')
    } catch (error) {
      console.error(error)
      closeAlert()
      await alertError('Failed', 'Could not create news article.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget || !form.category_id || !form.title.trim() || !form.body.trim())
      return
    setSaving(true)
    try {
      showLoading('Saving article', 'Please wait…')
      await api.update(editTarget.id, {
        category_id: form.category_id,
        title: form.title.trim(),
        image: form.image.trim() || null,
        body: form.body.trim(),
        status: form.status,
        url: form.url.trim(),
      })
      closeDialogs()
      await onRefresh()
      closeAlert()
      await alertSuccess('Saved', 'News article updated.')
    } catch (error) {
      console.error(error)
      closeAlert()
      await alertError('Failed', 'Could not update news article.')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (id: string) => {
    const ok = await confirmAction({ title: 'Archive this article?', confirmButtonText: 'Archive' })
    if (!ok) return
    try {
      showLoading('Archiving article', 'Please wait…')
      await api.delete(id, false)
      await onRefresh()
      closeAlert()
      await alertSuccess('Archived', 'The article was archived.')
    } catch (error) {
      console.error(error)
      closeAlert()
      await alertError('Failed', 'Could not archive news article.')
    }
  }

  const columns: GridColDef<NewsArticleRead>[] = [
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 160 },
    {
      field: 'category_id',
      headerName: 'Category',
      flex: 1,
      minWidth: 120,
      valueGetter: (_v, row) => categoryNameById[row.category_id] || '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      valueGetter: (_v, row) => statusLabel(row.status),
    },
    {
      field: 'datecreated',
      headerName: 'Created',
      flex: 1,
      minWidth: 160,
      valueGetter: (_v, row) => new Date(row.datecreated).toLocaleString(),
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
            aria-label="View article"
            onClick={() => setViewTarget(params.row)}
          >
            <i className="fa fa-eye" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ width: 30, height: 30, padding: 0 }}
            title="Edit"
            aria-label="Edit article"
            onClick={() => openEdit(params.row)}
          >
            <i className="fa fa-pencil" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ width: 30, height: 30, padding: 0, color: '#ef4444' }}
            title="Archive"
            aria-label="Archive article"
            onClick={() => void handleArchive(params.row.id)}
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
        <button type="button" className="primary-button" onClick={resetAndOpenCreate}>
          + New article
        </button>
      </div>

      <DashboardDialog
        open={createOpen}
        onClose={closeDialogs}
        title="New news article"
        titleId="news-article-create-title"
        wide
      >
        <form className="dashboard-dialog-form" onSubmit={handleCreate}>
          <div className="dashboard-dialog-side-image">
            <div className="dashboard-dialog-side-image__media">
              <div className="incident-details-image-pane dashboard-dialog-side-image__pane-fill">
                <ImageUploadDropzone
                  label="Article image"
                  valueUrl={form.image.trim() || null}
                  onUrlChange={(url) => setForm((f) => ({ ...f, image: url ?? '' }))}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="dashboard-dialog-side-image__fields">
              <label className="dashboard-dialog-field">
                <span>Title *</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </label>
              <label className="dashboard-dialog-field">
                <span>Category *</span>
                <select
                  className="dashboard-dialog-select"
                  value={form.category_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category_id: e.target.value }))
                  }
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-dialog-field">
                <span>Body *</span>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  required
                />
              </label>
              <label className="dashboard-dialog-field">
                <span>Source URL *</span>
                <input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                  required
                />
              </label>
              <label className="dashboard-dialog-field">
                <span>Status</span>
                <select
                  className="dashboard-dialog-select"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: Number(e.target.value) as NewsArticleStatus,
                    }))
                  }
                >
                  <option value={0}>Draft</option>
                  <option value={1}>Published</option>
                  <option value={2}>Archived</option>
                </select>
              </label>
            </div>
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
      </DashboardDialog>

      <DashboardDialog
        open={editTarget !== null}
        onClose={closeDialogs}
        title="Edit news article"
        titleId="news-article-edit-title"
        wide
      >
        <form className="dashboard-dialog-form" onSubmit={handleUpdate}>
          <div className="dashboard-dialog-side-image">
            <div className="dashboard-dialog-side-image__media">
              <div className="incident-details-image-pane dashboard-dialog-side-image__pane-fill">
                <ImageUploadDropzone
                  label="Article image"
                  valueUrl={form.image.trim() || null}
                  onUrlChange={(url) => setForm((f) => ({ ...f, image: url ?? '' }))}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="dashboard-dialog-side-image__fields">
              <label className="dashboard-dialog-field">
                <span>Title *</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </label>
              <label className="dashboard-dialog-field">
                <span>Category *</span>
                <select
                  className="dashboard-dialog-select"
                  value={form.category_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category_id: e.target.value }))
                  }
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-dialog-field">
                <span>Body *</span>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  required
                />
              </label>
              <label className="dashboard-dialog-field">
                <span>Source URL *</span>
                <input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  required
                />
              </label>
              <label className="dashboard-dialog-field">
                <span>Status</span>
                <select
                  className="dashboard-dialog-select"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: Number(e.target.value) as NewsArticleStatus,
                    }))
                  }
                >
                  <option value={0}>Draft</option>
                  <option value={1}>Published</option>
                  <option value={2}>Archived</option>
                </select>
              </label>
            </div>
          </div>
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
        title="News article details"
        titleId="news-article-view-title"
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
                    <p className="incident-details-image-empty">No article image</p>
                  )}
                </div>
              </div>
              <div
                className="dashboard-dialog-side-image__fields"
                style={{ display: 'grid', gap: '0.5rem' }}
              >
                <p>
                  <strong>Title:</strong> {viewTarget.title}
                </p>
                <p>
                  <strong>Category:</strong>{' '}
                  {categoryNameById[viewTarget.category_id] || '—'}
                </p>
                <p>
                  <strong>Status:</strong> {statusLabel(viewTarget.status)}
                </p>
                <p>
                  <strong>URL:</strong> {viewTarget.url}
                </p>
                <p>
                  <strong>Body:</strong> {viewTarget.body}
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
        <DashboardDataGrid<NewsArticleRead>
          rows={articles}
          columns={columns}
          getRowId={(row) => row.id}
          localeText={{ noRowsLabel: 'No news articles yet.' }}
        />
      </div>
    </div>
  )
}
