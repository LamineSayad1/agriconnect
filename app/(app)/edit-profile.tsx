import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfile() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [profile, setProfile] = useState<any>({
        full_name: '',
        farm_name: '',
        farm_description: '',
        location: '',
        phone: '',
        user_type: ''
    });

    const fetchProfile = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleUpdate = async () => {
        if (!profile.full_name?.trim()) {
            Alert.alert("Error", "Full name is required.");
            return;
        }

        setUpdating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    farm_name: profile.farm_name,
                    farm_description: profile.farm_description,
                    location: profile.location,
                    phone: profile.phone,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            Alert.alert("Success", "Profile updated successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert("Update Failed", error.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#16a34a" />
            </SafeAreaView>
        );
    }

    const isFarmerOrSupplier = profile.user_type === 'farmer' || profile.role === 'farmer';

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800">Edit Profile</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                    <View className="items-center mb-8">
                        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-2">
                            <Text className="text-4xl">👤</Text>
                        </View>
                        <Text className="text-gray-500 font-medium capitalize">{profile.user_type || profile.role}</Text>
                    </View>

                    <View className="space-y-6">
                        {/* Full Name */}
                        <View>
                            <Text className="text-sm font-bold text-gray-700 mb-2">Full Name *</Text>
                            <TextInput
                                className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-800"
                                value={profile.full_name}
                                onChangeText={(val) => setProfile({ ...profile, full_name: val })}
                                placeholder="Enter your full name"
                            />
                        </View>

                        {/* Phone */}
                        <View>
                            <Text className="text-sm font-bold text-gray-700 mb-2">Phone Number</Text>
                            <TextInput
                                className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-800"
                                value={profile.phone}
                                onChangeText={(val) => setProfile({ ...profile, phone: val })}
                                placeholder="+213..."
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Location */}
                        <View>
                            <Text className="text-sm font-bold text-gray-700 mb-2">Location / Address</Text>
                            <TextInput
                                className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-800"
                                value={profile.location}
                                onChangeText={(val) => setProfile({ ...profile, location: val })}
                                placeholder="City, Region"
                            />
                        </View>

                        {isFarmerOrSupplier && (
                            <>
                                {/* Farm Name */}
                                <View>
                                    <Text className="text-sm font-bold text-gray-700 mb-2">Farm/Business Name</Text>
                                    <TextInput
                                        className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-800"
                                        value={profile.farm_name}
                                        onChangeText={(val) => setProfile({ ...profile, farm_name: val })}
                                        placeholder="e.g. Green Valley Farm"
                                    />
                                </View>

                                {/* Farm Description */}
                                <View>
                                    <Text className="text-sm font-bold text-gray-700 mb-2">Business Bio</Text>
                                    <TextInput
                                        className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-800 h-24"
                                        value={profile.farm_description}
                                        onChangeText={(val) => setProfile({ ...profile, farm_description: val })}
                                        placeholder="Describe your farm and products..."
                                        multiline
                                        textAlignVertical="top"
                                    />
                                </View>
                            </>
                        )}
                    </View>

                    <TouchableOpacity
                        className={`w-full py-4 rounded-xl items-center mt-10 mb-10 ${updating ? 'bg-gray-400' : 'bg-green-600'}`}
                        onPress={handleUpdate}
                        disabled={updating}
                    >
                        {updating ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
