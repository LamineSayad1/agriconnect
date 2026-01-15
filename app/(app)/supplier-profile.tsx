import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SupplierProfile() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [supplies, setSupplies] = useState<any[]>([]);

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            const { data: suppliesData } = await supabase
                .from('supplies')
                .select('*')
                .eq('supplier_id', id)
                .order('created_at', { ascending: false });

            setSupplies(suppliesData || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadProfile();
    }, [id, loadProfile]);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#16a34a" />
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />

            {/* Header */}
            <SafeAreaView className="bg-white z-10 shadow-sm border-b border-gray-100">
                <View className="px-6 py-4 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mr-4 bg-gray-50 p-2 rounded-full"
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900">Supplier Catalogue</Text>
                </View>
            </SafeAreaView>

            <View className="flex-1">
                {/* Profile Banner */}
                <View className="bg-blue-600 px-6 py-8 mb-4 rounded-b-[40px] shadow-lg shadow-blue-900/20 mx-2 mt-2">
                    <View className="flex-row items-center mb-6">
                        <View className="w-20 h-20 bg-white rounded-full items-center justify-center mr-5 border-4 border-blue-500 shadow-md">
                            <Text className="text-3xl font-bold text-blue-600">
                                {profile?.full_name?.charAt(0) || 'S'}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-2xl font-extrabold text-white leading-tight mb-1">{profile?.full_name}</Text>
                            <View className="flex-row items-center bg-blue-700/50 self-start px-3 py-1 rounded-full">
                                <Ionicons name="location-sharp" size={14} color="white" />
                                <Text className="text-white text-xs font-bold ml-1 uppercase">{profile?.location || 'Local Supplier'}</Text>
                            </View>
                        </View>
                    </View>
                    <View className="bg-blue-700/30 p-4 rounded-2xl border border-white/10">
                        <Text className="text-blue-50 font-medium text-sm border-l-2 border-blue-300 pl-3">
                            {profile?.farm_description || profile?.bio || "Professional agricultural supplier providing high-quality items for local farmers."}
                        </Text>
                    </View>
                </View>

                {/* Supplies List */}
                <View className="flex-1 px-6">
                    <Text className="text-lg font-bold text-gray-900 mb-4 px-1">Available Supplies</Text>

                    <FlatList
                        data={supplies}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => router.push({ pathname: "/supply-details", params: { id: item.id } })}
                                className="bg-white p-4 rounded-3xl mb-4 shadow-sm border border-gray-100 flex-row items-center"
                                activeOpacity={0.7}
                            >
                                <View className="w-16 h-16 bg-gray-50 rounded-2xl items-center justify-center mr-4 border border-gray-100">
                                    <Text className="text-3xl">🛠️</Text>
                                </View>
                                <View className="flex-1 h-16 justify-center">
                                    <Text className="font-bold text-gray-900 text-lg leading-tight mb-1" numberOfLines={1}>{item.name}</Text>
                                    <View className="flex-row items-center">
                                        <View className="bg-blue-50 px-2 py-0.5 rounded-md">
                                            <Text className="text-blue-600 text-[10px] font-bold uppercase">Stock: {item.stock}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View className="items-end pl-2">
                                    <Text className="text-gray-900 font-extrabold text-xl">${item.price}</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#9ca3af" className="mt-1" />
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View className="py-10 items-center justify-center">
                                <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
                                    <Ionicons name="cube-outline" size={40} color="#d1d5db" />
                                </View>
                                <Text className="text-gray-400 font-medium">No supplies listed.</Text>
                            </View>
                        }
                        contentContainerStyle={{ paddingBottom: 40 }}
                    />
                </View>
            </View>
        </View>
    );

}
