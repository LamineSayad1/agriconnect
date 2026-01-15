import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUPPLY_CATEGORIES = [
    { id: 'seeds', name: 'Seeds', emoji: '🌱' },
    { id: 'tools', name: 'Tools', emoji: '🚜' },
    { id: 'fertilizer', name: 'Fertilizer', emoji: '🧪' },
    { id: 'feed', name: 'Livestock Feed', emoji: '🌾' },
];

export default function SupplyMarket() {
    const router = useRouter();
    const { q } = useLocalSearchParams<{ q?: string }>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [supplies, setSupplies] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState(q || "");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const fetchSupplies = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('supplies')
                .select(`
                    *,
                    supplier:profiles(full_name, location)
                `)
                .order('created_at', { ascending: false });

            if (selectedCategory) {
                query = query.eq('category', selectedCategory);
            }

            if (searchQuery) {
                query = query.ilike('name', `%${searchQuery}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setSupplies(data || []);
        } catch (error) {
            console.error("Error fetching supplies:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory, searchQuery]);

    useEffect(() => {
        if (q) setSearchQuery(q);
    }, [q]);

    useEffect(() => {
        fetchSupplies();
    }, [selectedCategory, searchQuery, fetchSupplies]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSupplies();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <StatusBar style="dark" />

            {/* Premium Header Segment */}
            <View style={{ backgroundColor: 'white', paddingTop: 80, paddingHorizontal: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                <View className="flex-row items-center mb-6">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mr-5 w-12 h-12 bg-emerald-50 rounded-2xl items-center justify-center border border-emerald-100"
                    >
                        <Ionicons name="arrow-back" size={24} color="#065f46" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] mb-1">Logistics Hub</Text>
                        <Text className="text-4xl font-black text-emerald-900 tracking-tighter leading-tight">Supply Market</Text>
                    </View>
                </View>
            </View>

            {/* Search and Filters */}
            <View style={{ paddingHorizontal: 24, paddingVertical: 24, backgroundColor: 'white' }}>
                <View className="flex-row items-center bg-gray-50 px-5 py-4 rounded-[28px] border border-gray-100 shadow-inner mb-6">
                    <Ionicons name="search" size={20} color="#10b981" />
                    <TextInput
                        className="flex-1 ml-3 text-gray-900 font-bold text-base"
                        placeholder="Search tools, seeds, equipment..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                {/* Categories */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="overflow-visible"
                    contentContainerStyle={{ paddingBottom: 12 }}
                >
                    <TouchableOpacity
                        onPress={() => setSelectedCategory(null)}
                        className={`px-6 py-3.5 rounded-[20px] mr-3 shadow-sm ${!selectedCategory ? 'bg-emerald-600 border border-emerald-700' : 'bg-white border border-gray-100'}`}
                    >
                        <Text className={`font-black text-[10px] uppercase tracking-widest ${!selectedCategory ? 'text-white' : 'text-gray-400'}`}>All Supplies</Text>
                    </TouchableOpacity>
                    {SUPPLY_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            className={`px-6 py-3.5 rounded-[20px] mr-3 flex-row items-center shadow-sm ${selectedCategory === cat.id ? 'bg-emerald-600 border border-emerald-700' : 'bg-white border border-gray-100'}`}
                        >
                            <Text className="mr-2 text-lg">{cat.emoji}</Text>
                            <Text className={`font-black text-[10px] uppercase tracking-widest ${selectedCategory === cat.id ? 'text-white' : 'text-gray-400'}`}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#10b981" />
                </View>
            ) : (
                <FlatList
                    data={supplies}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: "/supply-details", params: { id: item.id } })}
                            className="bg-white p-6 rounded-[40px] mb-8 shadow-sm border border-gray-100 flex-row items-center"
                        >
                            <View className="w-24 h-24 bg-emerald-50 rounded-3xl items-center justify-center mr-6 shadow-inner overflow-hidden">
                                {item.image_url ? (
                                    <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
                                ) : (
                                    <View className="items-center justify-center">
                                        <Text className="text-5xl">
                                            {SUPPLY_CATEGORIES.find(c => c.id === item.category)?.emoji || "📦"}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center mb-1.5">
                                    <View className="bg-emerald-100 px-2 py-0.5 rounded-full mr-2">
                                        <Text className="text-[8px] font-black text-emerald-800 uppercase tracking-widest">{item.category}</Text>
                                    </View>
                                </View>
                                <Text className="font-black text-gray-900 text-2xl mb-1 tracking-tighter" numberOfLines={1}>{item.name}</Text>
                                <View className="flex-row items-center mb-4">
                                    <Ionicons name="business-outline" size={10} color="#9ca3af" />
                                    <Text className="text-gray-400 text-[10px] font-black ml-1 uppercase tracking-widest" numberOfLines={1}>
                                        {item.supplier?.full_name}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between items-center mt-2">
                                    <View>
                                        <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest">Price</Text>
                                        <Text className="text-emerald-700 font-black text-2xl tracking-tighter">${item.price}</Text>
                                    </View>
                                    <View className="w-10 h-10 rounded-2xl bg-emerald-600 items-center justify-center shadow-lg shadow-emerald-200">
                                        <Ionicons name="chevron-forward" size={20} color="white" />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View className="py-20 items-center">
                            <Ionicons name="cube-outline" size={60} color="#d1d5db" />
                            <Text className="text-gray-400 font-bold mt-4">No supplies found matching your criteria.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
