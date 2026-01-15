import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SubmitReview() {
    const { productId, productName } = useLocalSearchParams();
    const router = useRouter();

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!comment.trim()) {
            Alert.alert("Error", "Please provide a brief comment.");
            return;
        }

        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from('reviews')
                .insert({
                    product_id: productId,
                    buyer_id: user.id,
                    rating: rating,
                    comment: comment.trim()
                });

            if (error) throw error;

            Alert.alert("Success", "Thank you for your review!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="close" size={28} color="black" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800">Submit Review</Text>
            </View>

            <View className="p-6">
                <Text className="text-gray-500 text-sm mb-1">Product</Text>
                <Text className="text-xl font-bold text-gray-900 mb-6">{productName}</Text>

                <Text className="text-gray-700 font-bold mb-3">Rating</Text>
                <View className="flex-row items-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => setRating(s)}>
                            <Ionicons
                                name={s <= rating ? "star" : "star-outline"}
                                size={40}
                                color={s <= rating ? "#eab308" : "#d1d5db"}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <Text className="text-gray-700 font-bold mb-3">Your Experience</Text>
                <TextInput
                    className="bg-gray-50 rounded-2xl p-4 text-base text-gray-800 border border-gray-100 mb-8"
                    placeholder="Tell us what you liked or how it could be better..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={comment}
                    onChangeText={setComment}
                />

                <TouchableOpacity
                    className={`w-full py-4 rounded-xl flex-row justify-center items-center ${submitting ? 'bg-gray-400' : 'bg-green-600'}`}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Post Review</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
