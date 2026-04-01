import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { IncidentCategoryRead, IncidentRead } from '../../api/types'
import { GOOGLE_MAPS_API_KEY } from '../../config/maps'

interface DashboardHomePageProps {
  pendingIncidentsCount: number
  liveIncidentsCount: number
  resolvedIncidentsCount: number
  archivedIncidentsCount: number
  usersCount: number
  vehiclesTotalCount: number
  vehiclesCompliantCount: number
  vehiclesInReviewCount: number
  usersActiveCount?: number
  onViewIncidentDetails: () => void
  recentIncidents: IncidentRead[]
  mapIncidents: IncidentRead[]
  incidentCategories: IncidentCategoryRead[]
  incidentsVsTimeData?: {
    monthly: { label: string; value: number }[]
    quarterly: { label: string; value: number }[]
    annual: { label: string; value: number }[]
  }
  incidentsByCategoryData?: { name: string; value: number }[]
  analyticsLoading?: boolean
}

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const previousValueRef = useRef(0)

  useEffect(() => {
    const start = previousValueRef.current
    const end = Number.isFinite(value) ? value : 0
    const duration = 700
    const startTs = performance.now()

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    const tick = (ts: number) => {
      const progress = Math.min(1, (ts - startTs) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = start + (end - start) * eased
      setDisplayValue(Math.round(next))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        previousValueRef.current = end
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [value])

  return <>{displayValue.toLocaleString()}</>
}

export function DashboardHomePage({
  pendingIncidentsCount,
  liveIncidentsCount,
  resolvedIncidentsCount,
  archivedIncidentsCount,
  usersCount,
  vehiclesTotalCount,
  vehiclesCompliantCount,
  vehiclesInReviewCount,
  usersActiveCount,
  onViewIncidentDetails,
  recentIncidents,
  mapIncidents,
  incidentCategories,
  incidentsVsTimeData,
  incidentsByCategoryData,
  analyticsLoading = false,
}: DashboardHomePageProps) {
  const [timeView, setTimeView] = useState<'Monthly' | 'Quarterly' | 'Annual'>(
    'Monthly',
  )
  const [activeDonutIndex, setActiveDonutIndex] = useState(0)
  const googleMapsKey = GOOGLE_MAPS_API_KEY.trim()
  const mapRef = useRef<HTMLDivElement | null>(null)
  const categoryImageById = useMemo(
    () => Object.fromEntries(incidentCategories.map((category) => [category.id, category.image ?? null])),
    [incidentCategories],
  )

  const chartData = useMemo(() => {
    const fallbackMonthly = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ].map((label) => ({ label, value: 0 }))
    const fallbackQuarterly = ['Q1', 'Q2', 'Q3', 'Q4'].map((label) => ({
      label,
      value: 0,
    }))
    const fallbackAnnual = [{ label: 'Current', value: 0 }]

    if (timeView === 'Annual') return incidentsVsTimeData?.annual ?? fallbackAnnual
    if (timeView === 'Quarterly')
      return incidentsVsTimeData?.quarterly ?? fallbackQuarterly
    return incidentsVsTimeData?.monthly ?? fallbackMonthly
  }, [timeView, incidentsVsTimeData])

  const donutData = useMemo(
    () => {
      const palette = ['#4458b8', '#972bb2', '#f59d0b', '#4caf50', '#f9423a', '#2f95df']
      const source = incidentsByCategoryData ?? []
      if (source.length === 0) {
        return [{ name: 'No data', value: 1, color: '#94a3b8' }]
      }
      return source.map((item, idx) => ({
        name: item.name,
        value: item.value,
        color: palette[idx % palette.length],
      }))
    },
    [incidentsByCategoryData],
  )

  const timeAgo = (date: string): string => {
    const ts = new Date(date).getTime()
    if (Number.isNaN(ts)) return 'Unknown time'
    const diffMs = Date.now() - ts
    const min = Math.floor(diffMs / 60000)
    if (min < 1) return 'Just now'
    if (min < 60) return `${min} min ago`
    const hrs = Math.floor(min / 60)
    if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`
    const days = Math.floor(hrs / 24)
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} mo ago`
    const years = Math.floor(months / 12)
    return `${years} yr${years === 1 ? '' : 's'} ago`
  }

  const statusLabel = (status?: string | null): 'Pending' | 'Live' | 'Resolved' | 'Archived' => {
    if (status === '2') return 'Resolved'
    if (status === '0') return 'Archived'
    if (status === '1') return 'Pending'
    return 'Live'
  }

  useEffect(() => {
    if (!googleMapsKey || !mapRef.current) return

    type GoogleLike = {
      maps: {
        Map: new (
          el: HTMLElement,
          opts: {
            center: { lat: number; lng: number }
            zoom: number
            mapTypeId: string
            disableDefaultUI?: boolean
            zoomControl?: boolean
            streetViewControl?: boolean
            fullscreenControl?: boolean
            mapTypeControl?: boolean
          },
        ) => unknown
        Polygon: new (opts: {
          paths:
            | Array<{ lat: number; lng: number }>
            | Array<Array<{ lat: number; lng: number }>>
          strokeColor?: string
          strokeOpacity?: number
          strokeWeight?: number
          fillColor?: string
          fillOpacity?: number
          clickable?: boolean
          map?: unknown
        }) => unknown
        Marker: new (opts: {
          position: { lat: number; lng: number }
          map: unknown
          title?: string
          icon?: {
            url: string
            scaledSize?: unknown
          }
        }) => unknown
        Size: new (width: number, height: number) => unknown
        LatLngBounds: new () => {
          extend: (point: { lat: number; lng: number }) => void
        }
      }
    }

    const mapEl = mapRef.current
    const initMap = (google: GoogleLike) => {
      const map = new google.maps.Map(mapEl, {
        center: { lat: 0.3476, lng: 32.5825 },
        zoom: 12,
        mapTypeId: 'roadmap',
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        mapTypeControl: false,
      })

      // Approximate Kampala boundary polygon for visual highlighting.
      const kampalaBoundary = [
        { lat: 0.428, lng: 32.445 },
        { lat: 0.442, lng: 32.506 },
        { lat: 0.437, lng: 32.58 },
        { lat: 0.425, lng: 32.64 },
        { lat: 0.403, lng: 32.698 },
        { lat: 0.36, lng: 32.728 },
        { lat: 0.303, lng: 32.726 },
        { lat: 0.267, lng: 32.699 },
        { lat: 0.245, lng: 32.655 },
        { lat: 0.232, lng: 32.607 },
        { lat: 0.227, lng: 32.548 },
        { lat: 0.236, lng: 32.488 },
        { lat: 0.258, lng: 32.452 },
        { lat: 0.302, lng: 32.43 },
        { lat: 0.36, lng: 32.429 },
      ]
      const kampalaHole = [...kampalaBoundary].reverse()

      const worldRing = [
        { lat: 85, lng: -179.999 },
        { lat: 85, lng: 179.999 },
        { lat: -85, lng: 179.999 },
        { lat: -85, lng: -179.999 },
      ]

      // Mask the rest of the map and leave Kampala area clear.
      new google.maps.Polygon({
        paths: [worldRing, kampalaHole],
        strokeOpacity: 0,
        fillColor: '#1f2d00',
        fillOpacity: 0.22,
        clickable: false,
        map,
      })

      // Crisp boundary stroke around Kampala.
      new google.maps.Polygon({
        paths: kampalaBoundary,
        strokeColor: '#9ac200',
        strokeOpacity: 0.95,
        strokeWeight: 2.5,
        fillOpacity: 0,
        clickable: false,
        map,
      })

      const bounds = new google.maps.LatLngBounds()
      kampalaBoundary.forEach((point) => bounds.extend(point))
      ;(
        map as {
          fitBounds?: (b: { extend: (point: { lat: number; lng: number }) => void }) => void
        }
      ).fitBounds?.(bounds)

      mapIncidents.forEach((incident) => {
        if (
          incident.addresslat == null ||
          incident.addresslong == null ||
          Number.isNaN(Number(incident.addresslat)) ||
          Number.isNaN(Number(incident.addresslong))
        ) {
          return
        }
        const iconUrl = categoryImageById[incident.incident_category_id]
        new google.maps.Marker({
          position: { lat: Number(incident.addresslat), lng: Number(incident.addresslong) },
          map,
          title: incident.name || 'Incident',
          icon: iconUrl
            ? {
                url: iconUrl,
                scaledSize: new google.maps.Size(36, 36),
              }
            : undefined,
        })
      })
    }

    const existingGoogle = (
      window as Window & { google?: GoogleLike; __dmmpInitMap?: () => void }
    ).google

    if (existingGoogle?.maps) {
      initMap(existingGoogle)
      return
    }

    ;(
      window as Window & { google?: GoogleLike; __dmmpInitMap?: () => void }
    ).__dmmpInitMap = () => {
      const loaded = (
        window as Window & { google?: GoogleLike; __dmmpInitMap?: () => void }
      ).google
      if (loaded?.maps) initMap(loaded)
    }

    const alreadyAdded = document.querySelector(
      'script[data-google-maps-loader="true"]',
    )
    if (alreadyAdded) return

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsKey)}&callback=__dmmpInitMap`
    script.async = true
    script.defer = true
    script.setAttribute('data-google-maps-loader', 'true')
    document.head.appendChild(script)
  }, [googleMapsKey, mapIncidents, categoryImageById])

  return (
    <div className="dashboard-home-v2">
      <div className="dashboard-home-v2-header">
        <h1 className="dashboard-page-title">Dashboard</h1>
      </div>

      <section className="dashboard-home-v2-top">
        <article className="dashboard-v2-stat-card dashboard-v2-stat-card--incidents">
          <div className="dashboard-v2-card-head">
            <span>Incidents</span>
            <button
              type="button"
              className="dashboard-v2-text-link"
              onClick={onViewIncidentDetails}
            >
              View Details
              <i className="fa fa-arrow-circle-right" aria-hidden="true" />
            </button>
          </div>
          <div className="dashboard-v2-kpi-grid">
            <div>
              <span className="dashboard-v2-kpi-label">Pending</span>
              <strong>
                <AnimatedCounter value={pendingIncidentsCount} />
              </strong>
            </div>
            <div>
              <span className="dashboard-v2-kpi-label">Live</span>
              <strong>
                <AnimatedCounter value={liveIncidentsCount} />
              </strong>
            </div>
            <div>
              <span className="dashboard-v2-kpi-label">Resolved</span>
              <strong>
                <AnimatedCounter value={resolvedIncidentsCount} />
              </strong>
            </div>
            <div>
              <span className="dashboard-v2-kpi-label">Archived</span>
              <strong>
                <AnimatedCounter value={archivedIncidentsCount} />
              </strong>
            </div>
          </div>
        </article>

        <article className="dashboard-v2-stat-card dashboard-v2-stat-card--users">
          <div className="dashboard-v2-card-head">
            <span>Users</span>
            <button
              type="button"
              className="dashboard-v2-text-link"
              onClick={onViewIncidentDetails}
            >
              View Details
              <i className="fa fa-arrow-circle-right" aria-hidden="true" />
            </button>
          </div>
          <div className="dashboard-v2-kpi-grid">
            <div>
              <span className="dashboard-v2-kpi-label">Total</span>
              <strong>
                <AnimatedCounter value={usersCount} />
              </strong>
            </div>
            <div>
              <span className="dashboard-v2-kpi-label">Active</span>
              <strong>
                <AnimatedCounter value={usersActiveCount ?? usersCount} />
              </strong>
            </div>
          </div>
        </article>

        <article className="dashboard-v2-stat-card dashboard-v2-stat-card--vehicles">
          <div className="dashboard-v2-card-head">
            <span>Vehicles</span>
            <button
              type="button"
              className="dashboard-v2-text-link"
              onClick={onViewIncidentDetails}
            >
              View Details
              <i className="fa fa-arrow-circle-right" aria-hidden="true" />
            </button>
          </div>
          <div className="dashboard-v2-kpi-grid">
            <div>
              <span className="dashboard-v2-kpi-label">Total</span>
              <strong>
                <AnimatedCounter value={vehiclesTotalCount} />
              </strong>
            </div>
            <div>
              <span className="dashboard-v2-kpi-label">Compliant</span>
              <strong>
                <AnimatedCounter value={vehiclesCompliantCount} />
              </strong>
            </div>
            <div>
              <span className="dashboard-v2-kpi-label">In Review</span>
              <strong>
                <AnimatedCounter value={vehiclesInReviewCount} />
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-home-v2-main">
        <div className="dashboard-home-v2-left">
          <article className="dashboard-v2-card dashboard-v2-card--heatmap">
            <div className="dashboard-v2-card-head">
              <span>Incident Heat Map</span>
              <button
                type="button"
                className="dashboard-v2-text-link"
                onClick={onViewIncidentDetails}
              >
                View Details
                <i className="fa fa-arrow-circle-right" aria-hidden="true" />
              </button>
            </div>
            <div className="dashboard-v2-map-embed">
              {googleMapsKey ? (
                <div
                  ref={mapRef}
                  className="dashboard-v2-google-map"
                  aria-label="Incident Heat Map"
                />
              ) : (
                <div className="dashboard-v2-map-fallback">
                  <p>Configure Google Maps API key to load map.</p>
                </div>
              )}
            </div>
          </article>
        </div>

        <div className="dashboard-home-v2-middle">
          <article className="dashboard-v2-card dashboard-v2-card--orders">
            <div className="dashboard-v2-card-head">
              <span>Recent Incidents</span>
              <button
                type="button"
                className="dashboard-v2-text-link"
                onClick={onViewIncidentDetails}
              >
                View Details
                <i className="fa fa-arrow-circle-right" aria-hidden="true" />
              </button>
            </div>
            {recentIncidents.length === 0 ? (
              <div className="dashboard-v2-empty-state">
                <div className="dashboard-v2-empty-icon" aria-hidden="true">
                  <i className="fa fa-exclamation-circle" aria-hidden="true" />
                </div>
                <h3>No Incidents Yet</h3>
                <p>No incidents have been reported yet.</p>
              </div>
            ) : (
              <ul className="dashboard-v2-recent-list" aria-label="Recent incidents list">
                {recentIncidents.map((incident) => {
                  const badge = statusLabel(incident.status)
                  return (
                    <li key={incident.id} className="dashboard-v2-recent-item">
                      {incident.iscityreport && (
                        <span
                          className="dashboard-v2-recent-verified"
                          title="Verified city report"
                          aria-label="Verified city report"
                        >
                          <i className="fa fa-check-circle" aria-hidden="true" />
                        </span>
                      )}
                      <img
                        src={`https://picsum.photos/seed/incident-${incident.id}/60/60`}
                        alt=""
                        className="dashboard-v2-recent-thumb"
                        loading="lazy"
                      />
                      <div className="dashboard-v2-recent-copy">
                        <p className="dashboard-v2-recent-title">
                          {incident.name || 'Untitled incident'}
                        </p>
                        <p className="dashboard-v2-recent-subtitle">
                          {incident.address?.trim() || 'Address not provided'}
                        </p>
                      </div>
                      <div className="dashboard-v2-recent-meta">
                        <span className="dashboard-v2-recent-time">
                          {timeAgo(incident.datecreated)}
                        </span>
                        <span
                          className={`dashboard-v2-recent-status dashboard-v2-recent-status--${badge.toLowerCase()}`}
                        >
                          {badge}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </article>
        </div>
      </section>

      <section className="dashboard-home-v2-distribution">
        <article className="dashboard-v2-card dashboard-v2-card--bar">
          <div className="dashboard-v2-card-head">
            <span>Incidents/Reports vs Time</span>
            <label className="dashboard-v2-dropdown-wrap">
              <select
                value={timeView}
                onChange={(e) =>
                  setTimeView(
                    e.target.value as 'Monthly' | 'Quarterly' | 'Annual',
                  )
                }
                className="dashboard-v2-dropdown"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
              </select>
            </label>
          </div>
            {analyticsLoading && (
              <small className="dashboard-v2-inline-hint">Loading chart data...</small>
            )}
          <div className="dashboard-v2-bar-shell">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 6, right: 4, left: -16, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#334155', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={false}
                  domain={[0, 'dataMax + 10']}
                />
                <Tooltip cursor={{ fill: 'rgba(79,108,247,0.08)' }} />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} fill="#9ac200" maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashboard-v2-card dashboard-v2-card--donut">
          <div className="dashboard-v2-card-head">
            <span>Categories Distribution</span>
          </div>
          {analyticsLoading && (
            <small className="dashboard-v2-inline-hint">Loading category split...</small>
          )}
          <div className="dashboard-v2-donut-shell">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={86}
                  outerRadius={138}
                  paddingAngle={3}
                  onMouseEnter={(_, idx) => setActiveDonutIndex(idx)}
                >
                  {donutData.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      stroke={idx === activeDonutIndex ? '#ffffff' : 'none'}
                      strokeWidth={idx === activeDonutIndex ? 4 : 0}
                      opacity={idx === activeDonutIndex ? 1 : 0.9}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  )
}
