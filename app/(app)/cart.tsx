import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    farmer_id: string;
    category?: string;
}

export default function Cart() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState(false);

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            const cartStr = await AsyncStorage.getItem('cart');
            if (cartStr) {
                setCartItems(JSON.parse(cartStr));
            }
        } catch (error) {
            console.error("Error loading cart:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (id: string, newQty: number) => {
        if (newQty < 1) return;
        const newCart = cartItems.map(item =>
            item.id === id ? { ...item, quantity: newQty } : item
        );
        setCartItems(newCart);
        await AsyncStorage.setItem('cart', JSON.stringify(newCart));
    };

    const removeItem = async (id: string) => {
        const newCart = cartItems.filter(item => item.id !== id);
        setCartItems(newCart);
        await AsyncStorage.setItem('cart', JSON.stringify(newCart));
    };

    const calculateTotal = () => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    };

    const handleCheckout = async () => {
        setCheckingOut(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert("Login Required", "Please login to complete your purchase.");
                router.replace("/");
                return;
            }

            // Group items by farmer_id
            const ordersByFarmer: Record<string, CartItem[]> = {};
            cartItems.forEach(item => {
                if (!ordersByFarmer[item.farmer_id]) {
                    ordersByFarmer[item.farmer_id] = [];
                }
                ordersByFarmer[item.farmer_id].push(item);
            });

            // Create an order for each farmer
            for (const farmerId in ordersByFarmer) {
                const items = ordersByFarmer[farmerId];
                const totalAmount = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

                // 1. Create Order Header
                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        buyer_id: user.id,
                        farmer_id: farmerId,
                        status: 'pending',
                        total_amount: totalAmount
                    })
                    .select()
                    .single();

                if (orderError) throw orderError;

                // 2. Create Order Items
                const orderItemsToInsert = items.map(i => ({
                    order_id: order.id,
                    product_id: i.id,
                    quantity: i.quantity,
                    price: i.price
                }));

                const { error: itemError } = await supabase
                    .from('order_items')
                    .insert(orderItemsToInsert);

                if (itemError) throw itemError;
            }

            // Clear Cart
            await AsyncStorage.removeItem('cart');
            setCartItems([]);

            Alert.alert("Success!", "Your orders have been placed successfully!", [
                { text: "View Orders", onPress: () => router.replace("/(tabs)/orders" as any) }
            ]);

        } catch (error: any) {
            Alert.alert("Checkout Failed", error.message);
        } finally {
            setCheckingOut(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#d97706" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800">My Cart</Text>
            </View>

            {cartItems.length === 0 ? (
                <View className="flex-1 justify-center items-center p-10">
                    <Ionicons name="cart-outline" size={80} color="#d1d5db" />
                    <Text className="text-xl font-bold text-gray-400 mt-4">Your cart is empty</Text>
                    <TouchableOpacity
                        onPress={() => router.push("/")}
                        className="mt-6 bg-amber-600 px-8 py-3 rounded-xl"
                    >
                        <Text className="text-white font-bold">Explore Marketplace</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <FlatList
                        data={cartItems}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: 24 }}
                        renderItem={({ item }) => (
                            <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100 flex-row">
                                <View className="w-20 h-20 bg-amber-50 rounded-xl items-center justify-center mr-4">
                                    <Text className="text-3xl">📦</Text>
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="font-bold text-gray-800 text-lg" numberOfLines={1}>{item.name}</Text>
                                        <TouchableOpacity onPress={() => removeItem(item.id)}>
                                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text className="text-amber-700 font-bold mb-3">${item.price}</Text>

                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center bg-gray-50 rounded-lg border border-gray-100 p-1">
                                            <TouchableOpacity
                                                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-8 h-8 items-center justify-center bg-white rounded shadow-sm"
                                            >
                                                <Text className="text-lg font-bold">-</Text>
                                            </TouchableOpacity>
                                            <Text className="font-bold text-base px-4">{item.quantity}</Text>
                                            <TouchableOpacity
                                                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-8 h-8 items-center justify-center bg-white rounded shadow-sm"
                                            >
                                                <Text className="text-lg font-bold">+</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <Text className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    />

                    {/* Footer Summary */}
                    <View className="bg-white p-6 border-t border-gray-100 shadow-lg">
                        <View className="flex-row justify-between mb-6">
                            <Text className="text-gray-500 text-lg">Total Amount</Text>
                            <Text className="text-2xl font-bold text-gray-900">${calculateTotal()}</Text>
                        </View>
                        <TouchableOpacity
                            className={`w-full py-4 rounded-xl items-center ${checkingOut ? 'bg-gray-400' : 'bg-amber-600'}`}
                            onPress={handleCheckout}
                            disabled={checkingOut}
                        >
                            {checkingOut ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Checkout Order</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}
