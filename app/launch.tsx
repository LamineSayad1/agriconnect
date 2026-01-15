import { supabase } from "@/lib/supabaseClient";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StatusBar, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

export default function LaunchScreen() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }),
        ]).start();

        const checkSessionAndNavigate = async () => {
            try {
                // Short delay to let the animation breathe
                await new Promise(resolve => setTimeout(resolve, 2500));

                const { data: { session }, error } = await supabase.auth.getSession();

                if (session) {
                    router.replace("/(app)/(tabs)");
                } else {
                    router.replace("/(auth)/login");
                }
            } catch (error) {
                console.error("Initialization error:", error);
                router.replace("/(auth)/login");
            }
        };

        checkSessionAndNavigate();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={["#16a34a", "#15803d", "#14532d"]}
                style={styles.gradient}
            >
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconText}>🌱</Text>
                    </View>
                    <Text style={styles.brandName}>AgriConnect</Text>
                    <Text style={styles.tagline}>L'avenir de l'agriculture</Text>
                </Animated.View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Chargement...</Text>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    logoContainer: {
        alignItems: "center",
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    iconText: {
        fontSize: 50,
    },
    brandName: {
        fontSize: 42,
        fontWeight: "800",
        color: "white",
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.8)",
        marginTop: 10,
        fontWeight: "500",
    },
    footer: {
        position: "absolute",
        bottom: 50,
    },
    footerText: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 14,
        fontWeight: "400",
    },
});
