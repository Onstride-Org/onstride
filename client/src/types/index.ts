// User types
export type AccountType = 'owner' | 'manager' | 'boarder' | 'groomer' | 'admin' | 'trainer' | 'vendor';
export type Permission = 'userManagement' | 'horseManagement' | 'barnManagement' | 'generateInvoices';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  phoneNumber?: string;
  accountType: AccountType;
  permissions: Permission[];
  barnId?: string;
  emailVerified: boolean;
  finishedRegistration: boolean;
}

export interface UserBarnRole {
  id: string;
  name: string;
  role: AccountType;
  isPrimary: boolean;
  permissions: Permission[];
}

// Barn types
export interface Barn {
  id: string;
  name: string;
  ownerId: string;
  setup?: BarnSetup;
  horseCount?: number;
  userCount?: number;
  role?: AccountType;
  isPrimary?: boolean;
}

export interface BarnSetup {
  shape: 'circle' | 'lShape' | 'aisles';
  stalls: number;
  stallsPerAisle?: number;
  verticalStalls?: number;
  horizontalStalls?: number;
}

// Horse types
export interface Horse {
  id: string;
  barnId: string;
  name: string;
  age?: number;
  birthday?: string;
  breed?: LabelValue;
  sexStatus?: LabelValue;
  color?: string;
  status: 'active' | 'inactive';
  boarderId?: string;
  boarder?: { name: string; email: string };
  usefNumber?: string;
  feiNumber?: string;
  registeredName?: string;
  sireName?: string;
  damName?: string;
  isStud?: boolean;
  isBroodmare?: boolean;
  geneticTests?: GeneticTest[];
  documents?: HorseDocument[];
  strideNumber?: string;
  rideStats?: RideStats;
}

export interface LabelValue {
  value: string;
  label: string;
}

export interface GeneticTest {
  id: string;
  testName: string;
  result: string;
  testDate?: string;
  laboratory?: string;
  notes?: string;
}

export interface HorseDocument {
  id: string;
  type: string;
  name: string;
  fileUrl: string;
  expirationDate?: string;
  uploadedAt: string;
}

export interface RideStats {
  totalRides: number;
  totalMinutes: number;
  ridesThisMonth: number;
  minutesThisMonth: number;
  ridesThisWeek: number;
  minutesThisWeek: number;
}

// Invoice types
export type InvoiceStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
export type PaymentMethod = 'card' | 'ach' | 'cash' | 'check' | 'other';
export type ChargeType = 'board' | 'lesson' | 'training' | 'farrier' | 'vet' | 'feed' | 'supplies' | 'service' | 'other';

export interface Invoice {
  id: string;
  barnId: string;
  boarderId: string;
  boarder?: { name: string; email: string };
  horseId?: string;
  horse?: { name: string };
  charges: InvoiceCharge[];
  dueDate: string;
  status: InvoiceStatus;
  method?: PaymentMethod;
  paymentBreakdown?: PaymentBreakdown;
  subtotal: number;
  createdAt: string;
}

export interface InvoiceCharge {
  id?: string;
  description: string;
  amount: number;
  quantity: number;
  type: ChargeType;
}

export interface PaymentBreakdown {
  subtotal: number;
  stripeFee: number;
  platformFee: number;
  total: number;
}

// Task types
export type TaskStatus = 'notStarted' | 'completed' | 'overdue';

export interface Task {
  id: string;
  barnId: string;
  name: string;
  description?: string;
  dueDate: string;
  status: TaskStatus;
  horses: Array<{ id: string; name: string }>;
  assignees: Array<{ id: string; name: string; accountType: string }>;
  sendReminder: boolean;
  createdAt: string;
}

// Lesson types
export type LessonType = 'privateSingle' | 'privatePackage' | 'groupLesson' | 'training' | 'assessment' | 'other';
export type LessonStatus = 'requested' | 'approved' | 'rejected' | 'countered' | 'cancelled' | 'completed';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface Lesson {
  id: string;
  barnId: string;
  trainerId: string;
  trainer?: { name: string; email: string };
  clientId: string;
  client?: { name: string; email: string };
  horseId?: string;
  horse?: { name: string };
  scheduledDate: string;
  durationMinutes: number;
  price: number;
  type: LessonType;
  status: LessonStatus;
  location?: string;
  notes?: string;
  recurrenceType: RecurrenceType;
}

// Ride Log types
export type RideType = 'lesson' | 'training' | 'trail' | 'lunging' | 'groundwork' | 'competition' | 'other';

export interface RideLog {
  id: string;
  horseId: string;
  horse?: { name: string };
  barnId: string;
  date: string;
  type: RideType;
  durationMinutes: number;
  riderId?: string;
  rider?: { name: string };
  riderName?: string;
  notes?: string;
}

// Vendor types
export type VendorType = 'vet' | 'farrier' | 'dentist' | 'bodyworker' | 'trainer' | 'supplier' | 'transport' | 'photographer' | 'other';
export type AppointmentStatus = 'requested' | 'confirmed' | 'inProgress' | 'completed' | 'cancelled' | 'noShow';

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  primaryType: VendorType;
  additionalTypes?: VendorType[];
  description?: string;
  businessEmail?: string;
  businessPhone?: string;
  city?: string;
  state?: string;
  rating: number;
  reviewCount: number;
  acceptingNewClients: boolean;
  emergencyAvailable: boolean;
}

export interface VendorAppointment {
  id: string;
  vendorId: string;
  vendor?: VendorProfile;
  barnId: string;
  horseId?: string;
  horseName?: string;
  scheduledDate: string;
  durationMinutes: number;
  status: AppointmentStatus;
  type: string;
  price?: number;
  notes?: string;
}

// Subscription types
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'pastDue' | 'canceled' | 'expired';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  maxHorses: number;
  maxUsers: number;
  maxLessonsPerMonth: number;
  maxBarns: number;
  hasBilling: boolean;
  hasFullBilling: boolean;
  hasAiFeatures: boolean;
  hasMultiBarn: boolean;
  hasBranding: boolean;
  hasApiAccess: boolean;
  isPopular: boolean;
}

export interface BarnSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingInterval: 'monthly' | 'yearly';
  currentPeriodEnd?: string;
  currentHorseCount: number;
  currentUserCount: number;
  currentMonthLessonCount: number;
}

// Notification types
export interface Notification {
  id: string;
  type: 'task' | 'invoice' | 'lesson' | 'rideLog' | 'system' | 'vendor' | 'general';
  title: string;
  body?: string;
  action?: string;
  isRead: boolean;
  createdAt: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}
