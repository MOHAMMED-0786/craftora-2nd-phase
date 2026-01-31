export type UserRole = 'buyer' | 'seller' | 'admin';

export type ProductType = 'food' | 'craft';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export type PaymentMethod = 'online' | 'cash_on_delivery';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface User {
  id: string;
  userId: string;
  email: string;
  displayName?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  locationCity?: string;
  locationArea?: string;
  locationAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Seller {
  id: string;
  userId: string;
  businessName?: string;
  businessType?: ProductType;
  hygieneDeclaration?: string;
  verificationStatus: VerificationStatus;
  verificationDocuments?: string;
  ratingAverage: number;
  totalReviews: number;
  totalOrders: number;
  totalEarnings: number;
  isActive: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: ProductType;
  icon?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  userId: string;
  sellerId: string;
  title: string;
  description?: string;
  categoryId?: string;
  price: number;
  images?: string;
  ingredients?: string;
  handmadeProcess?: string;
  isAvailable: string;
  stockQuantity: number;
  ratingAverage: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  sellerId: string;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  userId: string;
  orderId: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  orderId: string;
  productId: string;
  sellerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// Extended types with relations
export interface ProductWithSeller extends Product {
  seller?: Seller;
  category?: Category;
}

export interface CartItemWithProduct extends CartItem {
  product?: Product;
}

export interface OrderWithItems extends Order {
  items?: OrderItem[];
  seller?: Seller;
}

export interface ReviewWithUser extends Review {
  user?: User;
}
