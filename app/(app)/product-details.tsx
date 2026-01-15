import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProductDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [product, setProduct] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [buyQuantity, setBuyQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);

    const checkIfFavorite = useCallback(async () => {
        try {
            const favoritesStr = await AsyncStorage.getItem('wishlist');
            if (favoritesStr) {
                const favorites = JSON.parse(favoritesStr);
                setIsFavorite(favorites.includes(id));
            }
        } catch (error) {
            console.error("Error checking favorite:", error);
        }
    }, [id]);

    const toggleFavorite = async () => {
        try {
            const favoritesStr = await AsyncStorage.getItem('wishlist') || '[]';
            let favorites = JSON.parse(favoritesStr);

            if (isFavorite) {
                favorites = favorites.filter((favId: string) => favId !== id);
            } else {
                favorites.push(id);
            }

            await AsyncStorage.setItem('wishlist', JSON.stringify(favorites));
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    const handleCall = () => {
        if (product?.farmer?.phone) {
            Linking.openURL(`tel:${product.farmer.phone}`);
        } else {
            Alert.alert("Notice", "Farmer phone number not available.");
        }
    };

    const checkUser = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    }, []);

    const addToRecent = useCallback(async (productId: string) => {
        try {
            const history = await AsyncStorage.getItem('recent_views');
            let ids = history ? JSON.parse(history) : [];
            // Remove if exists to move to top
            ids = ids.filter((id: string) => id !== productId);
            // Add to front
            ids.unshift(productId);
            // Limit to 5
            ids = ids.slice(0, 5);
            await AsyncStorage.setItem('recent_views', JSON.stringify(ids));
        } catch (e) {
            console.log('Error saving recent view', e);
        }
    }, []);

    const fetchProduct = useCallback(async () => {
        if (!id) return;
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, description, price, stock, category, farmer_id, image_url')
                .eq('id', id)
                .single();

            if (error) throw error;

            let productData: any = data;

            // Manual fetch for farmer details since FK might be missing
            if (data.farmer_id) {
                const { data: farmerData } = await supabase
                    .from('profiles')
                    .select('id, full_name, role, phone') // Added phone
                    .eq('id', data.farmer_id)
                    .single();

                if (farmerData) {
                    productData = { ...productData, farmer: farmerData };
                }
            }

            setProduct(productData);
            addToRecent(productData.id);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to load product details");
        } finally {
            setLoading(false);
        }
    }, [id, addToRecent]);

    const fetchReviews = useCallback(async () => {
        if (!id) return;
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                id, rating, comment, created_at,
                buyer:profiles(full_name)
            `)
            .eq('product_id', id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setReviews(data);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchProduct();
            fetchReviews();
            checkUser();
            checkIfFavorite();
        }
    }, [id, fetchProduct, fetchReviews, checkUser, checkIfFavorite]);

    const handleAddToCart = async () => {
        try {
            const cartStr = await AsyncStorage.getItem('cart') || '[]';
            const cart = JSON.parse(cartStr);

            const existingItem = cart.find((item: any) => item.id === product.id);
            if (existingItem) {
                existingItem.quantity += buyQuantity;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: buyQuantity,
                    farmer_id: product.farmer_id,
                    category: product.category
                });
            }

            await AsyncStorage.setItem('cart', JSON.stringify(cart));
            Alert.alert("Success", "Added to cart!", [
                { text: "View Cart", onPress: () => router.push("/cart") },
                { text: "Continue" }
            ]);
        } catch (error) {
            console.error("Cart error:", error);
            Alert.alert("Error", "Could not add to cart.");
        }
    };

    const handleBuy = async () => {
        if (!currentUser) {
            Alert.alert("Login Required", "You must be logged in to purchase items.", [
                { text: "Cancel" },
                { text: "Login", onPress: () => router.replace("/") }
            ]);
            return;
        }

        if (product.farmer.id === currentUser.id) {
            Alert.alert("Error", "You cannot buy your own product!");
            return;
        }

        const totalPrice = (product.price * buyQuantity).toFixed(2);

        Alert.alert(
            "Confirm Purchase",
            `Buy ${buyQuantity}x ${product.name} for $${totalPrice}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Buy Now", onPress: processPurchase }
            ]
        );
    };

    const processPurchase = async () => {
        setPurchasing(true);
        try {
            const totalPrice = product.price * buyQuantity;

            // 1. Create Order Header
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    buyer_id: currentUser.id,
                    farmer_id: product.farmer_id,
                    status: 'pending',
                    total_amount: totalPrice
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Item
            const { error: itemError } = await supabase
                .from('order_items')
                .insert({
                    order_id: order.id,
                    product_id: product.id,
                    quantity: buyQuantity,
                    price: product.price
                });

            if (itemError) {
                // Determine if we should rollback order - simplified: just throw
                throw itemError;
            }

            // 3. Update Stock
            const { error: stockError } = await supabase
                .from('products')
                .update({ stock: product.stock - buyQuantity })
                .eq('id', product.id);

            if (stockError) console.error("Stock update error (non-fatal):", stockError);

            Alert.alert("Success!", "Order placed successfully!", [
                { text: "View Orders", onPress: () => router.replace("/(tabs)/orders" as any) },
                { text: "Continue Shopping", onPress: () => router.back() }
            ]);

        } catch (error: any) {
            console.error(error);
            Alert.alert("Purchase Failed", error.message);
        } finally {
            setPurchasing(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#d97706" />
            </SafeAreaView>
        );
    }

    if (!product) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <Text>Product not found</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4">
                    <Text className="text-blue-600">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />

            {/* Premium Header */}
            <View className="bg-white px-6 pt-16 pb-6 flex-row items-center z-10 border-b border-gray-50">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100"
                >
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View className="flex-1 ml-5">
                    <Text className="text-[10px] font-black text-amber-600 uppercase tracking-[2px] mb-0.5">Product Discovery</Text>
                    <Text className="text-xl font-black text-gray-900 tracking-tighter" numberOfLines={1}>
                        {product.name}
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
                {/* Product Image Stage */}
                <View className="px-6 mt-6">
                    <View className="w-full h-80 bg-gray-50 rounded-[48px] overflow-hidden shadow-2xl border border-white">
                        {product.image_url ? (
                            <Image
                                source={{ uri: product.image_url }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-full h-full items-center justify-center">
                                <Text className="text-8xl">🧺</Text>
                            </View>
                        )}

                        {/* Overlay Gradient/Glassmorphism label for Category */}
                        <View className="absolute top-6 left-6 bg-white/90 px-4 py-2 rounded-2xl border border-white shadow-sm">
                            <Text className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{product.category || 'Fresh Goods'}</Text>
                        </View>

                        <TouchableOpacity
                            onPress={toggleFavorite}
                            className="absolute bottom-6 right-6 bg-white w-14 h-14 rounded-full items-center justify-center shadow-xl border border-white"
                        >
                            <Ionicons
                                name={isFavorite ? "heart" : "heart-outline"}
                                size={28}
                                color={isFavorite ? "#ef4444" : "#6b7280"}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info Stage */}
                <View className="px-8 mt-8">

                    <View className="flex-row justify-between items-end mb-8">
                        <View className="flex-1">
                            <Text className="text-4xl font-black text-gray-900 tracking-tighter mb-2">{product.name}</Text>
                            <View className="flex-row items-center bg-emerald-50 self-start px-3 py-1.5 rounded-xl border border-emerald-100">
                                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                                <Text className="text-emerald-700 font-bold text-xs uppercase tracking-widest">In Stock: {product.stock}</Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Unit Price</Text>
                            <Text className="text-4xl font-black text-amber-700 tracking-tighter">
                                ${product.price}
                            </Text>
                        </View>
                    </View>

                    <View className="mb-10">
                        <Text className="text-xl font-black text-gray-900 mb-4 tracking-tighter">Description</Text>
                        <Text className="text-gray-600 leading-7 text-base font-medium">
                            {product.description || "Fresh and organic produce sourced directly from local producers with total transparency and care."}
                        </Text>
                    </View>

                    {/* Farmer Identity Card */}
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: "/farmer-profile", params: { id: product.farmer_id } })}
                        className="bg-white p-6 rounded-[32px] mb-10 border border-gray-100 shadow-xl flex-row items-center"
                    >
                        <View className="w-16 h-16 bg-amber-50 rounded-2xl items-center justify-center mr-4 shadow-inner">
                            <Text className="text-3xl">👨‍🌾</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Authentic Producer</Text>
                            <Text className="font-black text-gray-900 text-xl tracking-tight">{product.farmer?.full_name}</Text>
                            <Text className="text-gray-400 font-bold text-xs mt-0.5">Trusted Seller • 4.9 Rating</Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleCall}
                            className="bg-amber-600 w-12 h-12 rounded-2xl items-center justify-center shadow-lg shadow-amber-200"
                        >
                            <Ionicons name="call" size={24} color="white" />
                        </TouchableOpacity>
                    </TouchableOpacity>

                    {/* Reviews Stage */}
                    <View className="mb-10">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-gray-900 tracking-tighter">Patient Feedback</Text>
                            <View className="bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                                <Text className="text-gray-600 text-xs font-black uppercase tracking-widest">{reviews.length} REVIEWS</Text>
                            </View>
                        </View>

                        {reviews.length > 0 ? (
                            reviews.map((review) => (
                                <View key={review.id} className="bg-gray-50/50 p-6 rounded-[32px] mb-4 border border-gray-100">
                                    <View className="flex-row justify-between items-center mb-4">
                                        <View>
                                            <Text className="font-black text-gray-900 text-base">{review.buyer?.full_name || 'AgriConnect User'}</Text>
                                            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Verified Buyer</Text>
                                        </View>
                                        <View className="flex-row gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Ionicons key={i} name="star" size={14} color={i < review.rating ? "#f59e0b" : "#d1d5db"} />
                                            ))}
                                        </View>
                                    </View>
                                    <Text className="text-gray-600 leading-6 font-medium italic">"{review.comment}"</Text>
                                </View>
                            ))
                        ) : (
                            <View className="py-10 bg-gray-50 rounded-[40px] items-center justify-center border border-dashed border-gray-200">
                                <Ionicons name="chatbox-outline" size={32} color="#d1d5db" />
                                <Text className="text-gray-400 font-bold mt-4 uppercase tracking-widest text-xs">No feedback yet.</Text>
                            </View>
                        )}
                    </View>

                </View>
            </ScrollView>

            {/* Premium Floating Footer */}
            <View className="absolute bottom-10 left-6 right-6 bg-white/95 rounded-[40px] px-8 py-6 shadow-2xl border border-white shadow-amber-900/20 z-50">
                <View className="flex-row items-center justify-between mb-8">
                    <View>
                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Set Quantity</Text>
                        <View className="flex-row items-center bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
                            <TouchableOpacity
                                onPress={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                                className="w-10 h-10 items-center justify-center bg-white rounded-xl shadow-sm"
                            >
                                <Ionicons name="remove" size={20} color="#1f2937" />
                            </TouchableOpacity>
                            <Text className="font-black text-xl w-12 text-center text-gray-900">{buyQuantity}</Text>
                            <TouchableOpacity
                                onPress={() => setBuyQuantity(Math.min(product.stock, buyQuantity + 1))}
                                className="w-10 h-10 items-center justify-center bg-white rounded-xl shadow-sm"
                            >
                                <Ionicons name="add" size={20} color="#1f2937" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="items-end">
                        <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Bill</Text>
                        <Text className="text-3xl font-black text-amber-700 tracking-tighter">
                            ${(product.price * buyQuantity).toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View className="flex-row gap-4">
                    <TouchableOpacity
                        className="flex-1 py-5 rounded-[24px] border border-amber-600 flex-row justify-center items-center bg-white shadow-sm active:scale-95 transition-all"
                        onPress={handleAddToCart}
                        disabled={product.stock <= 0 || purchasing}
                    >
                        <Ionicons name="cart-outline" size={22} color="#d97706" />
                        <Text className="text-amber-600 font-black text-lg ml-2 uppercase tracking-widest">Add</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`flex-[1.5] py-5 rounded-[24px] flex-row justify-center items-center shadow-lg shadow-amber-200 active:scale-95 transition-all ${product.stock > 0 ? 'bg-amber-600' : 'bg-gray-400'}`}
                        onPress={handleBuy}
                        disabled={product.stock <= 0 || purchasing}
                    >
                        {purchasing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-black text-lg uppercase tracking-widest">
                                {product.stock > 0 ? 'Checkout Now' : 'Out of Stock'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

        </SafeAreaView>
    );
}
