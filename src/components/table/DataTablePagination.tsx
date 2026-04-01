type DataTablePaginationProps = {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export function DataTablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  if (totalItems <= pageSize && !onPageSizeChange) return null

  return (
    <div className="dashboard-pagination">
      {onPageSizeChange && (
        <label className="dashboard-filter-label" style={{ margin: 0 }}>
          <span style={{ marginRight: 8 }}>Rows per page</span>
          <select
            className="dashboard-filter-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{ minWidth: 92 }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        className="pagination-button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>
      <span className="pagination-info">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="pagination-button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </div>
  )
}
