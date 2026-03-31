export type VehicleRecord = {
  id: string
  registration: string
  makeModel: string
  vehicleType: string
  color: string
  vin: string
  stage: string
  division: string
  operator: string
  phone: string
  status: 'Active' | 'Pending' | 'Suspended'
  paymentStatus: 'Paid' | 'Unpaid'
  permitStatus: 'Valid' | 'Expired'
  createdAt: string
}

export type StageRecord = {
  name: string
  district: string
  county: string
  subcounty: string
  parish: string
  village: string
  stageLead: string
}

export type CategoryRow = {
  name: string
  code: string
  description: string
  vehiclesRegistered: number
}

export type RouteRecord = {
  name: string
  start: string
  end: string
  distanceKm: number
}

export type SubscriptionCategoryRow = {
  category: string
  registered: number
  compliant: number
  revenueCollected: string
  arrears: string
}

export const sampleVehicles: VehicleRecord[] = [
  {
    id: 'veh-1',
    registration: 'UAA 123A',
    makeModel: 'Toyota Hiace',
    vehicleType: 'Minivan',
    color: 'White',
    vin: 'JT1234567890UGANDA1',
    stage: 'Old Taxi Park',
    division: 'Central Division',
    operator: 'John Doe',
    phone: '+256 700 000001',
    status: 'Active',
    paymentStatus: 'Paid',
    permitStatus: 'Valid',
    createdAt: '2026-02-01 09:24',
  },
  {
    id: 'veh-2',
    registration: 'UBF 987C',
    makeModel: 'Kawasaki Boxer',
    vehicleType: 'Motorbike',
    color: 'Red',
    vin: 'KBX987654321UGANDA2',
    stage: 'Kireka',
    division: 'Nakawa Division',
    operator: 'Aisha Namutebi',
    phone: '+256 701 222333',
    status: 'Pending',
    paymentStatus: 'Unpaid',
    permitStatus: 'Expired',
    createdAt: '2026-02-03 14:10',
  },
  {
    id: 'veh-3',
    registration: 'UAP 456M',
    makeModel: 'Coaster Bus',
    vehicleType: 'Bus',
    color: 'Blue / White',
    vin: 'COA456789123UGANDA3',
    stage: 'Nansana',
    division: 'Nansana Municipality',
    operator: 'Galaxy Coaches Ltd',
    phone: '+256 772 555666',
    status: 'Suspended',
    paymentStatus: 'Paid',
    permitStatus: 'Expired',
    createdAt: '2026-01-21 08:05',
  },
]

export const sampleStages: StageRecord[] = [
  {
    name: 'Old Taxi Park',
    district: 'Kampala',
    county: 'Kampala Central',
    subcounty: 'Central Division',
    parish: 'Kisenyi',
    village: 'Old Taxi Park',
    stageLead: 'Timothy Mutesasira (Chairman)',
  },
  {
    name: 'New Taxi Park',
    district: 'Kampala',
    county: 'Kampala Central',
    subcounty: 'Central Division',
    parish: 'Kisenyi',
    village: 'New Taxi Park',
    stageLead: 'John Doe (Secretary)',
  },
  {
    name: 'Nansana Taxi Stage',
    district: 'Wakiso',
    county: 'Busiro East',
    subcounty: 'Nansana Municipality',
    parish: 'Nansana',
    village: 'Nansana Taxi Stage',
    stageLead: 'Sarah Kaggwa (Chairlady)',
  },
]

export const categoryRows: CategoryRow[] = [
  {
    name: 'Motorbike',
    code: 'MOTO',
    description: 'Two-wheelers (boda bodas, delivery bikes)',
    vehiclesRegistered: 324,
  },
  {
    name: 'Bus',
    code: 'BUS',
    description: 'Large capacity buses and coaches',
    vehiclesRegistered: 48,
  },
  {
    name: 'Minivan',
    code: 'MINI',
    description: '14-seater taxis and minivans',
    vehiclesRegistered: 182,
  },
  {
    name: 'Commercial Vehicle',
    code: 'COMM',
    description: 'Light and heavy commercial vehicles',
    vehiclesRegistered: 97,
  },
]

export const sampleRoutes: RouteRecord[] = [
  {
    name: 'Kampala – Entebbe Highway',
    start: 'Clock Tower, Kampala',
    end: 'Entebbe Town',
    distanceKm: 40,
  },
  {
    name: 'Kampala – Mukono',
    start: 'Jinja Road Taxi Park',
    end: 'Mukono Taxi Park',
    distanceKm: 27,
  },
  {
    name: 'Kampala – Nansana',
    start: 'Old Taxi Park',
    end: 'Nansana Taxi Stage',
    distanceKm: 12,
  },
]

export const subscriptionsByCategory: SubscriptionCategoryRow[] = [
  {
    category: 'Motorbike',
    registered: 324,
    compliant: 280,
    revenueCollected: 'UGX 42,000,000',
    arrears: 'UGX 6,500,000',
  },
  {
    category: 'Bus',
    registered: 48,
    compliant: 44,
    revenueCollected: 'UGX 18,200,000',
    arrears: 'UGX 1,100,000',
  },
  {
    category: 'Minivan',
    registered: 182,
    compliant: 160,
    revenueCollected: 'UGX 29,400,000',
    arrears: 'UGX 4,800,000',
  },
  {
    category: 'Commercial Vehicle',
    registered: 97,
    compliant: 79,
    revenueCollected: 'UGX 21,700,000',
    arrears: 'UGX 3,200,000',
  },
]
