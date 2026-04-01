export type DashboardPage =
  | 'dashboard'
  | 'incidents'
  | 'incidents-summary'
  | 'incidents-incidents'
  | 'incidents-city-alerts'
  | 'city-alerts'
  | 'incidents-categories'
  | 'news'
  | 'news-news'
  | 'news-categories'
  | 'mobility'
  | 'vehicles'
  | 'stages'
  | 'categories'
  | 'routes'
  | 'reports'
  | 'revenue-assurance'
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
  'city-alerts': '/city-alerts',
  'incidents-categories': '/incidents/categories',
  news: '/news',
  'news-news': '/news/news',
  'news-categories': '/news/categories',
  mobility: '/mobility',
  vehicles: '/vehicles',
  stages: '/stages',
  categories: '/categories',
  routes: '/routes',
  reports: '/reports',
  'revenue-assurance': '/revenue-assurance',
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
      { key: 'incidents-categories', label: 'Categories' },
    ],
  },
  { key: 'city-alerts', label: 'City Alerts', icon: 'fa-bullhorn' },
  {
    key: 'news',
    label: 'News',
    icon: 'fa-newspaper-o',
    children: [
      { key: 'news-news', label: 'News' },
      { key: 'news-categories', label: 'Categories' },
    ],
  },
  {
    key: 'mobility',
    label: 'Mobility',
    icon: 'fa-road',
    children: [
      { key: 'vehicles', label: 'Vehicles' },
      { key: 'categories', label: 'Categories' },
      { key: 'stages', label: 'Stages' },
      { key: 'routes', label: 'Routes' },
    ],
  },
  {
    key: 'revenue-assurance',
    label: 'Revenue Assurance',
    icon: 'fa-shield',
    children: [
      { key: 'subscriptions', label: 'Subscriptions' },
      { key: 'enforcements', label: 'Enforcements' },
    ],
  },
  { key: 'reports', label: 'Reports', icon: 'fa-line-chart' },
  { key: 'users', label: 'Users', icon: 'fa-user' },
  { key: 'settings', label: 'Settings', icon: 'fa-cog' },
]

export const incidentPages: DashboardPage[] = [
  'incidents',
  'incidents-summary',
  'incidents-incidents',
  'incidents-categories',
]

export const newsPages: DashboardPage[] = ['news', 'news-news', 'news-categories']

export const mobilityPages: DashboardPage[] = [
  'mobility',
  'vehicles',
  'categories',
  'stages',
  'routes',
]

export const revenueAssurancePages: DashboardPage[] = [
  'revenue-assurance',
  'subscriptions',
  'enforcements',
]
