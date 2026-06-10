import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { GridColDef } from '@mui/x-data-grid'
import { routeCharts } from '../../api/endpoints'
import type { RevenueSubcategoryRead, RouteChartCreate, RouteChartRead } from '../../api/types'
import { DashboardDataGrid } from '../../components/table/DashboardDataGrid'
import { DashboardDialog } from '../../components/DashboardDialog'
import { GOOGLE_MAPS_API_KEY } from '../../config/maps'
import {
  alertError,
  alertSuccess,
  closeAlert,
  confirmAction,
  showLoading,
} from '../../utils/alerts'

interface RoutesPageProps {
  routeChartsData: RouteChartRead[]
  routeChartsLoadError: string | null
  revenueSubcategoryData: RevenueSubcategoryRead[]
  onRefreshRouteCharts: () => void | Promise<void>
}

type RouteForm = {
  name: string
  start_address: string
  start_lat: string
  start_long: string
  end_address: string
  end_lat: string
  end_long: string
  length: string
  revenue_subcategory_id: string
}

const emptyForm = (): RouteForm => ({
  name: '',
  start_address: '',
  start_lat: '',
  start_long: '',
  end_address: '',
  end_lat: '',
  end_long: '',
  length: '',
  revenue_subcategory_id: '',
})

const toForm = (item: RouteChartRead): RouteForm => ({
  name: item.name,
  start_address: item.start_address,
  start_lat: String(item.start_lat),
  start_long: String(item.start_long),
  end_address: item.end_address,
  end_lat: String(item.end_lat),
  end_long: String(item.end_long),
  length: String(item.length),
  revenue_subcategory_id: item.revenue_subcategory_id,
})

export function RoutesPage({
  routeChartsData,
  routeChartsLoadError,
  revenueSubcategoryData,
  onRefreshRouteCharts,
}: RoutesPageProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RouteChartRead | null>(null)
  const [viewTarget, setViewTarget] = useState<RouteChartRead | null>(null)
  const [form, setForm] = useState<RouteForm>(emptyForm)
  const [placesReady, setPlacesReady] = useState(false)
  const [startSuggestions, setStartSuggestions] = useState<
    { placeId: string; description: string }[]
  >([])
  const [endSuggestions, setEndSuggestions] = useState<
    { placeId: string; description: string }[]
  >([])
  const autocompleteServiceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)
  const [saving, setSaving] = useState(false)
  const [filterText, setFilterText] = useState('')
  const subcategoryNameById = useMemo(
    () => Object.fromEntries(revenueSubcategoryData.map((s) => [s.id, s.name])),
    [revenueSubcategoryData],
  )
  const filteredRoutes = useMemo(() => {
    const q = filterText.trim().toLowerCase()
    if (!q) return routeChartsData
    return routeChartsData.filter((r) => {
      const blob = [
        r.name,
        r.start_address,
        r.end_address,
        subcategoryNameById[r.revenue_subcategory_id] ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [routeChartsData, filterText, subcategoryNameById])

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    if (!placesReady) return
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
  }, [placesReady])

  useEffect(() => {
    if (!placesReady) return
    const query = form.start_address.trim()
    if (query.length < 3) {
      setStartSuggestions([])
      return
    }
    const svc = autocompleteServiceRef.current
    if (!svc) return
    const t = window.setTimeout(() => {
      svc.getPlacePredictions(
        { input: query, componentRestrictions: { country: 'ug' } },
        (predictions: any[] | null) => {
          setStartSuggestions(
            (predictions ?? []).slice(0, 6).map((p: any) => ({
              placeId: p.place_id,
              description: p.description,
            })),
          )
        },
      )
    }, 220)
    return () => window.clearTimeout(t)
  }, [form.start_address, placesReady])

  useEffect(() => {
    if (!placesReady) return
    const query = form.end_address.trim()
    if (query.length < 3) {
      setEndSuggestions([])
      return
    }
    const svc = autocompleteServiceRef.current
    if (!svc) return
    const t = window.setTimeout(() => {
      svc.getPlacePredictions(
        { input: query, componentRestrictions: { country: 'ug' } },
        (predictions: any[] | null) => {
          setEndSuggestions(
            (predictions ?? []).slice(0, 6).map((p: any) => ({
              placeId: p.place_id,
              description: p.description,
            })),
          )
        },
      )
    }, 220)
    return () => window.clearTimeout(t)
  }, [form.end_address, placesReady])

  const closeDialogs = () => {
    setCreateOpen(false)
    setEditTarget(null)
    setViewTarget(null)
    setForm(emptyForm())
    setStartSuggestions([])
    setEndSuggestions([])
  }

  const openCreate = () => {
    setCreateOpen(true)
    setEditTarget(null)
    setViewTarget(null)
    setForm(emptyForm())
    setStartSuggestions([])
    setEndSuggestions([])
  }

  const openEdit = (item: RouteChartRead) => {
    setCreateOpen(false)
    setViewTarget(null)
    setEditTarget(item)
    setForm(toForm(item))
    setStartSuggestions([])
    setEndSuggestions([])
  }

  const applyStartSuggestion = (placeId: string, description: string) => {
    setForm((f) => ({ ...f, start_address: description }))
    setStartSuggestions([])
    const svc = placesServiceRef.current
    if (!svc) return
    svc.getDetails(
      { placeId, fields: ['geometry', 'formatted_address'] },
      (result: any, status: string) => {
        const w = window as any
        if (status !== w.google?.maps?.places?.PlacesServiceStatus?.OK || !result) return
        const loc = result.geometry?.location
        setForm((f) => ({
          ...f,
          // Do not overwrite if user already changed text after selection.
          start_address:
            f.start_address === description
              ? result.formatted_address || description
              : f.start_address,
          start_lat: loc && typeof loc.lat === 'function' ? String(loc.lat()) : '',
          start_long: loc && typeof loc.lng === 'function' ? String(loc.lng()) : '',
        }))
      },
    )
  }

  const applyEndSuggestion = (placeId: string, description: string) => {
    setForm((f) => ({ ...f, end_address: description }))
    setEndSuggestions([])
    const svc = placesServiceRef.current
    if (!svc) return
    svc.getDetails(
      { placeId, fields: ['geometry', 'formatted_address'] },
      (result: any, status: string) => {
        const w = window as any
        if (status !== w.google?.maps?.places?.PlacesServiceStatus?.OK || !result) return
        const loc = result.geometry?.location
        setForm((f) => ({
          ...f,
          // Do not overwrite if user already changed text after selection.
          end_address:
            f.end_address === description
              ? result.formatted_address || description
              : f.end_address,
          end_lat: loc && typeof loc.lat === 'function' ? String(loc.lat()) : '',
          end_long: loc && typeof loc.lng === 'function' ? String(loc.lng()) : '',
        }))
      },
    )
  }

  const toPayload = (): RouteChartCreate | null => {
    const startLat = Number(form.start_lat)
    const startLong = Number(form.start_long)
    const endLat = Number(form.end_lat)
    const endLong = Number(form.end_long)
    const length = Number(form.length)
    if (
      !form.name.trim() ||
      !form.start_address.trim() ||
      !form.end_address.trim() ||
      !form.revenue_subcategory_id ||
      Number.isNaN(startLat) ||
      Number.isNaN(startLong) ||
      Number.isNaN(endLat) ||
      Number.isNaN(endLong) ||
      Number.isNaN(length) ||
      length <= 0
    ) {
      return null
    }
    return {
      name: form.name.trim(),
      start_address: form.start_address.trim(),
      start_lat: startLat,
      start_long: startLong,
      end_address: form.end_address.trim(),
      end_lat: endLat,
      end_long: endLong,
      length,
      revenue_subcategory_id: form.revenue_subcategory_id,
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = toPayload()
    if (!payload) {
      void alertError(
        'Addresses',
        'Pick start and end addresses from suggestions so coordinates are captured.',
      )
      return
    }
    setSaving(true)
    try {
      showLoading('Saving route chart', 'Please wait…')
      await routeCharts.create(payload)
      closeDialogs()
      await onRefreshRouteCharts()
      closeAlert()
      await alertSuccess('Saved', 'Route chart created.')
    } catch (err) {
      console.error(err)
      closeAlert()
      await alertError('Failed', 'Could not create route chart.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    const payload = toPayload()
    if (!payload) {
      void alertError(
        'Addresses',
        'Pick start and end addresses from suggestions so coordinates are captured.',
      )
      return
    }
    setSaving(true)
    try {
      showLoading('Saving route chart', 'Please wait…')
      await routeCharts.update(editTarget.id, payload)
      closeDialogs()
      await onRefreshRouteCharts()
      closeAlert()
      await alertSuccess('Saved', 'Route chart updated.')
    } catch (err) {
      console.error(err)
      closeAlert()
      await alertError('Failed', 'Could not update route chart.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: 'Delete this route chart?',
      confirmButtonText: 'Delete',
    })
    if (!ok) return
    try {
      showLoading('Deleting route chart', 'Please wait…')
      await routeCharts.delete(id)
      await onRefreshRouteCharts()
      closeAlert()
      await alertSuccess('Deleted', 'The route chart was removed.')
    } catch (err) {
      console.error(err)
      closeAlert()
      await alertError('Failed', 'Could not delete route chart.')
    }
  }

  const iconBtnStyle: CSSProperties = { width: 30, height: 30, padding: 0 }

  const columns: GridColDef<RouteChartRead>[] = [
    { field: 'name', headerName: 'Route name', flex: 1, minWidth: 120 },
    { field: 'start_address', headerName: 'Start', flex: 1.2, minWidth: 140 },
    { field: 'end_address', headerName: 'End', flex: 1.2, minWidth: 140 },
    {
      field: 'length',
      headerName: 'Distance (km)',
      type: 'number',
      width: 130,
      valueFormatter: (value) => (value != null ? String(value) : ''),
    },
    {
      field: 'revenue_subcategory_id',
      headerName: 'Subcategory',
      flex: 0.9,
      minWidth: 120,
      valueGetter: (_v, row) =>
        subcategoryNameById[row.revenue_subcategory_id] ?? row.revenue_subcategory_id,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      width: 130,
      renderCell: ({ row }) => (
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <button
            type="button"
            className="secondary-button"
            style={iconBtnStyle}
            title="View"
            aria-label="View route chart"
            onClick={() => setViewTarget(row)}
          >
            <i className="fa fa-eye" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="secondary-button"
            style={iconBtnStyle}
            title="Edit"
            aria-label="Edit route chart"
            onClick={() => openEdit(row)}
          >
            <i className="fa fa-pencil" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ ...iconBtnStyle, color: '#ef4444' }}
            title="Delete"
            aria-label="Delete route chart"
            onClick={() => void handleDelete(row.id)}
          >
            <i className="fa fa-trash" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header-row">
        <h1 className="dashboard-page-title">Route charts</h1>
        <button type="button" className="primary-button" onClick={openCreate}>
          + New Route
        </button>
      </div>
      {routeChartsLoadError && (
        <p className="dashboard-page-lead" style={{ color: '#ef4444' }}>
          {routeChartsLoadError}
        </p>
      )}
      <div
        className="dashboard-page-header-row"
        style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}
      >
        <label className="dashboard-dialog-field" style={{ margin: 0, flex: '1 1 220px' }}>
          <span>Filter</span>
          <input
            type="search"
            placeholder="Route name, start, end, subcategory..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </label>
      </div>

      <DashboardDialog
        open={createOpen}
        onClose={closeDialogs}
        title="New route chart"
        titleId="route-chart-create-title"
        wide
      >
        <form className="dashboard-dialog-form" onSubmit={handleCreate}>
          <label className="dashboard-dialog-field">
            <span>Route name *</span>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </label>
          <label className="dashboard-dialog-field">
            <span>Revenue subcategory *</span>
            <select
              className="dashboard-dialog-select"
              value={form.revenue_subcategory_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, revenue_subcategory_id: e.target.value }))
              }
              required
            >
              <option value="">Select subcategory</option>
              {revenueSubcategoryData.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-dialog-field">
            <span>Start address *</span>
            <input
              value={form.start_address}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  start_address: e.target.value,
                  start_lat: '',
                  start_long: '',
                }))
              }
              required
              autoComplete="off"
            />
            {startSuggestions.length > 0 && (
              <div
                style={{
                  border: '1px solid #dbe4f0',
                  borderRadius: 8,
                  marginTop: 6,
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                {startSuggestions.map((s) => (
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
                    onClick={() => applyStartSuggestion(s.placeId, s.description)}
                  >
                    {s.description}
                  </button>
                ))}
              </div>
            )}
            {form.start_lat && form.start_long && (
              <small style={{ color: 'var(--dashboard-muted, #64748b)' }}>
                Coordinates: {Number(form.start_lat).toFixed(6)},{' '}
                {Number(form.start_long).toFixed(6)}
              </small>
            )}
          </label>
          <label className="dashboard-dialog-field">
            <span>End address *</span>
            <input
              value={form.end_address}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  end_address: e.target.value,
                  end_lat: '',
                  end_long: '',
                }))
              }
              required
              autoComplete="off"
            />
            {endSuggestions.length > 0 && (
              <div
                style={{
                  border: '1px solid #dbe4f0',
                  borderRadius: 8,
                  marginTop: 6,
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                {endSuggestions.map((s) => (
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
                    onClick={() => applyEndSuggestion(s.placeId, s.description)}
                  >
                    {s.description}
                  </button>
                ))}
              </div>
            )}
            {form.end_lat && form.end_long && (
              <small style={{ color: 'var(--dashboard-muted, #64748b)' }}>
                Coordinates: {Number(form.end_lat).toFixed(6)},{' '}
                {Number(form.end_long).toFixed(6)}
              </small>
            )}
          </label>
          <label className="dashboard-dialog-field">
            <span>Distance (km) *</span>
            <input type="number" min="0.01" step="0.01" value={form.length} onChange={(e) => setForm((f) => ({ ...f, length: e.target.value }))} required />
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
        title="Edit route chart"
        titleId="route-chart-edit-title"
        wide
      >
        {editTarget && (
          <form className="dashboard-dialog-form" onSubmit={handleUpdate}>
            <label className="dashboard-dialog-field">
              <span>Route name *</span>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </label>
            <label className="dashboard-dialog-field">
              <span>Revenue subcategory *</span>
              <select
                className="dashboard-dialog-select"
                value={form.revenue_subcategory_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, revenue_subcategory_id: e.target.value }))
                }
                required
              >
                <option value="">Select subcategory</option>
                {revenueSubcategoryData.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="dashboard-dialog-field">
              <span>Start address *</span>
              <input
                value={form.start_address}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    start_address: e.target.value,
                    start_lat: '',
                    start_long: '',
                  }))
                }
                required
                autoComplete="off"
              />
              {startSuggestions.length > 0 && (
                <div
                  style={{
                    border: '1px solid #dbe4f0',
                    borderRadius: 8,
                    marginTop: 6,
                    overflow: 'hidden',
                    background: '#fff',
                  }}
                >
                  {startSuggestions.map((s) => (
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
                      onClick={() => applyStartSuggestion(s.placeId, s.description)}
                    >
                      {s.description}
                    </button>
                  ))}
                </div>
              )}
              {form.start_lat && form.start_long && (
                <small style={{ color: 'var(--dashboard-muted, #64748b)' }}>
                  Coordinates: {Number(form.start_lat).toFixed(6)},{' '}
                  {Number(form.start_long).toFixed(6)}
                </small>
              )}
            </label>
            <label className="dashboard-dialog-field">
              <span>End address *</span>
              <input
                value={form.end_address}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    end_address: e.target.value,
                    end_lat: '',
                    end_long: '',
                  }))
                }
                required
                autoComplete="off"
              />
              {endSuggestions.length > 0 && (
                <div
                  style={{
                    border: '1px solid #dbe4f0',
                    borderRadius: 8,
                    marginTop: 6,
                    overflow: 'hidden',
                    background: '#fff',
                  }}
                >
                  {endSuggestions.map((s) => (
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
                      onClick={() => applyEndSuggestion(s.placeId, s.description)}
                    >
                      {s.description}
                    </button>
                  ))}
                </div>
              )}
              {form.end_lat && form.end_long && (
                <small style={{ color: 'var(--dashboard-muted, #64748b)' }}>
                  Coordinates: {Number(form.end_lat).toFixed(6)},{' '}
                  {Number(form.end_long).toFixed(6)}
                </small>
              )}
            </label>
            <label className="dashboard-dialog-field">
              <span>Distance (km) *</span>
              <input type="number" min="0.01" step="0.01" value={form.length} onChange={(e) => setForm((f) => ({ ...f, length: e.target.value }))} required />
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
        )}
      </DashboardDialog>

      <DashboardDialog
        open={viewTarget !== null}
        onClose={closeDialogs}
        title="Route chart details"
        titleId="route-chart-view-title"
        wide
      >
        {viewTarget && (
          <div className="dashboard-dialog-body" style={{ display: 'grid', gap: '0.5rem' }}>
            <p><strong>Name:</strong> {viewTarget.name}</p>
            <p><strong>Subcategory:</strong> {subcategoryNameById[viewTarget.revenue_subcategory_id] ?? viewTarget.revenue_subcategory_id}</p>
            <p><strong>Start:</strong> {viewTarget.start_address} ({viewTarget.start_lat}, {viewTarget.start_long})</p>
            <p><strong>End:</strong> {viewTarget.end_address} ({viewTarget.end_lat}, {viewTarget.end_long})</p>
            <p><strong>Distance:</strong> {viewTarget.length} km</p>
          </div>
        )}
      </DashboardDialog>

      <div className="dashboard-table-shell">
        <div className="dashboard-table-scroll">
          <DashboardDataGrid<RouteChartRead>
            rows={filteredRoutes}
            columns={columns}
            getRowId={(row) => row.id}
            localeText={{
              noRowsLabel:
                routeChartsData.length === 0
                  ? 'No route charts loaded.'
                  : 'No route charts match this filter.',
            }}
          />
        </div>
      </div>
    </div>
  )
}
