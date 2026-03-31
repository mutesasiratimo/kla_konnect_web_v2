import { useState, useEffect, useMemo } from 'react'

type GeoJSONFeature = {
  type: 'Feature'
  properties: Record<string, string>
  geometry: {
    type: 'MultiPolygon' | 'Polygon'
    coordinates: number[][][][] | number[][][]
  }
}

type GeoJSON = {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

const UGA_BOUNDS = {
  minLon: 29.57,
  maxLon: 35.04,
  minLat: -1.48,
  maxLat: 4.22,
}

function projectToSvg(
  lon: number,
  lat: number,
  width: number,
  height: number,
): [number, number] {
  const { minLon, maxLon, minLat, maxLat } = UGA_BOUNDS
  const x = ((lon - minLon) / (maxLon - minLon)) * width
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * height
  return [x, y]
}

function ringToPath(
  ring: number[][],
  width: number,
  height: number,
): string {
  if (ring.length < 2) return ''
  const [first, ...rest] = ring
  const [fx, fy] = projectToSvg(first[0], first[1], width, height)
  let d = `M ${fx} ${fy}`
  for (const coord of rest) {
    const [x, y] = projectToSvg(coord[0], coord[1], width, height)
    d += ` L ${x} ${y}`
  }
  return d + ' Z'
}

function geometryToPaths(
  geometry: GeoJSONFeature['geometry'],
  width: number,
  height: number,
): string[] {
  const paths: string[] = []
  if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates as number[][][][]
    for (const polygon of coords) {
      for (const ring of polygon) {
        paths.push(ringToPath(ring as number[][], width, height))
      }
    }
  } else if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates as number[][][]
    for (const ring of coords) {
      paths.push(ringToPath(ring, width, height))
    }
  }
  return paths
}

type UgandaMapProps = {
  width?: number
  height?: number
  className?: string
}

export function UgandaMap({
  width = 400,
  height = 300,
  className = '',
}: UgandaMapProps) {
  const [geoData, setGeoData] = useState<GeoJSON | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    import('./assets/gadm41_UGA_4.json')
      .then((mod) => {
        if (!cancelled) {
          setGeoData(mod.default as GeoJSON)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load map')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const paths = useMemo(() => {
    if (!geoData?.features) return []
    const all: string[] = []
    for (const feature of geoData.features) {
      all.push(...geometryToPaths(feature.geometry, width, height))
    }
    return all
  }, [geoData, width, height])

  if (loading) {
    return (
      <div className={className} style={{ width, height, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading map…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className} style={{ width, height, background: '#fef2f2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#b91c1c', fontSize: '0.9rem' }}>{error}</span>
      </div>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="auto"
      className={className}
      style={{ display: 'block', maxHeight: height }}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Map of Uganda"
    >
      <g fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5">
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  )
}
