import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SupplierHome() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalSales: 0, activeSupplies: 0 });
  const [supplies, setSupplies] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/"); return; }

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setUser({ ...user, ...data });

    const { data: suppliesData } = await supabase.from('supplies').select('*').eq('supplier_id', user.id);
    setSupplies(suppliesData || []);
    setStats(prev => ({ ...prev, activeSupplies: suppliesData?.length || 0 }));
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      console.log("[SupplierHome] Logout clicked. Setting flag...");
      await AsyncStorage.setItem('logging_out', 'true');
      (router as any).replace("/");
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('user_session');
    } catch {
      (router as any).replace("/");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />

      {/* Premium Header Segment */}
      <View style={{ backgroundColor: '#2563eb', paddingTop: 80, paddingHorizontal: 24, paddingBottom: 48, borderBottomRightRadius: 48, borderBottomLeftRadius: 48, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10, zIndex: 10 }}>
        <View className="flex-row justify-between items-start mb-8">
          <View className="flex-1">
            <Text className="text-blue-100 font-black uppercase tracking-[2px] text-[10px] mb-1">Supplier Portal</Text>
            <Text className="text-4xl font-black text-white leading-tight tracking-tighter">
              Hello, {user?.full_name?.split(' ')[0] || 'Supplier'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-blue-500/50 w-12 h-12 rounded-2xl border border-white/20 items-center justify-center shadow-sm"
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Primary Stat Card */}
        <View className="bg-blue-800/20 p-6 rounded-[24px] border border-white/10 flex-row justify-between items-center shadow-inner">
          <View>
            <Text className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Inventory Value</Text>
            <Text className="text-white text-4xl font-black tracking-tighter">$12,450</Text>
          </View>
          <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center">
            <Ionicons name="wallet-outline" size={24} color="white" />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {/* Stats and Actions */}
        <View className="flex-row justify-between mb-10">
          <View className="w-[48%] bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
            <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="cube" size={22} color="#2563eb" />
            </View>
            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Active Supplies</Text>
            <Text className="text-2xl font-black text-gray-900 tracking-tight">{stats.activeSupplies}</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/add-supply" as any)}
            className="w-[48%] bg-blue-600 p-6 rounded-[32px] shadow-lg shadow-blue-200 items-center justify-center active:scale-95 transition-all"
            activeOpacity={0.9}
          >
            <View className="bg-white/20 w-14 h-14 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="add-circle" size={32} color="white" />
            </View>
            <Text className="text-white font-black text-xs uppercase tracking-widest">New Supply</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xl font-black text-gray-900 mb-6 tracking-tight px-1">My Catalogue</Text>

        {supplies.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => router.push({ pathname: "/add-supply", params: { id: item.id } })}
            className="bg-white p-5 rounded-[28px] border border-gray-100 mb-4 flex-row justify-between items-center shadow-sm"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1">
              <View className="bg-blue-50 w-16 h-16 rounded-[20px] items-center justify-center mr-4 shadow-inner">
                <Text className="text-3xl">📦</Text>
              </View>
              <View className="flex-1 pr-4">
                <Text className="font-black text-gray-900 text-lg leading-tight tracking-tight" numberOfLines={1}>{item.name}</Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="layers-outline" size={12} color="#9ca3af" />
                  <Text className="text-gray-400 text-[10px] font-bold ml-1 uppercase">Stock: {item.stock}</Text>
                </View>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-blue-700 font-black text-2xl tracking-tighter">${item.price}</Text>
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mt-1.5 border border-blue-100">
                <Ionicons name="chevron-forward" size={16} color="#2563eb" />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {supplies.length === 0 && (
          <View className="py-12 items-center bg-white rounded-3xl border border-dashed border-gray-200">
            <View className="w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-4">
              <Ionicons name="file-tray-outline" size={30} color="#9ca3af" />
            </View>
            <Text className="text-gray-400 font-medium">Your inventory is empty.</Text>
            <TouchableOpacity onPress={() => router.push("/add-supply" as any)}>
              <Text className="text-blue-600 font-bold mt-2">Add your first item</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
