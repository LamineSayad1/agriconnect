import BuyerHome from "@/components/homes/BuyerHome";
import FarmerHome from "@/components/homes/FarmerHome";
import SupplierHome from "@/components/homes/SupplierHome";
import { supabase } from "@/lib/supabaseClient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export default function HomeDispatcher() {
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const aliveRef = useRef(true);

    const checkUser = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace("/(auth)/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (aliveRef.current && profile) {
                setRole(profile.role);
            }
        } catch (error) {
            console.error("Error checking user role:", error);
        } finally {
            if (aliveRef.current) setLoading(false);
        }
    }, [router]);

    useFocusEffect(
        useCallback(() => {
            aliveRef.current = true;
            checkUser();
            return () => {
                aliveRef.current = false;
            };
        }, [checkUser])
    );

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    if (!role) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
                <Text style={{ fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
                    Profile not found. Please contact support or try logging in again.
                </Text>
                {/* Attempt to reload or sign out */}
                <View style={{ flexDirection: 'row', gap: 15 }}>
                    <TouchableOpacity
                        onPress={() => {
                            setLoading(true);
                            checkUser();
                        }}
                        style={{ backgroundColor: '#059669', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={async () => {
                            await supabase.auth.signOut();
                            router.replace("/(auth)/login");
                        }}
                        style={{ backgroundColor: '#dc2626', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    switch (role) {
        case "farmer":
            return <FarmerHome />;
        case "buyer":
            return <BuyerHome />;
        case "supplier":
            return <SupplierHome />;
        default:
            return (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Text>Unknown Role: {role}</Text>
                    <TouchableOpacity
                        onPress={async () => {
                            await supabase.auth.signOut();
                            router.replace("/(auth)/login");
                        }}
                        style={{ marginTop: 20 }}
                    >
                        <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            );
    }
}
