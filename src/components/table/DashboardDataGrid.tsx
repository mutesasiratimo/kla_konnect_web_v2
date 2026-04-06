import { useMemo } from 'react'
import { deepmerge } from '@mui/utils'
import { DataGrid, type DataGridProps } from '@mui/x-data-grid'
import type { GridValidRowModel } from '@mui/x-data-grid/models'

const defaultPageSizeOptions = [10, 25, 50] as const

/** Native MUI TablePagination inside the grid footer — one flex row, shared baseline. */
const gridSx: DataGridProps['sx'] = {
  border: 'none',
  borderRadius: '14px',
  width: '100%',
  backgroundColor: 'background.paper',
  '& .MuiDataGrid-main': {
    borderRadius: '14px',
  },
  '& .MuiDataGrid-columnHeaders': {
    borderRadius: '14px 14px 0 0',
    fontWeight: 600,
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 600,
    fontSize: '0.8rem',
  },
  '& .MuiDataGrid-cell': {
    fontSize: '0.85rem',
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: 1,
    borderColor: 'divider',
    minHeight: 52,
    '& .MuiTablePagination-root': {
      border: 'none',
      width: '100%',
      overflow: 'visible',
      verticalAlign: 'middle',
    },
    '& .MuiTablePagination-toolbar': {
      alignItems: 'center',
      flexWrap: 'nowrap',
      minHeight: 52,
      px: 2,
      py: 0,
      gap: 1.5,
    },
    '& .MuiTablePagination-spacer': {
      flex: '1 1 auto',
    },
    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
      margin: 0,
      lineHeight: 1.43,
      fontSize: '0.8125rem',
      color: 'text.secondary',
      display: 'flex',
      alignItems: 'center',
      alignSelf: 'center',
    },
    '& .MuiTablePagination-select': {
      marginLeft: 0,
      marginRight: 0,
      alignSelf: 'center',
      '& .MuiSelect-select': {
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 32,
        py: 0.5,
        boxSizing: 'border-box',
      },
    },
    '& .MuiTablePagination-input': {
      marginTop: 0,
      marginBottom: 0,
      alignSelf: 'center',
    },
    '& .MuiTablePagination-actions': {
      flexShrink: 0,
      marginLeft: '0 !important',
      display: 'inline-flex',
      alignItems: 'center',
      alignSelf: 'center',
      gap: 0.25,
    },
  },
}

const defaultSlotProps: DataGridProps['slotProps'] = {
  basePagination: {
    material: {
      labelRowsPerPage: 'Rows per page:',
      SelectProps: { size: 'small' },
      slotProps: {
        actions: {
          previousButton: { size: 'small' },
          nextButton: { size: 'small' },
        },
      },
    },
  },
}

export type DashboardDataGridProps<R extends GridValidRowModel = GridValidRowModel> = Omit<
  DataGridProps<R>,
  'pageSizeOptions' | 'initialState'
> & {
  pageSizeOptions?: number[]
  initialState?: DataGridProps<R>['initialState']
}

export function DashboardDataGrid<R extends GridValidRowModel = GridValidRowModel>({
  autoHeight = true,
  pageSizeOptions = [...defaultPageSizeOptions],
  initialState,
  disableRowSelectionOnClick = true,
  sx,
  slotProps: slotPropsProp,
  ...rest
}: DashboardDataGridProps<R>) {
  const slotProps = useMemo(
    () => deepmerge(defaultSlotProps, slotPropsProp ?? {}),
    [slotPropsProp],
  )

  return (
    <DataGrid<R>
      autoHeight={autoHeight}
      pagination
      pageSizeOptions={pageSizeOptions}
      initialState={{
        pagination: { paginationModel: { page: 0, pageSize: 10 } },
        ...initialState,
      }}
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      slotProps={slotProps}
      sx={[gridSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...rest}
    />
  )
}
