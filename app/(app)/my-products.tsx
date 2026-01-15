import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyProducts() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('farmer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProducts();
        setRefreshing(false);
    };

    const handleEdit = (id: string) => {
        router.push({ pathname: "/add-product", params: { id } });
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Product",
            "Are you sure you want to delete this product? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase.from('products').delete().eq('id', id);
                        if (error) {
                            Alert.alert("Error", error.message);
                        } else {
                            Alert.alert("Success", "Product deleted");
                            loadProducts();
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#10b981" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <StatusBar style="dark" />

            {/* Header */}
            <View className="px-6 py-4 bg-white border-b border-gray-200 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-gray-100 rounded-full">
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-gray-900">My Inventory</Text>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
            >
                {products.length === 0 ? (
                    <View className="items-center justify-center mt-20">
                        <Text className="text-gray-400 text-lg mb-4">No products yet.</Text>
                        <TouchableOpacity
                            onPress={() => router.push("/add-product")}
                            className="bg-emerald-600 px-8 py-4 rounded-2xl shadow-lg shadow-emerald-200"
                        >
                            <Text className="text-white font-black uppercase tracking-widest">Add First Product</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    products.map((product) => (
                        <View key={product.id} className="bg-white p-5 rounded-[28px] mb-4 shadow-sm border border-gray-100">
                            <View className="flex-row justify-between items-start mb-3">
                                <View className="flex-1">
                                    <Text className="text-xl font-black text-gray-900 tracking-tight">{product.name}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Ionicons name="pricetag-outline" size={12} color="#9ca3af" />
                                        <Text className="text-gray-400 text-[10px] font-black uppercase ml-1 tracking-widest">{product.category || 'N/A'}</Text>
                                    </View>
                                </View>
                                <Text className="text-emerald-600 font-black text-xl tracking-tighter">${product.price}</Text>
                            </View>

                            <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-gray-100/50">
                                <View className={`px-3 py-1 rounded-full ${product.stock < 10 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                                    <Text className={`text-[10px] font-black uppercase tracking-widest ${product.stock < 10 ? 'text-red-500' : 'text-emerald-700'}`}>
                                        Stock: {product.stock}
                                    </Text>
                                </View>

                                <View className="flex-row gap-3">
                                    <TouchableOpacity
                                        onPress={() => handleEdit(product.id)}
                                        className="bg-emerald-50 px-4 py-2 rounded-xl"
                                    >
                                        <Text className="text-emerald-700 font-black text-[10px] uppercase tracking-widest">Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDelete(product.id)}
                                        className="bg-red-50 px-4 py-2 rounded-xl"
                                    >
                                        <Text className="text-red-500 font-black text-[10px] uppercase tracking-widest">Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}
