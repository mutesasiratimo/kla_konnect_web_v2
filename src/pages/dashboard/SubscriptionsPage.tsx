import { useMemo } from 'react'
import type { GridColDef } from '@mui/x-data-grid'
import type { SubscriptionCategoryRow } from './mockData'
import { DashboardDataGrid } from '../../components/table/DashboardDataGrid'

type SubscriptionGridRow = SubscriptionCategoryRow & { id: string }

interface SubscriptionsPageProps {
  subscriptionsByCategory: SubscriptionCategoryRow[]
}

export function SubscriptionsPage({
  subscriptionsByCategory,
}: SubscriptionsPageProps) {
  const rows: SubscriptionGridRow[] = useMemo(
    () =>
      subscriptionsByCategory.map((r) => ({
        ...r,
        id: r.category,
      })),
    [subscriptionsByCategory],
  )

  const columns: GridColDef<SubscriptionGridRow>[] = [
    { field: 'category', headerName: 'Category', flex: 1, minWidth: 140 },
    { field: 'registered', headerName: 'Registered', type: 'number', width: 120 },
    { field: 'compliant', headerName: 'Compliant', type: 'number', width: 120 },
    {
      field: 'complianceRate',
      headerName: 'Compliance rate',
      width: 140,
      sortable: false,
      valueGetter: (_v, row) =>
        row.registered === 0
          ? '—'
          : `${Math.round((row.compliant / row.registered) * 100)}%`,
    },
    { field: 'revenueCollected', headerName: 'Revenue collected', flex: 1, minWidth: 140 },
    { field: 'arrears', headerName: 'Arrears', flex: 0.8, minWidth: 100 },
  ]

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page-title">Subscriptions</h1>

      <div className="dashboard-table-shell">
        <div className="dashboard-table-scroll">
          <DashboardDataGrid<SubscriptionGridRow>
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            localeText={{ noRowsLabel: 'No subscription summary rows.' }}
          />
        </div>
      </div>
    </div>
  )
}
