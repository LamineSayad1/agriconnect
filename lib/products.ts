import { supabase } from './supabaseClient';
import { Product, Order, OrderItem } from '../types/database';

export const productsService = {
  // Récupérer tous les produits
  async getProducts(category?: string) {
    let query = supabase
      .from('products')
      .select(`
        *,
        farmer:profiles(full_name, farm_name, farm_location)
      `)
      .eq('is_available', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as (Product & { farmer: any })[];
  },

  // Récupérer les produits d'un farmer
  async getFarmerProducts(farmerId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Product[];
  },

  // Créer un produit
  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'rating' | 'review_count'>) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  // Mettre à jour un produit
  async updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  // Supprimer un produit
  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export const ordersService = {
  // Récupérer les commandes d'un buyer
  async getBuyerOrders(buyerId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        farmer:profiles(full_name, farm_name, phone),
        order_items(
          *,
          product:products(name, images, unit)
        )
      `)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as (Order & { farmer: any; order_items: (OrderItem & { product: any })[] })[];
  },

  // Récupérer les commandes d'un farmer
  async getFarmerOrders(farmerId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:profiles(full_name, phone),
        order_items(
          *,
          product:products(name, images, unit)
        )
      `)
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as (Order & { buyer: any; order_items: (OrderItem & { product: any })[] })[];
  },

  // Créer une commande
  async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>, items: Omit<OrderItem, 'id' | 'created_at'>[]) {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();

    if (orderError) throw orderError;

    // Ajouter les items de la commande
    const orderItems = items.map(item => ({
      ...item,
      order_id: orderData.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return orderData as Order;
  },

  // Mettre à jour le statut d'une commande
  async updateOrderStatus(id: string, status: Order['status']) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  }
};