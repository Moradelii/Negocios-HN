export interface Review {
  id: string;
  businessId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}
