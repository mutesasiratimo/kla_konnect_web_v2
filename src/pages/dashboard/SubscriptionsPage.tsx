import { useState } from 'react'
import type { SubscriptionCategoryRow } from './mockData'
import { DataTablePagination } from '../../components/table/DataTablePagination'

interface SubscriptionsPageProps {
  subscriptionsByCategory: SubscriptionCategoryRow[]
}

export function SubscriptionsPage({
  subscriptionsByCategory,
}: SubscriptionsPageProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalPages = Math.max(1, Math.ceil(subscriptionsByCategory.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedSubscriptions = subscriptionsByCategory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page-title">Subscriptions</h1>
      <p className="dashboard-page-lead">
        Manage operator and vehicle subscription plans.
      </p>

      <div className="dashboard-table-shell">
        <div className="dashboard-table-meta">
          <span>Summary by vehicle category.</span>
        </div>
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Registered</th>
                <th scope="col">Compliant</th>
                <th scope="col">Compliance rate</th>
                <th scope="col">Revenue collected</th>
                <th scope="col">Arrears</th>
              </tr>
            </thead>
            <tbody>
              {pagedSubscriptions.map((row) => {
                const rate =
                  row.registered === 0
                    ? '—'
                    : `${Math.round((row.compliant / row.registered) * 100)}%`
                return (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td>{row.registered}</td>
                    <td>{row.compliant}</td>
                    <td>{rate}</td>
                    <td>{row.revenueCollected}</td>
                    <td>{row.arrears}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={subscriptionsByCategory.length}
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
