import React, { useMemo, useState } from 'react'
import type {
  NewsArticleCreate,
  NewsArticleRead,
  NewsArticleStatus,
} from '../../api/types'
import { newsArticles as api } from '../../api/endpoints'
import { DashboardDialog } from '../DashboardDialog'
import { ImageUploadDropzone } from '../FileUploadDropzone'
import { getSession } from '../../api/client'
import { DataTablePagination } from '../table/DataTablePagination'

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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )
  const totalPages = Math.max(1, Math.ceil(articles.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedArticles = articles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
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
      await api.create(buildPayload())
      closeDialogs()
      await onRefresh()
    } catch (error) {
      console.error(error)
      window.alert('Could not create news article.')
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
    } catch (error) {
      console.error(error)
      window.alert('Could not update news article.')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (id: string) => {
    if (!window.confirm('Archive this article?')) return
    try {
      await api.delete(id, false)
      await onRefresh()
    } catch (error) {
      console.error(error)
      window.alert('Could not archive news article.')
    }
  }

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
          <ImageUploadDropzone
            label="Article image"
            valueUrl={form.image.trim() || null}
            onUrlChange={(url) => setForm((f) => ({ ...f, image: url ?? '' }))}
            disabled={saving}
          />
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
          <ImageUploadDropzone
            label="Article image"
            valueUrl={form.image.trim() || null}
            onUrlChange={(url) => setForm((f) => ({ ...f, image: url ?? '' }))}
            disabled={saving}
          />
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
          {viewTarget && (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
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
            </div>
          )}
        </div>
      </DashboardDialog>

      <div className="dashboard-table-shell">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedArticles.map((row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>{categoryNameById[row.category_id] || '—'}</td>
                <td>{statusLabel(row.status)}</td>
                <td>{new Date(row.datecreated).toLocaleString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ width: 30, height: 30, padding: 0 }}
                      title="View"
                      aria-label="View article"
                      onClick={() => setViewTarget(row)}
                    >
                      <i className="fa fa-eye" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ width: 30, height: 30, padding: 0 }}
                      title="Edit"
                      aria-label="Edit article"
                      onClick={() => openEdit(row)}
                    >
                      <i className="fa fa-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ width: 30, height: 30, padding: 0, color: '#ef4444' }}
                      title="Archive"
                      aria-label="Archive article"
                      onClick={() => handleArchive(row.id)}
                    >
                      <i className="fa fa-archive" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {articles.length === 0 && (
          <p style={{ padding: '1rem', color: 'var(--dashboard-muted, #64748b)' }}>
            No news articles yet.
          </p>
        )}
        <DataTablePagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={articles.length}
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
