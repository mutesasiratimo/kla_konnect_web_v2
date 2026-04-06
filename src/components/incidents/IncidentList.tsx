import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { GridColDef } from '@mui/x-data-grid'
import type {
  IncidentDetailRead,
  IncidentRead,
  IncidentWorkflowStatus,
} from '../../api/types'
import { incidents as incidentsApi, roles as rolesApi, uploads } from '../../api/endpoints'
import { resolveApiMediaUrl } from '../../api/client'
import { GOOGLE_MAPS_API_KEY } from '../../config/maps'
import { DashboardDialog } from '../DashboardDialog'
import { PendingMediaDropzone, uploadKindForFile } from '../FileUploadDropzone'
import { DashboardDataGrid } from '../table/DashboardDataGrid'
import { alertError, alertSuccess, confirmAction, closeAlert, showLoading } from '../../utils/alerts'

interface ListProps {
  data: IncidentRead[]
  categoryOptions: { id: string; name: string }[]
  onRefresh: () => void
  showCreateButton?: boolean
  createAsCityAlert?: boolean
}

function statusLabel(status: IncidentWorkflowStatus): string {
  switch (status) {
    case '0':
      return 'Pending'
    case '1':
      return 'Live'
    case '2':
      return 'Resolved'
    case '3':
      return 'Archived'
    default:
      return status
  }
}

function statusBadgeClass(status: IncidentWorkflowStatus): string {
  if (status === '2') return 'status-badge--success'
  if (status === '3') return ''
  if (status === '0') return 'status-badge--warning'
  if (status === '1') return 'status-badge--danger'
  return 'status-badge--warning'
}

export const IncidentList: React.FC<ListProps> = ({
  data,
  categoryOptions,
  onRefresh,
  showCreateButton = true,
  createAsCityAlert = false,
}) => {
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newEmergency, setNewEmergency] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [newAddressLat, setNewAddressLat] = useState<number | null>(null)
  const [newAddressLong, setNewAddressLong] = useState<number | null>(null)
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newFullClosure, setNewFullClosure] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<
    { placeId: string; description: string }[]
  >([])
  const [placesReady, setPlacesReady] = useState(false)
  const autocompleteServiceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)
  const [editTarget, setEditTarget] = useState<IncidentRead | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([])
  const [viewOpen, setViewOpen] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewData, setViewData] = useState<IncidentDetailRead | null>(null)
  const [removingImage, setRemovingImage] = useState(false)
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])
  const [viewStatus, setViewStatus] = useState<IncidentWorkflowStatus>('1')
  const [viewAssigneeRoleId, setViewAssigneeRoleId] = useState<string>('')
  const [viewDraftStatus, setViewDraftStatus] = useState<IncidentWorkflowStatus>('1')
  const [viewDraftAssigneeRoleId, setViewDraftAssigneeRoleId] = useState<string>('')
  const [updatingViewMeta, setUpdatingViewMeta] = useState(false)
  const [saving, setSaving] = useState(false)

  const closeCreate = () => {
    setCreateOpen(false)
    setNewName('')
    setNewDescription('')
    setNewEmergency(false)
    setNewAddress('')
    setNewAddressLat(null)
    setNewAddressLong(null)
    setNewStartDate('')
    setNewEndDate('')
    setNewFullClosure(false)
    setAddressSuggestions([])
    setNewCategoryId(categoryOptions[0]?.id ?? '')
    setPendingAttachments([])
  }

  const selectedCategoryName = useMemo(
    () =>
      categoryOptions.find((c) => c.id === newCategoryId)?.name?.toLowerCase() ?? '',
    [categoryOptions, newCategoryId],
  )
  const isRoadCategory = createAsCityAlert && selectedCategoryName.includes('road')

  useEffect(() => {
    if (!isRoadCategory) setNewFullClosure(false)
  }, [isRoadCategory])

  useEffect(() => {
    let cancelled = false
    rolesApi
      .list()
      .then((items) => {
        if (cancelled) return
        setRoles(items.map((r) => ({ id: r.id, name: r.name })))
      })
      .catch((err) => console.error(err))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!createAsCityAlert) return
    const key = GOOGLE_MAPS_API_KEY.trim()
    if (!key) return

    const w = window as any
    if (w.google?.maps?.places) {
      setPlacesReady(true)
      return
    }

    const existing = document.querySelector(
      'script[data-google-places-loader="true"]',
    ) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => setPlacesReady(true), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key,
    )}&libraries=places`
    script.async = true
    script.defer = true
    script.setAttribute('data-google-places-loader', 'true')
    script.addEventListener('load', () => setPlacesReady(true), { once: true })
    script.addEventListener(
      'error',
      () => console.error('Google Places script failed to load'),
      { once: true },
    )
    document.head.appendChild(script)
  }, [createAsCityAlert])

  useEffect(() => {
    if (!createAsCityAlert || !placesReady) return
    const w = window as any
    if (!w.google?.maps?.places) return
    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new w.google.maps.places.AutocompleteService()
    }
    if (!placesServiceRef.current) {
      placesServiceRef.current = new w.google.maps.places.PlacesService(
        document.createElement('div'),
      )
    }
  }, [createAsCityAlert, placesReady])

  useEffect(() => {
    if (!createAsCityAlert || !placesReady) return
    const query = newAddress.trim()
    if (query.length < 3) {
      setAddressSuggestions([])
      return
    }
    const svc = autocompleteServiceRef.current
    if (!svc) return
    const t = window.setTimeout(() => {
      svc.getPlacePredictions(
        { input: query, componentRestrictions: { country: 'ug' } },
        (predictions: any[] | null) => {
          setAddressSuggestions(
            (predictions ?? []).slice(0, 6).map((p: any) => ({
              placeId: p.place_id,
              description: p.description,
            })),
          )
        },
      )
    }, 220)
    return () => window.clearTimeout(t)
  }, [newAddress, createAsCityAlert, placesReady])

  const applySuggestion = (placeId: string, description: string) => {
    setNewAddress(description)
    setAddressSuggestions([])
    const svc = placesServiceRef.current
    if (!svc) return
    svc.getDetails(
      { placeId, fields: ['geometry', 'formatted_address'] },
      (result: any, status: string) => {
        const w = window as any
        if (status !== w.google?.maps?.places?.PlacesServiceStatus?.OK || !result) return
        const loc = result.geometry?.location
        if (loc) {
          setNewAddressLat(typeof loc.lat === 'function' ? loc.lat() : null)
          setNewAddressLong(typeof loc.lng === 'function' ? loc.lng() : null)
        }
        if (result.formatted_address) setNewAddress(result.formatted_address)
      },
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newCategoryId) return
    setSaving(true)
    try {
      const created = await incidentsApi.register({
        name: newName.trim(),
        incident_category_id: newCategoryId,
        description: newDescription.trim() || null,
        isemergency: newEmergency,
        iscityreport: createAsCityAlert,
        status: createAsCityAlert ? '1' : '0',
        address: newAddress.trim() || null,
        addresslat: newAddressLat,
        addresslong: newAddressLong,
        startdate: createAsCityAlert && newStartDate ? newStartDate : null,
        enddate: createAsCityAlert && newEndDate ? newEndDate : null,
        fulldisruption: isRoadCategory ? newFullClosure : false,
      })
      for (let i = 0; i < pendingAttachments.length; i++) {
        const file = pendingAttachments[i]
        const up = await uploads.file(file, uploadKindForFile(file))
        await incidentsApi.addAttachment(created.id, {
          url: up.url,
          attachment_type: up.file_type,
          mime_type: up.mime_type ?? null,
          sort_order: i,
        })
      }
      closeCreate()
      await onRefresh()
    } catch (err) {
      console.error(err)
      await alertError('Failed', 'Could not register incident or upload attachments.')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (row: IncidentRead) => {
    setEditTarget(row)
    setEditName(row.name)
    setEditDescription(row.description ?? '')
    setEditCategoryId(row.incident_category_id)
  }

  const closeEdit = () => {
    setEditTarget(null)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget || !editName.trim() || !editCategoryId) return
    setSaving(true)
    try {
      await incidentsApi.update(editTarget.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        incident_category_id: editCategoryId,
      })
      closeEdit()
      await onRefresh()
    } catch (err) {
      console.error(err)
      await alertError('Failed', 'Could not update incident.')
    } finally {
      setSaving(false)
    }
  }

  const handleView = async (row: IncidentRead) => {
    setViewOpen(true)
    setViewLoading(true)
    try {
      // Avoid GET /incidents/{id} (backend may increment views on read).
      // Render from the list row + fetch attachments separately.
      setViewData({ ...(row as any), attachments: [] })
      setViewStatus(row.status)
      setViewAssigneeRoleId(row.assigned_role_id ?? '')
      setViewDraftStatus(row.status)
      setViewDraftAssigneeRoleId(row.assigned_role_id ?? '')

      const attachments = await incidentsApi.listAttachments(row.id)
      setViewData((prev) => (prev ? { ...prev, attachments } : prev))
    } catch (error) {
      console.error(error)
      await alertError('Failed', 'Could not load incident details.')
      setViewOpen(false)
    } finally {
      setViewLoading(false)
    }
  }

  const saveViewMeta = async () => {
    if (!viewData) return
    setUpdatingViewMeta(true)
    try {
      showLoading('Saving...', 'Please wait')
      let updatedRow: IncidentRead | null = null
      if (viewDraftStatus !== viewStatus) {
        updatedRow = await incidentsApi.setState(viewData.id, viewDraftStatus)
      }
      if (
        viewDraftAssigneeRoleId &&
        viewDraftAssigneeRoleId !== viewAssigneeRoleId
      ) {
        await incidentsApi.assignToRole(viewData.id, viewDraftAssigneeRoleId)
      }

      const attachments = await incidentsApi.listAttachments(viewData.id)
      setViewData((prev) => {
        if (!prev) return prev
        return {
          ...(updatedRow ? { ...prev, ...updatedRow } : prev),
          attachments,
        }
      })

      const nextStatus = updatedRow?.status ?? viewDraftStatus
      setViewStatus(nextStatus)
      setViewAssigneeRoleId(viewDraftAssigneeRoleId)
      await onRefresh()
      closeAlert()
      await alertSuccess('Saved', 'Incident updated successfully.')
      setViewOpen(false)
    } catch (error) {
      console.error(error)
      closeAlert()
      await alertError('Failed', 'Could not save changes.')
    } finally {
      setUpdatingViewMeta(false)
    }
  }

  const handleArchive = async (id: string) => {
    const ok = await confirmAction({
      title: 'Archive this incident?',
      confirmButtonText: 'Archive',
    })
    if (!ok) return
    try {
      // Soft delete = archive in this workflow.
      await incidentsApi.delete(id, false)
      await onRefresh()
    } catch (error) {
      console.error(error)
      await alertError('Failed', 'Could not archive incident.')
    }
  }

  const handleRemoveImageAttachment = async (attachmentId: string) => {
    if (!viewData) return
    const ok = await confirmAction({
      title: 'Remove this incident media?',
      confirmButtonText: 'Remove',
    })
    if (!ok) return
    setRemovingImage(true)
    try {
      await incidentsApi.deleteAttachment(viewData.id, attachmentId)
      const attachments = await incidentsApi.listAttachments(viewData.id)
      setViewData((prev) => (prev ? { ...prev, attachments } : prev))
      await onRefresh()
    } catch (error) {
      console.error(error)
      await alertError('Failed', 'Could not remove incident media.')
    } finally {
      setRemovingImage(false)
    }
  }

  const columns: GridColDef<IncidentRead>[] = [
      {
        field: 'name',
        headerName: 'Incident',
        flex: 1,
        minWidth: 180,
        sortable: false,
        renderCell: (params) => (
          <div>
            <div style={{ fontWeight: 600 }}>{params.row.name}</div>
            {params.row.isemergency && (
              <span className="status-badge status-badge--danger">Emergency</span>
            )}
          </div>
        ),
      },
      {
        field: 'address',
        headerName: 'Location',
        flex: 1,
        minWidth: 140,
        valueGetter: (_v, row) => row.address || 'Not specified',
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        sortable: false,
        renderCell: (params) => (
          <span className={`status-badge ${statusBadgeClass(params.row.status)}`}>
            {statusLabel(params.row.status)}
          </span>
        ),
      },
      {
        field: 'datecreated',
        headerName: 'Reported',
        flex: 1,
        minWidth: 168,
        valueGetter: (_v, row) => new Date(row.datecreated).toLocaleString(),
      },
      {
        field: 'views_count',
        headerName: 'Views',
        width: 88,
        type: 'number',
        valueGetter: (_v, row) => row.views_count ?? 0,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 124,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <div
            style={{
              display: 'flex',
              gap: '0.35rem',
              flexWrap: 'nowrap',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              className="secondary-button"
              style={{ width: 30, height: 30, padding: 0 }}
              title="View"
              aria-label="View incident"
              onClick={() => void handleView(params.row)}
            >
              <i className="fa fa-eye" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ width: 30, height: 30, padding: 0 }}
              title="Edit"
              aria-label="Edit incident"
              onClick={() => openEdit(params.row)}
            >
              <i className="fa fa-pencil" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{
                width: 30,
                height: 30,
                padding: 0,
                color: '#ef4444',
              }}
              title="Archive"
              aria-label="Archive incident"
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
      {showCreateButton && (
        <div className="dashboard-page-header-row" style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setNewCategoryId(categoryOptions[0]?.id ?? '')
              setCreateOpen(true)
            }}
          >
            {createAsCityAlert ? '+ Create city alert' : '+ New incident'}
          </button>
        </div>
      )}

      <DashboardDialog
        open={createOpen}
        onClose={closeCreate}
        title={createAsCityAlert ? 'Create city alert' : 'Register incident'}
        titleId="incident-create-title"
        wide
      >
        <form className="dashboard-dialog-form" onSubmit={handleCreate}>
          <label className="dashboard-dialog-field">
            <span>Title *</span>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              autoComplete="off"
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Category *</span>
            <select
              className="dashboard-dialog-select"
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              required
            >
              <option value="">Select category</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-dialog-field">
            <span>Description</span>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Address</span>
            <input
              value={newAddress}
              onChange={(e) => {
                setNewAddress(e.target.value)
                setNewAddressLat(null)
                setNewAddressLong(null)
              }}
              autoComplete="off"
            />
            {createAsCityAlert && addressSuggestions.length > 0 && (
              <div
                style={{
                  border: '1px solid #dbe4f0',
                  borderRadius: 8,
                  marginTop: 6,
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                {addressSuggestions.map((s) => (
                  <button
                    key={s.placeId}
                    type="button"
                    className="secondary-button"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: 0,
                      borderRadius: 0,
                      background: 'transparent',
                      padding: '8px 10px',
                    }}
                    onClick={() => applySuggestion(s.placeId, s.description)}
                  >
                    {s.description}
                  </button>
                ))}
              </div>
            )}
            {createAsCityAlert && newAddressLat != null && newAddressLong != null && (
              <small style={{ color: 'var(--dashboard-muted, #64748b)' }}>
                Coordinates: {newAddressLat.toFixed(6)}, {newAddressLong.toFixed(6)}
              </small>
            )}
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: createAsCityAlert ? '1fr 1fr auto auto' : 'auto',
              gap: '12px',
              alignItems: 'end',
            }}
          >
            {createAsCityAlert && (
              <label className="dashboard-dialog-field" style={{ margin: 0 }}>
                <span>Start date</span>
                <input
                  type="datetime-local"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                />
              </label>
            )}
            {createAsCityAlert && (
              <label className="dashboard-dialog-field" style={{ margin: 0 }}>
                <span>End date</span>
                <input
                  type="datetime-local"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                />
              </label>
            )}
            <label
              className="dashboard-dialog-field"
              style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', margin: 0 }}
            >
              <input
                type="checkbox"
                checked={newEmergency}
                onChange={(e) => setNewEmergency(e.target.checked)}
              />
              <span style={{ margin: 0 }}>Emergency</span>
            </label>
            {isRoadCategory && (
              <label
                className="dashboard-dialog-field"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '10px',
                  margin: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={newFullClosure}
                  onChange={(e) => setNewFullClosure(e.target.checked)}
                />
                <span style={{ margin: 0 }}>Full closure</span>
              </label>
            )}
          </div>
          <PendingMediaDropzone
            label="Attachments (optional)"
            files={pendingAttachments}
            onFilesChange={setPendingAttachments}
            disabled={saving}
          />
          <div className="dashboard-dialog-actions">
            <button type="button" className="secondary-button" onClick={closeCreate}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              Submit
            </button>
          </div>
        </form>
      </DashboardDialog>

      <DashboardDialog
        open={editTarget !== null}
        onClose={closeEdit}
        title="Edit incident"
        titleId="incident-edit-title"
        wide
      >
        <form className="dashboard-dialog-form" onSubmit={handleUpdate}>
          <label className="dashboard-dialog-field">
            <span>Title *</span>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              autoComplete="off"
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Category *</span>
            <select
              className="dashboard-dialog-select"
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
              required
            >
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-dialog-field">
            <span>Description</span>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </label>
          <div className="dashboard-dialog-actions">
            <button type="button" className="secondary-button" onClick={closeEdit}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              Save
            </button>
          </div>
        </form>
      </DashboardDialog>

      <DashboardDialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={createAsCityAlert ? 'Alert Details' : 'Incident Details'}
        titleId={createAsCityAlert ? 'incident-alert-view-title' : 'incident-view-title'}
        wide
      >
        <div className="dashboard-dialog-body" style={{ whiteSpace: 'pre-wrap' }}>
          {viewLoading && <p>Loading details...</p>}
          {!viewLoading && viewData && (() => {
            const mediaAttachment = viewData.attachments.find((attachment) => {
              const kind = attachment.attachment_type?.toLowerCase()
              const mime = attachment.mime_type?.toLowerCase()
              if (kind === 'image' || kind === 'video' || kind === 'audio') return true
              if (!mime) return false
              return (
                mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/')
              )
            })

            const reporterName =
              viewData.reported_by?.full_name?.trim() ||
              viewData.reported_by?.email?.trim() ||
              'John Doe'
            const reporterPhone = viewData.reported_by?.phone?.trim() || '+256 700 000 000'
            const reporterEmail = viewData.reported_by?.email?.trim() || 'john.doe@example.com'

            return (
              <div className="incident-details-layout">
              <div className="incident-details-media">
                <div className="incident-details-image-pane incident-details-image-pane--square">
                  {mediaAttachment?.url ? (
                    <>
                      <button
                        type="button"
                        className="incident-details-image-close"
                        onClick={() => handleRemoveImageAttachment(mediaAttachment.id)}
                        disabled={removingImage}
                        aria-label="Remove incident media"
                        title="Remove media"
                      >
                        ×
                      </button>
                      {(() => {
                        const kind = mediaAttachment.attachment_type?.toLowerCase()
                        const mime = mediaAttachment.mime_type?.toLowerCase()
                        const isVideo = kind === 'video' || (mime ? mime.startsWith('video/') : false)
                        const isAudio = kind === 'audio' || (mime ? mime.startsWith('audio/') : false)
                        if (isVideo) {
                          return (
                            <video className="incident-details-video" controls preload="metadata">
                              <source src={resolveApiMediaUrl(mediaAttachment.url) ?? ''} />
                              Your browser does not support video playback.
                            </video>
                          )
                        }
                        if (isAudio) {
                          return (
                            <audio className="incident-details-audio" controls preload="metadata">
                              <source src={resolveApiMediaUrl(mediaAttachment.url) ?? ''} />
                              Your browser does not support audio playback.
                            </audio>
                          )
                        }
                        return (
                          <img
                            src={resolveApiMediaUrl(mediaAttachment.url) ?? ''}
                            alt="Incident attachment"
                            className="incident-details-image"
                            loading="lazy"
                          />
                        )
                      })()}
                    </>
                  ) : (
                    <p className="incident-details-image-empty">No media attachment</p>
                  )}
                </div>
                <div className="incident-details-meta">
                  <div className="incident-details-reporter-name" title="Reporter">
                    <span className="incident-details-reporter-badge" aria-hidden="true">
                      <i className="fa fa-user" aria-hidden="true" />
                    </span>
                    <span>{reporterName}</span>
                  </div>
                  <div className="incident-details-reporter-contact">
                    <i className="fa fa-phone" aria-hidden="true" />
                    <span>{reporterPhone}</span>
                  </div>
                  <div className="incident-details-reporter-contact">
                    <i className="fa fa-envelope" aria-hidden="true" />
                    <span>{reporterEmail}</span>
                  </div>
                  <div className="incident-details-stats" aria-label="Engagement stats">
                    <span className="incident-details-stat" title="Likes">
                      <i className="fa fa-thumbs-up" aria-hidden="true" />
                      <span className="incident-details-stat-count">
                        {viewData.likes_count ?? 0}
                      </span>
                    </span>
                    <span className="incident-details-stat" title="Dislikes">
                      <i className="fa fa-thumbs-down" aria-hidden="true" />
                      <span className="incident-details-stat-count">
                        {viewData.dislikes_count ?? 0}
                      </span>
                    </span>
                    <span className="incident-details-stat" title="Views">
                      <i className="fa fa-eye" aria-hidden="true" />
                      <span className="incident-details-stat-count">
                        {viewData.views_count ?? 0}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="incident-details-content">
                <p>
                  <strong>Title:</strong> {viewData.name}
                </p>
                <p>
                  <strong>Source:</strong> {viewData.iscityreport ? 'KCCA' : 'Public'}
                </p>
                <p>
                  <strong>Address:</strong> {viewData.address || 'Not specified'}
                </p>
                <p>
                  <strong>Description:</strong> {viewData.description || '—'}
                </p>
                <p>
                  <strong>Created:</strong>{' '}
                  {new Date(viewData.datecreated).toLocaleString()}
                </p>
                <div className="incident-details-controls incident-details-controls--footer">
                  <label className="incident-details-control">
                    <span>Status</span>
                    <select
                      value={viewDraftStatus}
                      disabled={updatingViewMeta}
                      onChange={(e) =>
                        setViewDraftStatus(e.target.value as IncidentWorkflowStatus)
                      }
                    >
                      <option value="0">Pending</option>
                      <option value="1">Live</option>
                      <option value="2">Resolved</option>
                      <option value="3">Archived</option>
                    </select>
                  </label>
                  <label className="incident-details-control">
                    <span>Assignee</span>
                    <select
                      value={viewDraftAssigneeRoleId}
                      disabled={updatingViewMeta}
                      onChange={(e) => setViewDraftAssigneeRoleId(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="incident-details-controls-actions">
                    <button
                      type="button"
                      className="primary-button"
                      disabled={updatingViewMeta}
                      onClick={() => void saveViewMeta()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )
          })()}
        </div>
      </DashboardDialog>

      <div className="dashboard-table-shell">
        <DashboardDataGrid<IncidentRead>
          rows={data}
          columns={columns}
          getRowId={(row) => row.id}
          localeText={{
            noRowsLabel: showCreateButton
              ? 'No records yet. Create one to get started.'
              : 'No incidents found for the selected filters.',
          }}
        />
      </div>
    </div>
  )
}
