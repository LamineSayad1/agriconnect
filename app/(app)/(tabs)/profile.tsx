import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    farm_description: "",
  });

  const getCurrentUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setUser({ ...user, ...profile });
        setAvatar(profile?.avatar_url || null);
        setFormData({
          full_name: profile?.full_name || "",
          farm_description: profile?.farm_description || "",
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

      if (error) {
        Alert.alert("Update Error", error.message);
        return;
      }

      Alert.alert("Success", "Profile updated successfully!");
      setEditing(false);
      getCurrentUser();
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.setItem('logging_out', 'true');
      (router as any).replace("/");
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('user_session');
    } catch {
      (router as any).replace("/");
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo gallery to upload a profile picture.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert("Error", "Failed to open image picker");
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      const ext = uri.split(".").pop()?.toLowerCase() || "jpeg";
      const filePath = `${user.id}/avatar.${ext}`;

      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, arrayBuffer, {
          contentType: blob.type || "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatar(publicUrl);
      Alert.alert("Success", "Profile picture updated!");
      getCurrentUser();
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert("Upload Failed", error?.message || "Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#d97706" />
      </SafeAreaView>
    );
  }

  // Role-based Design System
  const role = user?.role || user?.user_type || 'buyer';
  const isSupplier = role === 'supplier';
  const isFarmer = role === 'farmer';
  const isBuyer = role === 'buyer';

  const themeColor = isSupplier ? '#2563eb' : isFarmer ? '#10b981' : '#d97706';
  const themeBg = isSupplier ? 'bg-blue-600' : isFarmer ? 'bg-emerald-600' : 'bg-amber-600';
  const themeText = isSupplier ? 'text-blue-600' : isFarmer ? 'text-emerald-600' : 'text-amber-600';
  const themeLightBg = isSupplier ? 'bg-blue-50' : isFarmer ? 'bg-emerald-50' : 'bg-amber-50';
  const themeAccent = isSupplier ? '#bfdbfe' : isFarmer ? '#a7f3d0' : '#fde68a';

  const profileStats = (isFarmer || isSupplier) ? [
    { label: isFarmer ? "Products" : "Supplies", value: user.products_count || "12", icon: "cube-outline" },
    { label: "Total Sales", value: "$2,450", icon: "cash-outline" },
    { label: "Rating", value: "4.8", icon: "star-outline" },
    { label: "Customers", value: "45", icon: "people-outline" },
  ] : [
    { label: "Orders", value: "8", icon: "cart-outline" },
    { label: "Total Spent", value: "$320", icon: "wallet-outline" },
    { label: "Favorites", value: "6", icon: "heart-outline" },
    { label: "Reviews", value: "3", icon: "chatbubble-outline" },
  ];

  const SettingItem = ({ icon, label, color, bgColor }: any) => (
    <TouchableOpacity
      style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
      activeOpacity={0.7}
    >
      <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-4 ${bgColor}`}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text className="text-gray-900 font-black flex-1 text-base tracking-tight">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar style="dark" />

      {/* Modern Header Segment */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
        {/* Abstract background blobs */}
        <View
          style={{ position: 'absolute', top: -40, right: -40, width: 156, height: 156, borderRadius: 78, backgroundColor: themeAccent, opacity: 0.1 }}
        />
        <View
          style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: themeAccent, opacity: 0.1 }}
        />

        <View className="px-6 w-full flex-row justify-between items-center z-10 mb-6">
          <Text className="text-3xl font-black text-gray-900 tracking-tighter">My Account</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setEditing(!editing)}
              style={[{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }]}
              className={`${editing ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'} p-2.5 rounded-2xl border`}
            >
              <Ionicons name={editing ? "close" : "create-outline"} size={24} color={editing ? "#ea580c" : "#6b7280"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}
              className="bg-red-50 p-2.5 rounded-2xl border border-red-100"
            >
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Identity */}
        <View className="items-center z-10 w-full mb-2">
          <View className="relative mb-4">
            <View
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}
              className={`w-32 h-32 ${themeLightBg} rounded-[48px] items-center justify-center border-4 border-white overflow-hidden`}>
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-6xl">
                  {isBuyer ? '🧑‍💻' : isFarmer ? '👨‍🌾' : '🚚'}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploadingAvatar}
              style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: themeColor, padding: 12, borderRadius: 16, borderWidth: 4, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 }}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="camera-outline" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>

          <Text className="text-3xl font-black text-gray-900 tracking-tight">{user?.full_name || 'AgriConnect User'}</Text>
          <View className={`${themeLightBg} px-4 py-1.5 rounded-2xl mt-2 border border-white`}>
            <Text className={`${themeText} text-[10px] font-black uppercase tracking-[3px]`}>
              {role}
            </Text>
          </View>

          {user?.farm_description && (
            <Text className="text-gray-400 font-bold mt-2 text-center text-sm px-4" numberOfLines={2}>
              {user.farm_description}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Stats Section with Horizontal Scroll */}
        <View className="py-8">
          <View className="px-6 flex-row justify-between items-end mb-6">
            <Text className="text-xl font-black text-gray-900 tracking-tight">Overview</Text>
            <TouchableOpacity><Text className={`${themeText} text-xs font-black uppercase tracking-widest`}>Details</Text></TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="overflow-visible"
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {profileStats.map((stat, index) => (
              <View key={index} style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }} className="bg-white rounded-[32px] p-5 mr-4 w-40 border border-gray-100">
                <View className={`w-10 h-10 ${themeLightBg} rounded-2xl items-center justify-center mb-3`}>
                  <Ionicons name={stat.icon as any} size={20} color={themeColor} />
                </View>
                <Text className="text-gray-900 font-black text-2xl tracking-tighter">{stat.value}</Text>
                <Text className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{stat.label}</Text>
              </View>
            ))}
            <View className="w-12" />
          </ScrollView>
        </View>

        {/* Form Section */}
        <View className="px-6 mb-12">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-black text-gray-900 tracking-tight">Personal Details</Text>
            {editing && (
              <View className="bg-orange-100 px-3 py-1 rounded-lg">
                <Text className="text-orange-600 text-[10px] font-black uppercase">Edit Mode</Text>
              </View>
            )}
          </View>

          <View style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }} className="bg-white rounded-[40px] p-8 border border-gray-100">
            <View className="mb-6">
              <Text className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3 ml-1">Full Identity</Text>
              <View
                style={editing ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 } : undefined}
                className={`flex-row items-center px-4 rounded-3xl ${editing ? 'bg-white border-2 border-green-500' : 'bg-gray-50'}`}
              >
                <Ionicons name="person-outline" size={20} color={editing ? themeColor : "#9ca3af"} />
                <TextInput
                  value={formData.full_name}
                  onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                  editable={editing}
                  placeholder="Enter full name"
                  className="flex-1 py-4 ml-3 font-bold text-gray-900"
                />
              </View>
            </View>

            {(isFarmer || isSupplier) && (
              <View className="mb-6">
                <Text className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3 ml-1">Farm Description</Text>
                <View
                  style={editing ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 } : undefined}
                  className={`flex-row items-start px-4 rounded-3xl pt-4 ${editing ? 'bg-white border-2 border-green-500' : 'bg-gray-50'}`}
                >
                  <Ionicons name="leaf-outline" size={20} color={editing ? themeColor : "#9ca3af"} />
                  <TextInput
                    value={formData.farm_description}
                    onChangeText={(text) => setFormData({ ...formData, farm_description: text })}
                    editable={editing}
                    multiline
                    placeholder="Describe your farm"
                    className="flex-1 pb-4 ml-3 font-bold text-gray-900 min-h-[100px]"
                    style={{ textAlignVertical: 'top' }}
                  />
                </View>
              </View>
            )}

            {editing && (
              <TouchableOpacity
                style={[{ shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }]}
                className={`${themeBg} rounded-3xl py-5 mt-4 active:scale-[0.98]`}
                onPress={handleUpdateProfile}
              >
                <Text className="text-white text-center font-black text-lg uppercase tracking-widest">Update Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Global Settings */}
        <View className="px-6">
          <Text className="text-xl font-black text-gray-900 tracking-tight mb-4 px-1">App Settings</Text>
          <SettingItem
            icon="notifications-outline"
            label="Notifications"
            color="#7c3aed"
            bgColor="bg-purple-50"
          />
          <SettingItem
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            color="#2563eb"
            bgColor="bg-blue-50"
          />
          <SettingItem
            icon="help-circle-outline"
            label="Help & Support"
            color="#ea580c"
            bgColor="bg-orange-50"
          />
        </View>
      </ScrollView>
    </View>
  );
}
