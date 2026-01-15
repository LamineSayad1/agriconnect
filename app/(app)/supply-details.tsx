import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SupplyDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [supply, setSupply] = useState<any>(null);
    const [requestQty, setRequestQty] = useState(1);

    const fetchSupply = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('supplies')
                .select(`
          *,
          supplier:profiles(*)
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setSupply(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchSupply();
    }, [id, fetchSupply]);

    const handleRequest = async () => {
        setRequesting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert("Login Required", "Please login to request supplies.");
                router.replace("/");
                return;
            }

            const { error } = await supabase
                .from('supply_requests')
                .insert({
                    farmer_id: user.id,
                    supply_id: supply.id,
                    quantity: requestQty,
                    status: 'pending'
                });

            if (error) throw error;

            Alert.alert("Success!", "Your request has been sent to the supplier. They will contact you shortly.", [
                { text: "OK", onPress: () => router.replace("/") }
            ]);
            router.back();

        } catch (error: any) {
            Alert.alert("Request Failed", error.message);
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#1e40af" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Immersive Header Stage */}
                <View className="px-6 pt-16">
                    <View className="w-full h-80 bg-blue-50 rounded-[48px] overflow-hidden shadow-2xl border border-white relative">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="absolute top-6 left-6 bg-white/90 w-12 h-12 rounded-2xl items-center justify-center shadow-lg z-10 border border-white"
                        >
                            <Ionicons name="arrow-back" size={24} color="#1e40af" />
                        </TouchableOpacity>

                        {supply.image_url ? (
                            <Image
                                source={{ uri: supply.image_url }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="flex-1 items-center justify-center">
                                <Text className="text-[100px]">
                                    {supply.category === 'tools' ? '🚜' :
                                        supply.category === 'seeds' ? '🌱' :
                                            supply.category === 'fertilizer' ? '🧪' : '🌾'}
                                </Text>
                            </View>
                        )}

                        {/* Category Label Overlay */}
                        <View className="absolute bottom-8 left-8 bg-blue-600/90 px-4 py-2 rounded-2xl border border-blue-400 shadow-sm">
                            <Text className="text-[10px] font-black text-white uppercase tracking-widest">{supply.category}</Text>
                        </View>
                    </View>
                </View>

                <View className="px-8 py-8">
                    <View className="flex-row justify-between items-end mb-8">
                        <View className="flex-1">
                            <Text className="text-[10px] font-black text-blue-600 uppercase tracking-[2px] mb-2">Essential Supply</Text>
                            <Text className="text-4xl font-black text-gray-900 tracking-tighter leading-tight">{supply.name}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Price / Unit</Text>
                            <Text className="text-4xl font-black text-blue-700 tracking-tighter">${supply.price}</Text>
                        </View>
                    </View>

                    {/* Supplier Identity Card */}
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: "/supplier-profile", params: { id: supply.supplier_id } })}
                        className="bg-white p-6 rounded-[32px] mb-10 border border-gray-100 shadow-xl flex-row items-center"
                    >
                        <View className="w-16 h-16 bg-blue-50 rounded-2xl items-center justify-center mr-4 shadow-inner">
                            <Text className="text-3xl">🏢</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Corporate Supplier</Text>
                            <Text className="font-black text-gray-900 text-xl tracking-tight" numberOfLines={1}>{supply.supplier?.full_name}</Text>
                            <View className="flex-row items-center mt-1">
                                <Ionicons name="location-outline" size={12} color="#9ca3af" />
                                <Text className="text-gray-400 font-bold text-xs ml-1">{supply.supplier?.location || 'Logistics Center'}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
                    </TouchableOpacity>

                    <View className="mb-10">
                        <Text className="text-xl font-black text-gray-900 mb-4 tracking-tighter">Technical Details</Text>
                        <Text className="text-gray-600 leading-7 text-base font-medium">
                            {supply.description || "Professional grade agricultural supplies engineered for maximum efficiency and yield in modern farming operations."}
                        </Text>
                    </View>

                    {/* Quantity Selector Section */}
                    <View className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-2xl mb-12">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-xl font-black text-gray-900 tracking-tighter">Order Quantity</Text>
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Stock: {supply.stock}</Text>
                            </View>
                            <View className="flex-row items-center bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
                                <TouchableOpacity
                                    onPress={() => setRequestQty(Math.max(1, requestQty - 1))}
                                    className="w-12 h-12 bg-white rounded-xl items-center justify-center shadow-lg shadow-gray-100"
                                >
                                    <Ionicons name="remove" size={24} color="#1f2937" />
                                </TouchableOpacity>
                                <Text className="mx-6 text-2xl font-black text-gray-900 w-8 text-center">{requestQty}</Text>
                                <TouchableOpacity
                                    onPress={() => setRequestQty(requestQty + 1)}
                                    className="w-12 h-12 bg-white rounded-xl items-center justify-center shadow-lg shadow-gray-100"
                                >
                                    <Ionicons name="add" size={24} color="#1f2937" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            className={`w-full py-5 rounded-[24px] items-center shadow-xl active:scale-[0.98] transition-all ${requesting ? 'bg-blue-300' : 'bg-blue-600 shadow-blue-200'}`}
                            onPress={handleRequest}
                            disabled={requesting}
                        >
                            {requesting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-black text-lg uppercase tracking-widest">Send Logistics Request</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
