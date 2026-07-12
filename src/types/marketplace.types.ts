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
