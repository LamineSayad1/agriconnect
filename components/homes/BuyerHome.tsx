import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function BuyerHome() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);

  const categories = useMemo(
    () => [
      { name: 'Fruits', slug: 'fruits', icon: '🍎' },
      { name: 'Vegetables', slug: 'vegetables', icon: '🥦' },
      { name: 'Dairy', slug: 'dairy', icon: '🥛' },
      { name: 'Grains', slug: 'grains', icon: '🌾' },
      { name: 'Meat', slug: 'meat', icon: '🥩' },
    ],
    []
  );

  const getUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return setUser(null);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    setUser({ ...data.user, ...profile });
  }, []);

  const updateCartCount = useCallback(async () => {
    const cartStr = await AsyncStorage.getItem('cart');
    if (!cartStr) return setCartCount(0);

    const cart = JSON.parse(cartStr);
    const total = cart.reduce(
      (sum: number, item: any) => sum + (item.quantity || 0),
      0
    );
    setCartCount(total);
  }, []);

  const addToCart = useCallback(
    async (product: any) => {
      const cartStr = await AsyncStorage.getItem('cart');
      const cart = cartStr ? JSON.parse(cartStr) : [];

      const index = cart.findIndex((i: any) => i.id === product.id);
      if (index >= 0) cart[index].quantity += 1;
      else cart.push({ ...product, quantity: 1 });

      await AsyncStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
    },
    [updateCartCount]
  );

  const fetchProducts = useCallback(async () => {
    let query = supabase
      .from('products')
      .select('*')
      .eq('target_audience', 'buyer')
      .gt('stock', 0);

    if (selectedCategory) {
      query = query.eq('category', selectedCategory);
    }

    const { data } = await query;
    setProducts(data || []);
  }, [selectedCategory]);

  useEffect(() => {
    getUser();
    fetchProducts();
  }, [getUser, fetchProducts]);

  useFocusEffect(
    useCallback(() => {
      updateCartCount();
    }, [updateCartCount])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), getUser(), updateCartCount()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.multiRemove(['user_session', 'cart', 'logging_out']);
      router.replace("/(auth)/login");
    } catch (error) {
      router.replace("/(auth)/login");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />

      {/* Header Segment */}
      <View className="bg-amber-600 pt-20 pb-10 px-6 rounded-b-[40px] shadow-lg z-10 mb-8">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-amber-100 text-[10px] font-black uppercase tracking-[2px] mb-1">Buyer Marketplace</Text>
            <Text className="text-4xl font-black text-white tracking-tighter leading-tight">
              Hello, {user?.full_name?.split(' ')[0] || 'Guest'}
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/orders" as any)}
              className="bg-white/20 w-12 h-12 rounded-2xl items-center justify-center border border-white/10"
            >
              <View className="relative">
                <Ionicons name="cart-outline" size={24} color="white" />
                {cartCount > 0 && (
                  <View className="absolute -top-2 -right-2 bg-white px-1.5 py-0.5 rounded-full border border-amber-600">
                    <Text className="text-amber-700 text-[10px] font-black">{cartCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              className="bg-white/10 w-12 h-12 rounded-2xl items-center justify-center border border-white/5"
            >
              <Ionicons name="log-out-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d97706" />}
      >
        {/* Categories */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-5 px-6">Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="overflow-visible"
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.slug}
                onPress={() => setSelectedCategory((prev) => (prev === cat.slug ? null : cat.slug))}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  marginRight: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderColor: selectedCategory === cat.slug ? "#d97706" : "#f3f4f6",
                  backgroundColor: selectedCategory === cat.slug ? "#d97706" : "#ffffff",
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 8 }}>{cat.icon}</Text>
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 14,
                    color: selectedCategory === cat.slug ? "#ffffff" : "#374151"
                  }}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Products Grid */}
        <View className="px-6 mt-2">
          <Text className="text-xl font-bold text-gray-900 mb-6">Fresh Arrivals</Text>
          <View className="flex-row flex-wrap justify-between">
            {products.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => router.push({ pathname: "/product-details", params: { id: p.id } })}
                activeOpacity={0.8}
                className="w-[48%] bg-white rounded-3xl p-4 mb-4 border border-gray-100 shadow-sm"
              >
                <View className="w-full h-32 bg-gray-50 rounded-2xl items-center justify-center mb-3 overflow-hidden">
                  {p.image_url ? (
                    <Image
                      source={{ uri: p.image_url }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-[50px]">📦</Text>
                  )}
                </View>

                <Text className="font-bold text-gray-900 text-lg mb-1" numberOfLines={1}>
                  {p.name}
                </Text>

                <Text className="text-gray-500 text-xs mb-3 font-medium uppercase tracking-wide">
                  {p.category || 'General'}
                </Text>

                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Price</Text>
                    <Text className="text-amber-700 font-black text-2xl tracking-tighter">${p.price}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => addToCart(p)}
                    className="bg-amber-600 w-12 h-12 rounded-2xl items-center justify-center shadow-lg shadow-amber-200 active:scale-90"
                  >
                    <Ionicons name="add" size={28} color="white" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {products.length === 0 && (
          <View className="px-6 py-10 items-center">
            <Ionicons name="cart-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-400 mt-4 text-center font-medium">No products available at the moment.{'\n'}Please check back later.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
