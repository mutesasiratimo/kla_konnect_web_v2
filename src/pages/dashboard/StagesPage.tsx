import { useMemo, useState } from 'react'
import { stages as stagesApi } from '../../api/endpoints'
import type { StageCreate, StageRead } from '../../api/types'
import { DashboardDialog } from '../../components/DashboardDialog'
import { DataTablePagination } from '../../components/table/DataTablePagination'

interface StagesPageProps {
  stageData: StageRead[]
  onRefreshStages: () => void | Promise<void>
}

type StageFormState = {
  display_name: string
  district: string
  county: string
  subcounty: string
  parish: string
  village: string
  address: string
}

const emptyStageForm = (): StageFormState => ({
  display_name: '',
  district: '',
  county: '',
  subcounty: '',
  parish: '',
  village: '',
  address: '',
})

export function StagesPage({ stageData, onRefreshStages }: StagesPageProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StageRead | null>(null)
  const [viewTarget, setViewTarget] = useState<StageRead | null>(null)
  const [form, setForm] = useState<StageFormState>(emptyStageForm())
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalPages = Math.max(1, Math.ceil(stageData.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedStages = useMemo(
    () =>
      stageData.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [stageData, currentPage, pageSize],
  )

  const closeDialogs = () => {
    setCreateOpen(false)
    setEditTarget(null)
    setViewTarget(null)
    setForm(emptyStageForm())
  }

  const openCreate = () => {
    setEditTarget(null)
    setViewTarget(null)
    setForm(emptyStageForm())
    setCreateOpen(true)
  }

  const openEdit = (stage: StageRead) => {
    setCreateOpen(false)
    setViewTarget(null)
    setEditTarget(stage)
    setForm({
      display_name: stage.display_name ?? '',
      district: stage.district ?? '',
      county: stage.county ?? '',
      subcounty: stage.subcounty ?? '',
      parish: stage.parish ?? '',
      village: stage.village ?? '',
      address: stage.address ?? '',
    })
  }

  const toPayload = (): StageCreate => ({
    display_name: form.display_name.trim(),
    district: form.district.trim() || null,
    county: form.county.trim() || null,
    subcounty: form.subcounty.trim() || null,
    parish: form.parish.trim() || null,
    village: form.village.trim() || null,
    address: form.address.trim() || null,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.display_name.trim()) return
    setSaving(true)
    try {
      await stagesApi.create(toPayload())
      closeDialogs()
      await onRefreshStages()
    } catch (error) {
      console.error(error)
      window.alert('Could not create stage.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget || !form.display_name.trim()) return
    setSaving(true)
    try {
      await stagesApi.update(editTarget.id, toPayload())
      closeDialogs()
      await onRefreshStages()
    } catch (error) {
      console.error(error)
      window.alert('Could not update stage.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this stage?')) return
    try {
      await stagesApi.delete(id)
      await onRefreshStages()
    } catch (error) {
      console.error(error)
      window.alert('Could not delete stage.')
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header-row">
        <div>
          <h1 className="dashboard-page-title">Stages</h1>
          <p className="dashboard-page-lead">
            View and manage taxi stages and parks.
          </p>
        </div>
        <button type="button" className="primary-button" onClick={openCreate}>
          + New Stage
        </button>
      </div>

      <DashboardDialog
        open={createOpen}
        onClose={closeDialogs}
        title="New stage"
        titleId="stage-create-title"
      >
        <form className="dashboard-dialog-form" onSubmit={handleCreate}>
          <label className="dashboard-dialog-field">
            <span>Display name *</span>
            <input
              value={form.display_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, display_name: e.target.value }))
              }
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>District</span>
            <input
              value={form.district}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, district: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>County</span>
            <input
              value={form.county}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, county: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Subcounty</span>
            <input
              value={form.subcounty}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, subcounty: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Parish</span>
            <input
              value={form.parish}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, parish: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Village</span>
            <input
              value={form.village}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, village: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Address</span>
            <input
              value={form.address}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, address: e.target.value }))
              }
            />
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
        open={editTarget !== null}
        onClose={closeDialogs}
        title="Edit stage"
        titleId="stage-edit-title"
      >
        <form className="dashboard-dialog-form" onSubmit={handleUpdate}>
          <label className="dashboard-dialog-field">
            <span>Display name *</span>
            <input
              value={form.display_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, display_name: e.target.value }))
              }
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>District</span>
            <input
              value={form.district}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, district: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>County</span>
            <input
              value={form.county}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, county: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Subcounty</span>
            <input
              value={form.subcounty}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, subcounty: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Parish</span>
            <input
              value={form.parish}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, parish: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Village</span>
            <input
              value={form.village}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, village: e.target.value }))
              }
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Address</span>
            <input
              value={form.address}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, address: e.target.value }))
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
        open={viewTarget !== null}
        onClose={closeDialogs}
        title="Stage details"
        titleId="stage-view-title"
      >
        <div className="dashboard-dialog-body">
          {viewTarget && (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <p>
                <strong>Display name:</strong> {viewTarget.display_name}
              </p>
              <p>
                <strong>District:</strong> {viewTarget.district || '—'}
              </p>
              <p>
                <strong>County:</strong> {viewTarget.county || '—'}
              </p>
              <p>
                <strong>Subcounty:</strong> {viewTarget.subcounty || '—'}
              </p>
              <p>
                <strong>Parish:</strong> {viewTarget.parish || '—'}
              </p>
              <p>
                <strong>Village:</strong> {viewTarget.village || '—'}
              </p>
              <p>
                <strong>Address:</strong> {viewTarget.address || '—'}
              </p>
            </div>
          )}
        </div>
      </DashboardDialog>

      <div className="dashboard-table-shell">
        <div className="dashboard-table-meta">
          <span>
            Showing <strong>{stageData.length}</strong> stage records.
          </span>
        </div>
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th scope="col">Stage / park</th>
                <th scope="col">District</th>
                <th scope="col">County</th>
                <th scope="col">Subcounty</th>
                <th scope="col">Parish</th>
                <th scope="col">Village</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedStages.map((stage) => (
                <tr key={stage.id}>
                  <td>{stage.display_name}</td>
                  <td>{stage.district}</td>
                  <td>{stage.county}</td>
                  <td>{stage.subcounty}</td>
                  <td>{stage.parish}</td>
                  <td>{stage.village}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ width: 30, height: 30, padding: 0 }}
                        title="View"
                        aria-label="View stage"
                        onClick={() => setViewTarget(stage)}
                      >
                        <i className="fa fa-eye" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ width: 30, height: 30, padding: 0 }}
                        title="Edit"
                        aria-label="Edit stage"
                        onClick={() => openEdit(stage)}
                      >
                        <i className="fa fa-pencil" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ width: 30, height: 30, padding: 0, color: '#ef4444' }}
                        title="Delete"
                        aria-label="Delete stage"
                        onClick={() => handleDelete(stage.id)}
                      >
                        <i className="fa fa-trash" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedStages.length === 0 && (
                <tr>
                  <td colSpan={7} className="dashboard-table-empty">
                    No stage records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={stageData.length}
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
