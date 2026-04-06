import { createTheme } from '@mui/material/styles'

export function createDashboardMuiTheme(darkMode: boolean) {
  return createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#6f8f00', contrastText: '#f8fff0' },
      background: {
        default: darkMode ? '#0f172a' : '#f5f7fb',
        paper: darkMode ? '#1e293b' : '#ffffff',
      },
      divider: darkMode ? '#334155' : '#e8edf4',
    },
    shape: { borderRadius: 12 },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: '14px',
            border: '1px solid',
            borderColor: darkMode ? '#334155' : '#e8edf4',
            boxShadow: 'none',
            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              backgroundColor: darkMode ? '#1e293b' : '#f6f8fc',
              fontWeight: 600,
              fontSize: '0.8rem',
              color: darkMode ? '#94a3b8' : '#6b7280',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-of-type .MuiTableCell-root': {
              borderBottomColor: 'transparent',
            },
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#f8faff',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: darkMode ? '#334155' : '#e5e7eb',
            fontSize: '0.85rem',
            padding: '10px 12px',
          },
        },
      },
    },
  })
}
