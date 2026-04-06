/** Literal permission that grants every permission (API + UI). */
export const ALL_PERMISSION_KEY = 'all'

/**
 * Turn various API shapes into a string[] so UI code never spreads a non-array.
 * Handles raw arrays and common envelopes: { items }, { permissions }, { data }.
 */
export function coercePermissionStringList(data: unknown): string[] {
  if (data == null) return []
  if (Array.isArray(data)) {
    return data.map((x) => String(x)).filter((s) => s.length > 0)
  }
  if (typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (Array.isArray(o.items)) return coercePermissionStringList(o.items)
    if (Array.isArray(o.permissions)) return coercePermissionStringList(o.permissions)
    if (Array.isArray(o.data)) return coercePermissionStringList(o.data)
  }
  return []
}

export function mergeCatalogKeys(catalog: string[]): string[] {
  return [...new Set([...catalog, ALL_PERMISSION_KEY])].sort(
    sortKeysWithAllFirst,
  )
}

function sortKeysWithAllFirst(a: string, b: string): number {
  if (a === ALL_PERMISSION_KEY) return -1
  if (b === ALL_PERMISSION_KEY) return 1
  return a.localeCompare(b)
}

export function groupPermissionKeys(keys: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const p of [...keys].sort(sortKeysWithAllFirst)) {
    const prefix =
      p === ALL_PERMISSION_KEY
        ? 'full access'
        : p.includes(':')
          ? p.slice(0, p.indexOf(':'))
          : 'general'
    const list = map.get(prefix) ?? []
    list.push(p)
    map.set(prefix, list)
  }
  return map
}

export function roleHasAllPermission(
  permissions: string[] | null | undefined,
): boolean {
  return Boolean(permissions?.includes(ALL_PERMISSION_KEY))
}

/** Build checkbox state from API list; `all` implies every catalog key is on. */
export function selectionFromRolePermissions(
  rolePermissions: string[] | null | undefined,
  catalogKeys: string[],
): Record<string, boolean> {
  const list = coercePermissionStringList(rolePermissions)
  const hasAll = list.includes(ALL_PERMISSION_KEY)
  const sel: Record<string, boolean> = {}
  for (const k of catalogKeys) {
    sel[k] = hasAll || list.includes(k)
  }
  return sel
}

export function isEffectivePermissionChecked(
  key: string,
  sel: Record<string, boolean>,
): boolean {
  if (sel[ALL_PERMISSION_KEY]) return true
  return Boolean(sel[key])
}

export function togglePermissionSelection(
  key: string,
  catalogKeys: string[],
  prev: Record<string, boolean>,
): Record<string, boolean> {
  const nonAll = catalogKeys.filter((k) => k !== ALL_PERMISSION_KEY)

  if (key === ALL_PERMISSION_KEY) {
    if (!prev[ALL_PERMISSION_KEY]) {
      const out: Record<string, boolean> = {}
      for (const k of catalogKeys) out[k] = false
      out[ALL_PERMISSION_KEY] = true
      return out
    }
    const out: Record<string, boolean> = {}
    for (const k of catalogKeys) out[k] = false
    return out
  }

  if (prev[ALL_PERMISSION_KEY]) {
    const out: Record<string, boolean> = {}
    for (const k of catalogKeys) out[k] = false
    out[ALL_PERMISSION_KEY] = false
    for (const k of nonAll) out[k] = k !== key
    return out
  }

  const next = { ...prev, [key]: !prev[key] }

  const allGranularSelected =
    nonAll.length > 0 && nonAll.every((k) => next[k])
  if (allGranularSelected) {
    const out: Record<string, boolean> = {}
    for (const k of catalogKeys) out[k] = false
    out[ALL_PERMISSION_KEY] = true
    return out
  }

  return next
}

/** Payload for create / setPermissions: only `all` when full access is selected. */
export function permissionsPayloadFromSelection(
  sel: Record<string, boolean>,
  catalogKeys: string[],
): string[] {
  if (sel[ALL_PERMISSION_KEY]) return [ALL_PERMISSION_KEY]
  return catalogKeys.filter((k) => Boolean(sel[k]))
}

export function permissionCountLabel(
  permissions: string[] | null | undefined,
): string {
  if (!permissions?.length) return '0'
  if (roleHasAllPermission(permissions)) return 'All'
  return String(permissions.length)
}
