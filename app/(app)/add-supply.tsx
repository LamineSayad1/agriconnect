import { supabase } from "@/lib/supabaseClient";
import { Ionicons } from '@expo/vector-icons';
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
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUPPLY_CATEGORIES = [
    { id: 'seeds', name: 'Seeds', emoji: '🌱' },
    { id: 'tools', name: 'Tools', emoji: '🚜' },
    { id: 'fertilizer', name: 'Fertilizer', emoji: '🧪' },
    { id: 'feed', name: 'Livestock Feed', emoji: '🌾' },
];

export default function AddSupply() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [category, setCategory] = useState("tools");
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchSupplyDetails = useCallback(async () => {
        try {
            const { data } = await supabase
                .from("supplies")
                .select("*")
                .eq("id", id)
                .single();

            if (data) {
                setName(data.name);
                setDescription(data.description || "");
                setPrice(data.price.toString());
                setStock(data.stock.toString());
                setCategory(data.category || "tools");
                setImage(data.image_url || null);
            }
        } catch {
            Alert.alert("Error", "Could not load supply details.");
            router.back();
        }
    }, [id, router]);

    useEffect(() => {
        if (id) {
            fetchSupplyDetails();
        }
    }, [id, fetchSupplyDetails]);

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
            .from("supplies")
            .upload(filePath, arrayBuffer, {
                contentType: blob.type || "image/jpeg",
                upsert: false,
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from("supplies")
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleAddSupply = async () => {
        if (!name.trim() || !price || !stock) {
            Alert.alert("Missing Information", "Please fill in all required fields (Name, Price, Stock)");
            return;
        }

        const priceValue = parseFloat(price);
        const stockValue = parseInt(stock);

        if (isNaN(priceValue) || priceValue <= 0) {
            Alert.alert("Invalid Price", "Price must be a valid number greater than 0");
            return;
        }

        if (isNaN(stockValue) || stockValue < 0) {
            Alert.alert("Invalid Stock", "Stock must be a valid number (0 or more)");
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            let imageUrl = image;
            if (image && !image.startsWith("http")) {
                try {
                    imageUrl = await uploadImage(image);
                } catch (uploadError: any) {
                    console.error("Image upload error detail:", uploadError);
                    throw uploadError;
                }
            }

            const payload = {
                supplier_id: user.id,
                name: name.trim(),
                description: description.trim() || null,
                price: priceValue,
                stock: stockValue,
                category: category,
                image_url: imageUrl
            };

            const { error } = id
                ? await supabase.from("supplies").update(payload).eq("id", id)
                : await supabase.from("supplies").insert(payload);

            if (error) throw error;

            Alert.alert(
                "Success! 🎉",
                `Supply ${id ? 'updated' : 'added'} successfully`,
                [
                    { text: "OK", onPress: () => router.back() }
                ]
            );

        } catch (err: any) {
            console.error("Add supply error:", err);
            Alert.alert("Error", err.message || "Failed to add supply");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                >
                    <View className="px-6 py-4 flex-row items-center bg-white border-b border-gray-100">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-gray-50 rounded-full border border-gray-100">
                            <Ionicons name="arrow-back" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-gray-900">{id ? 'Edit Supply' : 'New Supply'}</Text>
                    </View>

                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        {/* Image Picker Section */}
                        <View className="px-6 pt-6">
                            <Text className="text-sm font-bold text-gray-700 mb-3 ml-1">Supply Photo</Text>
                            <Pressable
                                onPress={pickImage}
                                className="w-full h-56 bg-white rounded-3xl border-2 border-dashed border-gray-200 overflow-hidden items-center justify-center shadow-sm"
                            >
                                {image ? (
                                    <Image source={{ uri: image }} className="w-full h-full" />
                                ) : (
                                    <View className="items-center">
                                        <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-3">
                                            <Ionicons name="camera" size={32} color="#2563eb" />
                                        </View>
                                        <Text className="text-gray-400 font-medium italic">Add a clear photo of the item</Text>
                                    </View>
                                )}
                            </Pressable>
                        </View>

                        <View className="px-6 pt-8">
                            {/* Tip Card */}
                            <View className="mb-8 bg-blue-50 p-4 rounded-3xl border border-blue-100 flex-row items-center shadow-sm">
                                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="bulb" size={20} color="#2563eb" />
                                </View>
                                <Text className="text-blue-800 text-xs flex-1 font-medium leading-5">
                                    Pro Tip: Farmers look for specific details. Mention durability for tools or NPK ratios for fertilizers.
                                </Text>
                            </View>
                        </View>

                        <View className="gap-5 mb-8 px-6">
                            {/* Name */}
                            <View>
                                <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Supply Name</Text>
                                <View className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center shadow-sm">
                                    <Ionicons name="construct-outline" size={20} color="#9ca3af" />
                                    <TextInput
                                        placeholder="e.g. Premium Fertilizer"
                                        value={name}
                                        onChangeText={setName}
                                        className="flex-1 text-gray-900 font-medium text-base ml-3"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            {/* Category */}
                            <View>
                                <Text className="text-sm font-bold text-gray-700 mb-3 ml-1">Category</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
                                    <View className="flex-row gap-3">
                                        {SUPPLY_CATEGORIES.map((cat) => (
                                            <TouchableOpacity
                                                key={cat.id}
                                                onPress={() => setCategory(cat.id)}
                                                style={{
                                                    paddingHorizontal: 20,
                                                    paddingVertical: 12,
                                                    borderRadius: 16,
                                                    borderWidth: 1,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    borderColor: category === cat.id ? "#2563eb" : "#e5e7eb",
                                                    backgroundColor: category === cat.id ? "#2563eb" : "#ffffff",
                                                }}
                                            >
                                                <Text style={{ marginRight: 8, fontSize: 18 }}>{cat.emoji}</Text>
                                                <Text style={{ fontWeight: "700", color: category === cat.id ? "#ffffff" : "#4b5563" }}>
                                                    {cat.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            {/* Price & Stock */}
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Price (DA)</Text>
                                    <View className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center shadow-sm">
                                        <Text className="text-blue-600 font-bold mr-2 text-lg">$</Text>
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

                            {/* Description */}
                            <View>
                                <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Description</Text>
                                <View className="bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm h-32">
                                    <TextInput
                                        placeholder="Describe usage, specs, etc..."
                                        value={description}
                                        onChangeText={setDescription}
                                        multiline
                                        textAlignVertical="top"
                                        className="flex-1 text-gray-900 text-base font-medium"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>
                        </View>

                        <View className="px-6">
                            {/* Action Button */}
                            <TouchableOpacity
                                onPress={handleAddSupply}
                                disabled={loading}
                                className={`mb-12 py-5 rounded-2xl items-center shadow-lg ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
                            >
                                {loading ? (
                                    <View className="flex-row items-center">
                                        <ActivityIndicator color="#fff" className="mr-3" />
                                        <Text className="text-white font-bold text-lg">Processing...</Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center">
                                        <Ionicons name={id ? "save" : "add-circle"} size={24} color="white" className="mr-2" />
                                        <Text className="text-white font-bold text-lg tracking-wide">{id ? 'Save Changes' : 'Publish Supply'}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
