import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        // Use a timeout to ensure the navigation tree is mounted
        const timer = setTimeout(() => {
            router.replace("/launch");
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
            <ActivityIndicator size="large" color="#16a34a" />
        </View>
    );
}
