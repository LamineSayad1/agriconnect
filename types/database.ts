export type Product = {
  id: string;
  farmer_id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  quantity_available: number;
  images: string[];
  is_available: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  farmer?: Profile; // Jointure
};

export type Order = {
  id: string;
  buyer_id: string;
  farmer_id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address: string;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  order_notes: string;
  created_at: string;
  updated_at: string;
  buyer?: Profile; // Jointure
  farmer?: Profile; // Jointure
  order_items?: OrderItem[]; // Jointure
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  product?: Product; // Jointure
};

export type Review = {
  id: string;
  product_id: string;
  buyer_id: string;
  order_id: string;
  rating: number;
  comment: string;
  created_at: string;
  buyer?: Profile; // Jointure
};

export type Profile = {
  id: string;
  full_name: string;
  user_type: 'farmer' | 'buyer' |'supplier';
  farm_name?: string;
  farm_description?: string;
  farm_location?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};