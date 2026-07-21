export interface GarageSettings {
  id: string;
  garageName: string;
  address: string;
  phone: string;
  currency: string;       // e.g. "RWF"
  taxRate: number;
  cameraStreamUrl: string;
  cameraLabel: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleIds: string[];
  createdAt: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  clientId: string;
  mileage: number;
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
}

export type JobStatus = 'Pending' | 'In Progress' | 'Waiting Parts' | 'Completed';

export interface JobCard {
  id: string;
  vehicleId: string;
  technicianName: string;
  description: string;
  status: JobStatus;
  partsUsed: { partId: string; quantity: number }[];
  laborCost: number;
  startedAt: string;
  completedAt?: string;
}

export interface Part {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  supplier: string;
}

export type PaymentStatus = 'Paid' | 'Unpaid';

export interface Invoice {
  id: string;
  jobId: string;
  clientId: string;
  lineItems: { description: string; qty: number; unitCost: number }[];
  laborCost: number;
  taxRate: number;
  status: PaymentStatus;
  issuedAt: string;
}

export type ReminderType = 'Oil Change' | 'Full Service' | 'Tyre Rotation' | 'Custom';

export interface ServiceReminder {
  id: string;
  vehicleId: string;
  type: ReminderType;
  dueDate: string;
  notes: string;
  isDone: boolean;
}

export interface UserProfile {
  role: string;
  garageId: string;
  displayName: string;
}

export interface ArchiveRecord {
  id: string;
  archivedAt: string;
  monthLabel: string;
  jobCount: number;
  invoiceCount: number;
  jobs: JobCard[];
  invoices: Invoice[];
}