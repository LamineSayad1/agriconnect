import { supabase } from "@/lib/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = ["Fruits", "Vegetables", "Dairy", "Grains", "Meat", "Herbs", "Eggs", "Honey", "Nuts", "Seafood"];

export default function AddProduct() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [targetAudience, setTargetAudience] = useState<"buyer" | "supplier">("buyer");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProductDetails = useCallback(async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      Alert.alert("Error", "Failed to fetch product.");
      return;
    }

    if (data) {
      setName(data.name ?? "");
      setDescription(data.description ?? "");
      setPrice(String(data.price ?? ""));
      setStock(String(data.stock ?? ""));
      setCategory(
        data.category ? data.category.charAt(0).toUpperCase() + data.category.slice(1) : ""
      );
      setTargetAudience(data.target_audience || "buyer");
      setImage(data.image_url ?? null);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) fetchProductDetails();
  }, [isEditing, fetchProductDetails]);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo gallery to upload images.",
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
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open gallery");
    }
  };

  const uploadImage = async (uri: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const ext = uri.split(".").pop()?.toLowerCase() || "jpeg";
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { error } = await supabase.storage
      .from("products")
      .upload(filePath, arrayBuffer, {
        contentType: blob.type || "image/jpeg",
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("products")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleAddProduct = async () => {
    if (!name.trim() || !price || !stock || !category) {
      Alert.alert("Missing Information", "Please fill Name, Price, Stock, Category");
      return;
    }

    const priceValue = parseFloat(price);
    const stockValue = parseInt(stock, 10);

    if (Number.isNaN(priceValue) || priceValue <= 0) {
      Alert.alert("Invalid Price", "Price must be a number greater than 0");
      return;
    }

    if (Number.isNaN(stockValue) || stockValue < 0) {
      Alert.alert("Invalid Stock", "Stock must be 0 or more");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let imageUrl = image;
      if (image && !image.startsWith("http")) {
        imageUrl = await uploadImage(image);
      }

      const productData = {
        name: name.trim(),
        description: description.trim() || null,
        price: priceValue,
        stock: stockValue,
        category: category.toLowerCase(),
        target_audience: targetAudience,
        image_url: imageUrl,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert({
          farmer_id: user.id,
          ...productData,
        });
        if (error) throw error;
      }

      Alert.alert(
        "Success",
        `Product ${isEditing ? "updated" : "added"} successfully`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Header */}
          <View className="px-6 py-6 flex-row items-center bg-white border-b border-gray-100">
            <Pressable
              onPress={() => router.back()}
              className="mr-4 p-2 bg-gray-50 rounded-full border border-gray-100"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </Pressable>
            <Text className="text-xl font-bold text-gray-900">
              {isEditing ? "Edit Product" : "New Product"}
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 }}
          >
            {/* Image */}
            <Pressable
              onPress={pickImage}
              style={{ width: '100%', height: 192, backgroundColor: 'white', borderStyle: 'dashed', borderWidth: 2, borderColor: '#10b981', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, overflow: 'hidden' }}
            >
              {image ? (
                <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <View style={{ width: 64, height: 64, backgroundColor: '#f0fdf4', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Ionicons name="camera" size={30} color="#10b981" />
                  </View>
                  <Text style={{ color: '#10b981', fontWeight: 'bold' }}>Upload Product Image</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>Tap to select from gallery</Text>
                </View>
              )}
            </Pressable>

            {/* Form: gap instead of space-y */}
            <View className="gap-6 mb-10">
              {/* Name */}
              <View>
                <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Product Name</Text>
                <View className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center shadow-sm">
                  <Ionicons name="leaf-outline" size={20} color="#9ca3af" />
                  <TextInput
                    placeholder="e.g. Fresh Tomatoes"
                    value={name}
                    onChangeText={setName}
                    className="flex-1 text-gray-900 font-medium text-base ml-3"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Price & Stock */}
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Price (DA)</Text>
                  <View className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center shadow-sm">
                    <Text className="text-emerald-600 font-bold mr-2 text-lg">$</Text>
                    <TextInput
                      placeholder="0.00"
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="numeric"
                      className="flex-1 text-gray-900 font-bold text-lg"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Stock</Text>
                  <View className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center shadow-sm">
                    <Ionicons name="layers-outline" size={20} color="#9ca3af" />
                    <TextInput
                      placeholder="0"
                      value={stock}
                      onChangeText={setStock}
                      keyboardType="numeric"
                      className="flex-1 text-gray-900 font-bold text-lg ml-2"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>

              {/* Category */}
              <View>
                <Text className="text-sm font-bold text-gray-700 mb-3 ml-1">Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
                  <View className="flex-row gap-3">
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat;
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => setCategory(cat)}
                          style={{
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            borderRadius: 16,
                            borderWidth: 1,
                            marginRight: 12,
                            borderColor: isSelected ? "#10b981" : "#e5e7eb",
                            backgroundColor: isSelected ? "#10b981" : "#ffffff",
                          }}
                        >
                          <Text style={{ fontWeight: "700", color: isSelected ? "#ffffff" : "#4b5563" }}>
                            {cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* Target Audience */}
              <View>
                <Text className="text-sm font-bold text-gray-700 mb-4 ml-1">Target Audience</Text>
                <View className="flex-row gap-4">
                  {(["buyer", "supplier"] as const).map((aud) => {
                    const isSelected = targetAudience === aud;
                    return (
                      <Pressable
                        key={aud}
                        onPress={() => setTargetAudience(aud)}
                        className={`flex-1 py-4 rounded-2xl border items-center justify-center shadow-sm ${isSelected ? "bg-emerald-600 border-emerald-600" : "bg-white border-gray-200"
                          }`}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name={aud === "buyer" ? "person-outline" : "business-outline"}
                            size={20}
                            color={isSelected ? "white" : "#4b5563"}
                          />
                          <Text className={`font-black ml-2 uppercase tracking-widest text-xs ${isSelected ? "text-white" : "text-gray-600"
                            }`}>
                            {aud}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Description */}
              <View>
                <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Description</Text>
                <View className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm h-32">
                  <TextInput
                    placeholder="Describe the quality, origin, and details of your product..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    textAlignVertical="top"
                    className="flex-1 text-gray-900 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            {/* Action */}
            <Pressable
              onPress={handleAddProduct}
              disabled={loading}
              className={`mb-10 py-5 rounded-2xl items-center shadow-lg ${loading ? "bg-emerald-500" : "bg-emerald-600"
                }`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons
                    name={isEditing ? "save-outline" : "add-circle-outline"}
                    size={24}
                    color="white"
                  />
                  <Text className="text-white font-bold text-lg tracking-wide ml-2">
                    {isEditing ? "Save Changes" : "List Product"}
                  </Text>
                </View>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
