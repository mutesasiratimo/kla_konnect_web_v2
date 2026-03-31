export type DashboardPage =
  | 'dashboard'
  | 'incidents'
  | 'incidents-summary'
  | 'incidents-incidents'
  | 'incidents-city-alerts'
  | 'incidents-categories'
  | 'news'
  | 'news-news'
  | 'news-categories'
  | 'vehicles'
  | 'stages'
  | 'categories'
  | 'routes'
  | 'reports'
  | 'subscriptions'
  | 'enforcements'
  | 'users'
  | 'settings'

export type NavItem =
  | { key: DashboardPage; label: string; icon: string; children?: undefined }
  | {
      key: DashboardPage
      label: string
      icon: string
      children: { key: DashboardPage; label: string }[]
    }

export const pageToPath: Record<DashboardPage, string> = {
  dashboard: '/dashboard',
  incidents: '/incidents',
  'incidents-summary': '/incidents/summary',
  'incidents-incidents': '/incidents/incidents',
  'incidents-city-alerts': '/incidents/city-alerts',
  'incidents-categories': '/incidents/categories',
  news: '/news',
  'news-news': '/news/news',
  'news-categories': '/news/categories',
  vehicles: '/vehicles',
  stages: '/stages',
  categories: '/categories',
  routes: '/routes',
  reports: '/reports',
  subscriptions: '/subscriptions',
  enforcements: '/enforcements',
  users: '/users',
  settings: '/settings',
}

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer' },
  {
    key: 'incidents',
    label: 'Incidents',
    icon: 'fa-exclamation-triangle',
    children: [
      { key: 'incidents-summary', label: 'Summary' },
      { key: 'incidents-incidents', label: 'Incidents' },
      { key: 'incidents-city-alerts', label: 'City Alerts' },
      { key: 'incidents-categories', label: 'Categories' },
    ],
  },
  {
    key: 'news',
    label: 'News',
    icon: 'fa-newspaper-o',
    children: [
      { key: 'news-news', label: 'News' },
      { key: 'news-categories', label: 'Categories' },
    ],
  },
  { key: 'vehicles', label: 'Vehicles', icon: 'fa-car' },
  { key: 'stages', label: 'Stages', icon: 'fa-flag' },
  { key: 'categories', label: 'Categories', icon: 'fa-tags' },
  { key: 'routes', label: 'Routes', icon: 'fa-map-signs' },
  { key: 'reports', label: 'Reports', icon: 'fa-line-chart' },
  { key: 'subscriptions', label: 'Subscriptions', icon: 'fa-credit-card' },
  { key: 'enforcements', label: 'Enforcements', icon: 'fa-shield' },
  { key: 'users', label: 'Users', icon: 'fa-user' },
  { key: 'settings', label: 'Settings', icon: 'fa-cog' },
]

export const incidentPages: DashboardPage[] = [
  'incidents',
  'incidents-summary',
  'incidents-incidents',
  'incidents-city-alerts',
  'incidents-categories',
]

export const newsPages: DashboardPage[] = ['news', 'news-news', 'news-categories']
