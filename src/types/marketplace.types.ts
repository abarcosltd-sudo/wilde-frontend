export type OrderStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed';
export type ExportFormat = 'pdf' | 'docx' | 'epub';

export interface GhostwriterListing {
  id: string;
  userId: string;
  title: string;
  description: string;
  specialties: string[];
  pricePerProject: number;
  currency: 'NGN' | 'USD';
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId?: string;
  workId?: string;
  amount: number;
  currency: 'NGN' | 'USD';
  status: OrderStatus;
  paymentRef?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * An in-app approach from one creative to another. Replaces the old `mailto:`
 * Hire links, which only worked by exposing the recipient's email address.
 */
export interface HireRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  /** What they're being approached about — a service listing or their profile. */
  subject: string;
  message: string;
  createdAt: string;
}

export interface Review {
  id: string;
  creatorId: string;
  reviewerId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Job {
  id: string;
  posterId: string;
  title: string;
  description: string;
  neededRole: string;
  budget: number;
  currency: 'NGN' | 'USD';
  deadline?: string;
  applicantCount: number;
  createdAt: string;
}
