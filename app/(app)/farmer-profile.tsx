import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FarmerProfile() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [farmer, setFarmer] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFarmerData = useCallback(async () => {
        try {
            // 1. Get Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();
            setFarmer(profile);

            // 2. Get Products
            const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .eq('farmer_id', id)
                .eq('is_available', true);
            setProducts(productsData || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchFarmerData();
        }
    }, [id, fetchFarmerData]);

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#10b981" />
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <StatusBar style="dark" />

            {/* Header */}
            <SafeAreaView style={{ backgroundColor: 'white', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                <View className="px-6 py-4 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mr-4 bg-gray-50 p-2 rounded-full"
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">Farmer Store</Text>
                </View>
            </SafeAreaView>

            <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View className="bg-emerald-600 px-6 py-10 mb-8 rounded-b-[48px] shadow-lg mx-2 mt-2">
                        <View className="flex-row items-center mb-8">
                            <View className="w-24 h-24 bg-white rounded-full items-center justify-center mr-5 border-4 border-emerald-500 shadow-xl overflow-hidden">
                                <Text className="text-5xl">👨‍🌾</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-3xl font-black text-white leading-tight mb-2 tracking-tighter">{farmer?.full_name}</Text>
                                <View className="flex-row items-center bg-emerald-700/50 self-start px-4 py-1.5 rounded-full">
                                    <Ionicons name="location-outline" size={14} color="white" />
                                    <Text className="text-white text-[10px] font-black ml-1 uppercase tracking-widest">{farmer?.location || 'Local Farm'}</Text>
                                </View>
                            </View>
                        </View>
                        {farmer?.farm_description && (
                            <View className="bg-emerald-700/30 p-5 rounded-[24px] border border-white/10">
                                <Text className="text-emerald-50 leading-6 font-bold italic tracking-tight text-base">
                                    &quot;{farmer.farm_description}&quot;
                                </Text>
                            </View>
                        )}
                    </View>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className="bg-white mx-6 mb-6 p-5 rounded-[32px] border border-gray-100 shadow-sm flex-row items-center"
                        onPress={() => router.push({ pathname: "/product-details", params: { id: item.id } })}
                        activeOpacity={0.8}
                    >
                        <View className="w-20 h-20 bg-gray-50 rounded-2xl items-center justify-center mr-5 border border-gray-100 shadow-inner">
                            {item.image_url ? (
                                <Image source={{ uri: item.image_url }} className="w-full h-full rounded-2xl" />
                            ) : (
                                <Text className="text-4xl">📦</Text>
                            )}
                        </View>
                        <View className="flex-1 h-20 justify-center">
                            <View>
                                <Text className="font-black text-gray-900 text-xl leading-tight mb-1 tracking-tighter" numberOfLines={1}>{item.name}</Text>
                                <View className="flex-row items-center">
                                    <Ionicons name="pricetag-outline" size={12} color="#9ca3af" />
                                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest ml-1">{item.category}</Text>
                                </View>
                            </View>
                            <View className="flex-row justify-between items-end mt-2">
                                <Text className="text-emerald-600 font-black text-2xl tracking-tighter">${item.price}</Text>
                                <View className="bg-emerald-50 p-2.5 rounded-full shadow-sm shadow-emerald-100">
                                    <Ionicons name="add" size={24} color="#10b981" />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    <View className="p-10 items-center justify-center mt-10">
                        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                            <Ionicons name="leaf-outline" size={40} color="#9ca3af" />
                        </View>
                        <Text className="text-gray-400 font-medium text-center">No products currently listed.</Text>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
            />
        </View>
    );

}
