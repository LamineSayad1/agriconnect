import { supabase } from "@/lib/supabaseClient";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Image, StatusBar, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

export default function LaunchScreen() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const iconRotateAnim = useRef(new Animated.Value(0)).current;
    const iconPulseAnim = useRef(new Animated.Value(1)).current;
    const titleSlideAnim = useRef(new Animated.Value(30)).current;
    const taglineSlideAnim = useRef(new Animated.Value(30)).current;
    const loadingOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Sophisticated staggered animation sequence
        Animated.sequence([
            // Icon entrance with spring physics
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.spring(iconRotateAnim, {
                    toValue: 1,
                    tension: 40,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
            // Stagger text animations
            Animated.parallel([
                Animated.spring(titleSlideAnim, {
                    toValue: 0,
                    tension: 60,
                    friction: 8,
                    useNativeDriver: true,
                    delay: 100,
                }),
                Animated.spring(taglineSlideAnim, {
                    toValue: 0,
                    tension: 60,
                    friction: 8,
                    useNativeDriver: true,
                    delay: 200,
                }),
                Animated.timing(loadingOpacity, {
                    toValue: 1,
                    duration: 600,
                    delay: 300,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Gentle breathing pulse on icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(iconPulseAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(iconPulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        const checkSessionAndNavigate = async () => {
            try {
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

    const iconRotate = iconRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={["#059669", "#10b981", "#047857", "#065f46"]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Radial overlay for depth */}
                <View style={styles.overlay} />

                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    {/* Icon with glow and pulse */}
                    <Animated.View
                        style={[
                            styles.iconCircle,
                            {
                                transform: [
                                    { rotate: iconRotate },
                                    { scale: iconPulseAnim }
                                ]
                            }
                        ]}
                    >
                        <View style={styles.glowEffect} />
                        <Image
                            source={require('@/assets/images/logo-icon.png')}
                            style={{ width: 70, height: 70 }}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    {/* Brand name with slide animation */}
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: titleSlideAnim }]
                        }}
                    >
                        <Text style={styles.brandName}>AgriConnect</Text>
                    </Animated.View>

                    {/* Tagline with slide animation */}
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: taglineSlideAnim }]
                        }}
                    >
                        <Text style={styles.tagline}>L'avenir de l'agriculture</Text>
                    </Animated.View>
                </Animated.View>

                {/* Animated loading indicator */}
                <Animated.View style={[styles.footer, { opacity: loadingOpacity }]}>
                    <View style={styles.loadingContainer}>
                        <LoadingDots />
                    </View>
                </Animated.View>
            </LinearGradient>
        </View>
    );
}

// Animated loading dots component
const LoadingDots = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createAnimation = (anim: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 600,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        Animated.parallel([
            createAnimation(dot1, 0),
            createAnimation(dot2, 200),
            createAnimation(dot3, 400),
        ]).start();
    }, []);

    return (
        <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { opacity: dot1 }]} />
            <Animated.View style={[styles.dot, { opacity: dot2 }]} />
            <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.1)",
    },
    logoContainer: {
        alignItems: "center",
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 28,
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.25)",
        shadowColor: "#fff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    glowEffect: {
        position: "absolute",
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        shadowColor: "#fff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
    },
    iconText: {
        fontSize: 56,
    },
    brandName: {
        fontSize: 46,
        fontWeight: "900",
        color: "white",
        letterSpacing: -0.5,
        textShadowColor: "rgba(0, 0, 0, 0.2)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    tagline: {
        fontSize: 15,
        color: "rgba(255, 255, 255, 0.85)",
        marginTop: 12,
        fontWeight: "500",
        letterSpacing: 0.5,
        textShadowColor: "rgba(0, 0, 0, 0.15)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    footer: {
        position: "absolute",
        bottom: 60,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    dotsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
    },
});
