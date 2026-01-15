import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// -------------------- Types --------------------
interface User {
  id: string;
  full_name: string;
  email?: string;
  farm_name?: string;
  phone?: string;
  avatar_url?: string;
}

interface FarmerStats {
  productsListed: number;
  ordersToday: number;
  totalRevenue: number;
  farmRating: number;
  pendingOrders: number;
  lowStockItems: number;
}

type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  product: string;
  buyer: string;
  status: OrderStatus;
  amount: string;
  date: string;
  quantity?: number;
  productId?: string;
  imageUrl?: string;
}

// -------------------- Component --------------------
export default function FarmerHome() {
  const router = useRouter();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmerStats, setFarmerStats] = useState<FarmerStats>({
    productsListed: 0,
    ordersToday: 0,
    totalRevenue: 0,
    farmRating: 0,
    pendingOrders: 0,
    lowStockItems: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const initializeUser = useCallback(async () => {
    setLoading(true);
    try {
      const sessionData = await AsyncStorage.getItem('user_session');
      let userData = sessionData ? JSON.parse(sessionData) : null;

      if (!userData) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          userData = { id: authUser.id, email: authUser.email };
        }
      }

      if (!userData) throw new Error('No session found');
      setUser(userData);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userData.id).maybeSingle();
      if (profile) setUser(prev => ({ ...prev, ...profile } as User));

    } catch (error) {
      console.log("[FarmerHome] Auth error:", error);
      router.replace("/(auth)/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadFarmerData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: products } = await supabase.from('products').select('id, stock').eq('farmer_id', user.id);

      const { data: salesItems } = await supabase
        .from('order_items')
        .select(`
          quantity, 
          price, 
          order:orders!inner(id, status, created_at), 
          product:products!inner(id, farmer_id)
        `)
        .eq('product.farmer_id', user.id);

      const allItems: any[] = salesItems || [];
      const getOrder = (item: any) => Array.isArray(item.order) ? item.order[0] : item.order;

      const ordersToday = allItems.filter(i => {
        const order = getOrder(i);
        return order?.created_at && order.created_at >= today;
      }).length;

      const pendingOrders = allItems.filter(i => {
        const order = getOrder(i);
        return order?.status === 'pending';
      }).length;

      const totalRevenue = allItems
        .filter(i => getOrder(i)?.status === 'delivered')
        .reduce((sum, i) => sum + (i.quantity * (i.price || 0)), 0);

      const { data: reviewData } = await supabase.from('reviews').select('rating, product:products!inner(farmer_id)').eq('product.farmer_id', user.id);
      const avgRating = reviewData && reviewData.length ? reviewData.reduce((a, b) => a + (b.rating || 0), 0) / reviewData.length : 0;

      setFarmerStats({
        productsListed: products?.length || 0,
        ordersToday,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        farmRating: Math.round(avgRating * 10) / 10,
        pendingOrders,
        lowStockItems: products?.filter((p: any) => (p.stock || 0) < 10).length || 0
      });

      // Orders
      const { data: orderData } = await supabase.from('order_items')
        .select(`
          id, 
          quantity, 
          price, 
          order:orders!inner(id, status, created_at, buyer_id), 
          product:products!inner(id, name, farmer_id, image_url)
        `)
        .eq('product.farmer_id', user.id)
        .order('created_at', { foreignTable: 'order', ascending: false })
        .limit(5);

      const orders: Order[] = (orderData || []).map((item: any) => {
        const order = Array.isArray(item.order) ? item.order[0] : item.order;
        const product = Array.isArray(item.product) ? item.product[0] : item.product;

        return {
          id: order?.id || item.id,
          productId: product?.id,
          product: product?.name || 'Unknown Product',
          imageUrl: product?.image_url,
          buyer: 'Customer',
          status: order?.status || 'pending',
          amount: (item.quantity * (item.price || 0)).toFixed(2),
          date: order?.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
          quantity: item.quantity
        };
      });
      setRecentOrders(orders);

    } catch (e) {
      console.error('[FarmerHome] Data load error:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  useEffect(() => {
    if (user?.id) {
      loadFarmerData();
    }
  }, [user?.id, loadFarmerData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFarmerData();
    setRefreshing(false);
  }, [loadFarmerData]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.setItem('logging_out', 'true');
      (router as any).replace("/(auth)/login");
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('user_session');
    } catch {
      (router as any).replace("/(auth)/login");
    }
  };

  if (loading) return <View className="flex-1 bg-white justify-center items-center"><ActivityIndicator size="large" color="#10b981" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar style="light" />

      {/* Modern Header Segment (Emerald Theme) */}
      <View style={{ backgroundColor: '#10b981', paddingTop: 80, paddingBottom: 48, paddingHorizontal: 24, borderBottomRightRadius: 48, borderBottomLeftRadius: 48, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10, zIndex: 10 }}>
        <View className="flex-row justify-between items-start mb-8">
          <View>
            <Text className="text-emerald-100 font-black uppercase tracking-[2px] text-[10px] mb-1">Producer Portal</Text>
            <Text className="text-4xl font-black text-white leading-tight tracking-tighter">
              Hello, {user?.full_name?.split(' ')[0] || 'Farmer'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-emerald-500/50 w-12 h-12 rounded-2xl border border-white/20 items-center justify-center shadow-sm"
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Primary Stat Card */}
        <View className="bg-emerald-800/20 p-6 rounded-[24px] border border-white/10 flex-row justify-between items-center shadow-inner">
          <View>
            <Text className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">Total Balance</Text>
            <Text className="text-white text-4xl font-black tracking-tighter">
              ${farmerStats.totalRevenue.toLocaleString()}
            </Text>
          </View>
          <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center">
            <Ionicons name="stats-chart" size={24} color="white" />
          </View>
        </View>

      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {/* Secondary Stats Grid */}
        <View className="flex-row justify-between mb-8">
          <View className="w-[48%] bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
            <View className="w-12 h-12 bg-emerald-50 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="time" size={22} color="#10b981" />
            </View>
            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Pending Orders</Text>
            <Text className="text-2xl font-black text-gray-900 tracking-tight">{farmerStats.pendingOrders}</Text>
          </View>
          <View className="w-[48%] bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
            <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="cube" size={22} color="#2563eb" />
            </View>
            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">My Products</Text>
            <Text className="text-2xl font-black text-gray-900 tracking-tight">{farmerStats.productsListed}</Text>
          </View>
        </View>

        {/* Quick Actions Segment */}
        <Text className="text-xl font-black text-gray-900 mb-6 tracking-tight px-1">Farmer Hub</Text>
        <View className="flex-row justify-between mb-12">
          <TouchableOpacity
            onPress={() => router.push("/add-product")}
            style={{ width: '48%', backgroundColor: 'white', padding: 20, borderRadius: 32, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
            activeOpacity={0.8}
          >
            <View className="bg-emerald-100/50 w-14 h-14 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="add-circle" size={28} color="#10b981" />
            </View>
            <Text className="text-xs font-black text-gray-900 uppercase tracking-widest">New Crop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/my-products")}
            style={{ width: '48%', backgroundColor: 'white', padding: 20, borderRadius: 32, borderWidth: 1, borderColor: '#f3f4f6', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
            activeOpacity={0.8}
          >
            <View className="bg-emerald-100/50 w-14 h-14 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="leaf" size={28} color="#059669" />
            </View>
            <Text className="text-xs font-black text-gray-900 uppercase tracking-widest">Inventory</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Sales Segment */}
        <View className="flex-row justify-between items-center mb-6 px-1">
          <Text className="text-xl font-black text-gray-900 tracking-tight">Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/orders" as any)}>
            <Text className="text-emerald-600 font-black text-xs uppercase tracking-widest">See All</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <View style={{ backgroundColor: 'white', padding: 40, borderRadius: 32, borderWidth: 2, borderColor: '#f9fafb', alignItems: 'center', borderStyle: 'dashed' }}>
            <View className="w-16 h-16 bg-gray-50 rounded-[20px] items-center justify-center mb-4">
              <Ionicons name="receipt-outline" size={32} color="#d1d5db" />
            </View>
            <Text className="text-gray-400 font-bold">Waiting for your first sale...</Text>
          </View>
        ) : (
          <View className="space-y-4">
            {recentOrders.map(order => (
              <TouchableOpacity
                key={order.id}
                onPress={() => order.productId && router.push({ pathname: "/product-details", params: { id: order.productId } })}
                className="bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm flex-row items-center mb-4"
              >
                <View className="w-16 h-16 bg-emerald-50 rounded-2xl items-center justify-center mr-4 overflow-hidden shadow-inner">
                  {order.imageUrl ? (
                    <Image
                      source={{ uri: order.imageUrl }}
                      className="w-full h-full"
                    />
                  ) : (
                    <Text className="text-3xl">🧺</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-black text-gray-900 text-lg tracking-tight" numberOfLines={1}>{order.product}</Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                    <Text className="text-gray-400 text-[10px] font-bold ml-1 uppercase">{order.date}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="font-black text-emerald-700 text-xl tracking-tighter">${order.amount}</Text>
                  <View className={`px-3 py-1 rounded-xl mt-1.5 ${order.status === 'pending' ? 'bg-emerald-100' : 'bg-green-100'}`}>
                    <Text className={`text-[9px] font-black uppercase tracking-widest ${order.status === 'pending' ? 'text-emerald-700' : 'text-green-700'}`}>
                      {order.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View >
  );
}
