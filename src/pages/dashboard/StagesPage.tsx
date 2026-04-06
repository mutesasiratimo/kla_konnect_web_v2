import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { GridColDef } from '@mui/x-data-grid'
import { locations as locationsApi, stages as stagesApi } from '../../api/endpoints'
import type { LocationRead, StageCreate, StageRead } from '../../api/types'
import { GOOGLE_MAPS_API_KEY } from '../../config/maps'
import { DashboardDialog } from '../../components/DashboardDialog'
import { DashboardDataGrid } from '../../components/table/DashboardDataGrid'
import { alertError, confirmAction } from '../../utils/alerts'

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
  addressLat: number | null
  addressLng: number | null
}

const emptyStageForm = (): StageFormState => ({
  display_name: '',
  district: '',
  county: '',
  subcounty: '',
  parish: '',
  village: '',
  address: '',
  addressLat: null,
  addressLng: null,
})

function uniqueSorted(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )
}

type StageFormFieldsProps = {
  form: StageFormState
  setForm: Dispatch<SetStateAction<StageFormState>>
  districts: string[]
  counties: string[]
  subcounties: string[]
  parishes: string[]
  villages: string[]
  addressSuggestions: { placeId: string; description: string }[]
  applyAddressSuggestion: (placeId: string, description: string) => void
  placesReady: boolean
}

function StageFormFields({
  form,
  setForm,
  districts,
  counties,
  subcounties,
  parishes,
  villages,
  addressSuggestions,
  applyAddressSuggestion,
  placesReady,
}: StageFormFieldsProps) {
  return (
    <>
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
        <span>District / City</span>
        <select
          className="dashboard-dialog-select"
          value={form.district}
          onChange={(e) => {
            const v = e.target.value
            setForm((prev) => ({
              ...prev,
              district: v,
              county: '',
              subcounty: '',
              parish: '',
              village: '',
            }))
          }}
        >
          <option value="">Select district / city</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <label className="dashboard-dialog-field">
        <span>County / Municipality</span>
        <select
          className="dashboard-dialog-select"
          value={form.county}
          disabled={!form.district.trim()}
          onChange={(e) => {
            const v = e.target.value
            setForm((prev) => ({
              ...prev,
              county: v,
              subcounty: '',
              parish: '',
              village: '',
            }))
          }}
        >
          <option value="">Select county / municipality</option>
          {counties.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="dashboard-dialog-field">
        <span>Subcounty / Town Council</span>
        <select
          className="dashboard-dialog-select"
          value={form.subcounty}
          disabled={!form.county.trim()}
          onChange={(e) => {
            const v = e.target.value
            setForm((prev) => ({
              ...prev,
              subcounty: v,
              parish: '',
              village: '',
            }))
          }}
        >
          <option value="">Select subcounty / town council</option>
          {subcounties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="dashboard-dialog-field">
        <span>Parish / Ward</span>
        <select
          className="dashboard-dialog-select"
          value={form.parish}
          disabled={!form.subcounty.trim()}
          onChange={(e) => {
            const v = e.target.value
            setForm((prev) => ({ ...prev, parish: v, village: '' }))
          }}
        >
          <option value="">Select parish / ward</option>
          {parishes.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <label className="dashboard-dialog-field">
        <span>Village</span>
        <select
          className="dashboard-dialog-select"
          value={form.village}
          disabled={!form.parish.trim()}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, village: e.target.value }))
          }
        >
          <option value="">Select village</option>
          {villages.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>

      <label className="dashboard-dialog-field">
        <span>Address</span>
        <input
          value={form.address}
          onChange={(e) => {
            setForm((prev) => ({
              ...prev,
              address: e.target.value,
              addressLat: null,
              addressLng: null,
            }))
          }}
          placeholder={
            placesReady
              ? 'Start typing for place suggestions (Uganda)'
              : 'Loading maps…'
          }
          autoComplete="off"
        />
        {placesReady && addressSuggestions.length > 0 && (
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
                onClick={() => applyAddressSuggestion(s.placeId, s.description)}
              >
                {s.description}
              </button>
            ))}
          </div>
        )}
        {form.addressLat != null && form.addressLng != null && (
          <small style={{ color: 'var(--dashboard-muted, #64748b)' }}>
            Coordinates: {form.addressLat.toFixed(6)}, {form.addressLng.toFixed(6)}
          </small>
        )}
      </label>
    </>
  )
}

export function StagesPage({ stageData, onRefreshStages }: StagesPageProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StageRead | null>(null)
  const [viewTarget, setViewTarget] = useState<StageRead | null>(null)
  const [form, setForm] = useState<StageFormState>(emptyStageForm())
  const [saving, setSaving] = useState(false)
  const [districts, setDistricts] = useState<string[]>([])
  const [counties, setCounties] = useState<string[]>([])
  const [subcounties, setSubcounties] = useState<string[]>([])
  const [parishes, setParishes] = useState<string[]>([])
  const [villages, setVillages] = useState<string[]>([])
  const [locationRows, setLocationRows] = useState<LocationRead[]>([])

  const [placesReady, setPlacesReady] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<
    { placeId: string; description: string }[]
  >([])
  const autocompleteServiceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)

  useEffect(() => {
    locationsApi
      .districts()
      .then(async (d) => {
        const sorted = uniqueSorted(d)
        if (sorted.length > 0) {
          setDistricts(sorted)
          return
        }
        const rows = await locationsApi.all()
        setLocationRows(rows)
        setDistricts(uniqueSorted(rows.map((r) => r.district)))
      })
      .catch(async () => {
        try {
          const rows = await locationsApi.all()
          setLocationRows(rows)
          setDistricts(uniqueSorted(rows.map((r) => r.district)))
        } catch {
          setDistricts([])
        }
      })
  }, [])

  useEffect(() => {
    if (!form.district?.trim()) {
      setCounties([])
      return
    }
    const d = form.district.trim()
    locationsApi
      .counties(d)
      .then((c) => {
        const sorted = uniqueSorted(c)
        if (sorted.length > 0) {
          setCounties(sorted)
          return
        }
        setCounties(
          uniqueSorted(
            locationRows.filter((r) => r.district === d).map((r) => r.county),
          ),
        )
      })
      .catch(() =>
        setCounties(
          uniqueSorted(
            locationRows.filter((r) => r.district === d).map((r) => r.county),
          ),
        ),
      )
  }, [form.district, locationRows])

  useEffect(() => {
    if (!form.county?.trim()) {
      setSubcounties([])
      return
    }
    const c = form.county.trim()
    locationsApi
      .subcounties(c)
      .then((s) => {
        const sorted = uniqueSorted(s)
        if (sorted.length > 0) {
          setSubcounties(sorted)
          return
        }
        setSubcounties(
          uniqueSorted(
            locationRows.filter((r) => r.county === c).map((r) => r.subcounty),
          ),
        )
      })
      .catch(() =>
        setSubcounties(
          uniqueSorted(
            locationRows.filter((r) => r.county === c).map((r) => r.subcounty),
          ),
        ),
      )
  }, [form.county, locationRows])

  useEffect(() => {
    if (!form.subcounty?.trim()) {
      setParishes([])
      return
    }
    const selected = form.subcounty.trim()
    locationsApi
      .parishes(selected)
      .then((p) => {
        const sorted = uniqueSorted(p)
        if (sorted.length > 0) {
          setParishes(sorted)
          return
        }
        setParishes(
          uniqueSorted(
            locationRows
              .filter((r) => r.subcounty === selected)
              .map((r) => r.parish),
          ),
        )
      })
      .catch(() =>
        setParishes(
          uniqueSorted(
            locationRows
              .filter((r) => r.subcounty === selected)
              .map((r) => r.parish),
          ),
        ),
      )
  }, [form.subcounty, locationRows])

  useEffect(() => {
    if (!form.parish?.trim()) {
      setVillages([])
      return
    }
    const selected = form.parish.trim()
    locationsApi
      .villages(selected)
      .then((v) => {
        const sorted = uniqueSorted(v)
        if (sorted.length > 0) {
          setVillages(sorted)
          return
        }
        setVillages(
          uniqueSorted(
            locationRows
              .filter((r) => r.parish === selected)
              .map((r) => r.village),
          ),
        )
      })
      .catch(() =>
        setVillages(
          uniqueSorted(
            locationRows
              .filter((r) => r.parish === selected)
              .map((r) => r.village),
          ),
        ),
      )
  }, [form.parish, locationRows])

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
    const query = form.address.trim()
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
  }, [form.address, placesReady])

  const applyAddressSuggestion = (placeId: string, description: string) => {
    setForm((f) => ({ ...f, address: description }))
    setAddressSuggestions([])
    const svc = placesServiceRef.current
    if (!svc) return
    svc.getDetails(
      { placeId, fields: ['geometry', 'formatted_address'] },
      (result: any, status: string) => {
        const w = window as any
        if (status !== w.google?.maps?.places?.PlacesServiceStatus?.OK || !result)
          return
        const loc = result.geometry?.location
        const lat =
          loc && typeof loc.lat === 'function' ? loc.lat() : null
        const lng =
          loc && typeof loc.lng === 'function' ? loc.lng() : null
        setForm((f) => ({
          ...f,
          address:
            f.address === description
              ? result.formatted_address || description
              : f.address,
          addressLat: lat,
          addressLng: lng,
        }))
      },
    )
  }

  const closeDialogs = () => {
    setCreateOpen(false)
    setEditTarget(null)
    setViewTarget(null)
    setForm(emptyStageForm())
    setAddressSuggestions([])
  }

  const openCreate = () => {
    setEditTarget(null)
    setViewTarget(null)
    setForm(emptyStageForm())
    setAddressSuggestions([])
    setCreateOpen(true)
  }

  const openEdit = (stage: StageRead) => {
    setCreateOpen(false)
    setViewTarget(null)
    setEditTarget(stage)
    setAddressSuggestions([])
    setForm({
      display_name: stage.display_name ?? '',
      district: stage.district ?? '',
      county: stage.county ?? '',
      subcounty: stage.subcounty ?? '',
      parish: stage.parish ?? '',
      village: stage.village ?? '',
      address: stage.address ?? '',
      addressLat: stage.lat ?? null,
      addressLng: stage.lng ?? null,
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
    lat: form.addressLat,
    lng: form.addressLng,
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
      void alertError('Stage', 'Could not create stage.')
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
      void alertError('Stage', 'Could not update stage.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: 'Delete this stage?',
      text: 'This cannot be undone.',
      confirmButtonText: 'Delete',
    })
    if (!ok) return
    try {
      await stagesApi.delete(id)
      await onRefreshStages()
    } catch (error) {
      console.error(error)
      void alertError('Stage', 'Could not delete stage.')
    }
  }

  const columns: GridColDef<StageRead>[] = [
    { field: 'display_name', headerName: 'Stage / park', flex: 1, minWidth: 160 },
    { field: 'district', headerName: 'District', flex: 0.7, minWidth: 100 },
    { field: 'county', headerName: 'County', flex: 0.7, minWidth: 100 },
    { field: 'subcounty', headerName: 'Subcounty', flex: 0.7, minWidth: 100 },
    { field: 'parish', headerName: 'Parish', flex: 0.7, minWidth: 100 },
    { field: 'village', headerName: 'Village', flex: 0.7, minWidth: 100 },
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
            style={{ width: 30, height: 30, padding: 0 }}
            title="View"
            aria-label="View stage"
            onClick={() => setViewTarget(row)}
          >
            <i className="fa fa-eye" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ width: 30, height: 30, padding: 0 }}
            title="Edit"
            aria-label="Edit stage"
            onClick={() => openEdit(row)}
          >
            <i className="fa fa-pencil" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="secondary-button"
            style={{ width: 30, height: 30, padding: 0, color: '#ef4444' }}
            title="Delete"
            aria-label="Delete stage"
            onClick={() => void handleDelete(row.id)}
          >
            <i className="fa fa-trash" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ]

  const formFieldsProps: StageFormFieldsProps = {
    form,
    setForm,
    districts,
    counties,
    subcounties,
    parishes,
    villages,
    addressSuggestions,
    applyAddressSuggestion,
    placesReady,
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header-row">
        <h1 className="dashboard-page-title">Stages</h1>
        <button type="button" className="primary-button" onClick={openCreate}>
          + New Stage
        </button>
      </div>

      <DashboardDialog
        open={createOpen}
        onClose={closeDialogs}
        title="New stage"
        titleId="stage-create-title"
        wide
      >
        <form className="dashboard-dialog-form" onSubmit={handleCreate}>
          <StageFormFields {...formFieldsProps} />
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
        wide
      >
        <form className="dashboard-dialog-form" onSubmit={handleUpdate}>
          <StageFormFields {...formFieldsProps} />
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
              {viewTarget.lat != null && viewTarget.lng != null && (
                <p style={{ fontSize: '0.85rem', color: 'var(--dashboard-muted, #64748b)' }}>
                  <strong>Coordinates:</strong> {viewTarget.lat.toFixed(6)},{' '}
                  {viewTarget.lng.toFixed(6)}
                </p>
              )}
            </div>
          )}
        </div>
      </DashboardDialog>

      <div className="dashboard-table-shell">
        <div className="dashboard-table-scroll">
          <DashboardDataGrid<StageRead>
            rows={stageData}
            columns={columns}
            getRowId={(row) => row.id}
            localeText={{ noRowsLabel: 'No stage records found.' }}
          />
        </div>
      </div>
    </div>
  )
}
