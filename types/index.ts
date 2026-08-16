import type { Timestamp } from "firebase/firestore";

export type UserRole = "SUPER_ADMIN" | "OWNER" | "MANAGER" | "SUPERVISOR" | "WORKER" | "EMPLOYEE" | "CLIENT" | "CUSTOMER";
export type UserStatus = "active" | "suspended";

export interface AppUser {
  uid: string;
  email: string;
  phoneNumber?: string | null; // add | null
  displayName: string;
  photoURL?: string | null; // add | null
  role: UserRole;
  createdAt: Timestamp;
  status: UserStatus;
}

export type AttendanceStatus = "on-time" | "late" | "absent" | "overtime";

export interface Attendance {
  id: string;
  workerId: string;
  timestampIn: Timestamp;
  timestampOut?: Timestamp;
  geoCoordinates: { lat: number; lng: number };
  locationName: string;
  verificationPhotoUrl?: string; // optional now — no upload provider yet
  status: AttendanceStatus;
}

export type OrderPriority = "low" | "medium" | "high" | "urgent";
export type OrderStatus = "pending" | "in-progress" | "completed" | "rejected";

export interface Order {
  id: string;
  assignedWorkerId: string;
  createdBy: string;
  title: string;
  description: string;
  priority: OrderPriority;
  status: OrderStatus;
  dueDate: Timestamp;
  attachmentUrls?: string[]; // optional now

}

export type MessageType = "text" | "image" | "file";

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  type: MessageType;
  createdAt: Timestamp;
  readBy: string[];
}

export interface InventoryItem {
  id: string;
  sku: string;
  title: string;
  description: string;
  quantity: number;
  unitPrice: number;
  category: string;
  imageUrls: string[];
  reorderThreshold: number;
  updatedAt: Timestamp;
}

export type DeliveryStatus = "dispatched" | "in-transit" | "delivered" | "failed";

export interface Delivery {
  id: string;
  orderId: string;
  customerId: string;
  assignedWorkerId: string;
  deliveryAddress: string;
  status: DeliveryStatus;
  proofOfDeliveryUrl?: string; // already optional
  timestamp: Timestamp;
}

export type LedgerEntityType = "CUSTOMER" | "WORKER";
export type TransactionType = "LOAN" | "REPAYMENT" | "CREDIT_PURCHASE";

export interface LedgerTransaction {
  id: string;
  date: Timestamp;
  amount: number;
  type: TransactionType;
  note: string;
  receiptUrl?: string;
  createdBy: string;
}

export interface FinancialLedger {
  id: string;
  entityType: LedgerEntityType;
  entityId: string;
  totalCreditAmount: number;
  paidAmount: number;
  remainingBalance: number;
  transactions: LedgerTransaction[];
}

export interface CompanyEvent {
  id: string;
  title: string;
  description: string;
  eventDate: Timestamp;
  location: string;
  targetRoles: UserRole[];
  createdById: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  coverImageUrl?: string;
  authorId: string;
  publishedAt: Timestamp;
  pinned: boolean;
}

export interface Chat {
  id: string;
  isGroup: boolean;
  participantIds: string[];
  groupName?: string;
  groupPhotoURL?: string;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  createdAt: Timestamp;
}

export interface AppUser {
  uid: string;
  email: string;
  phoneNumber?: string | null;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  createdAt: Timestamp;
  status: UserStatus;
  fcmTokens?: string[]; // add this — device tokens for push delivery
}

export interface AppUser {
  uid: string;
  email: string;
  phoneNumber?: string | null;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  createdAt: Timestamp;
  status: UserStatus;
  fcmTokens?: string[];
  // Signal Protocol public identity — safe to be public, uploaded once per device setup
  signalIdentityKey?: string | null;      // base64
  signalRegistrationId?: number | null;
  signalSignedPreKey?: {
    keyId: number;
    publicKey: string; // base64
    signature: string; // base64
  } | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;        // ciphertext (base64) once encrypted=true
  messageType?: number;    // Signal wire type: 3 = PreKeyWhisperMessage, 1 = WhisperMessage
  encrypted?: boolean;
  type: MessageType;
  createdAt: Timestamp;
  readBy: string[];
}