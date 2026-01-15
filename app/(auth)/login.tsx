
import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UserType = 'farmer' | 'buyer' | 'supplier';

interface User {
  id: string;
  full_name: string;
  role: UserType;
  email: string;
  phone?: string;
}

export default function EntryScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      console.log('[EntryScreen] Checking session...');
      const isLoggingOut = await AsyncStorage.getItem('logging_out');

      if (isLoggingOut === 'true') {
        console.log('[EntryScreen] 🛡️ Logout Flag detected! Staying on login page.');
        await AsyncStorage.removeItem('logging_out');
        await supabase.auth.signOut();
        await AsyncStorage.removeItem('user_session');
        setCheckingSession(false);
        return;
      }

      // Petit délai pour éviter les faux positifs de Supabase
      await new Promise(resolve => setTimeout(resolve, 800));

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[EntryScreen] ✅ Session found, redirecting to app...');
        router.replace("/(app)/(tabs)");
      } else {
        console.log('[EntryScreen] ℹ️ No session found.');
      }
    } catch (e) {
      console.log('[EntryScreen] Session check error:', e);
    } finally {
      setCheckingSession(false);
    }
  }, [router]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = (): { valid: boolean; error?: string } => {
    if (!email.trim()) {
      return { valid: false, error: "Please enter your email" };
    }
    if (!validateEmail(email.trim())) {
      return { valid: false, error: "Please enter a valid email address" };
    }
    if (!password) {
      return { valid: false, error: "Please enter your password" };
    }
    return { valid: true };
  };

  const saveUserSession = async (user: User) => {
    try {
      await AsyncStorage.setItem('user_session', JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        timestamp: new Date().toISOString(),
      }));

      if (rememberMe) {
        await AsyncStorage.setItem('remember_email', email.trim().toLowerCase());
      } else {
        await AsyncStorage.removeItem('remember_email');
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleLogin = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      Alert.alert("Validation Error", validation.error);
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user data returned from login");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role, phone")
        .eq("id", authData.user.id)
        .single();

      if (profileError) throw new Error("Failed to fetch user profile.");
      if (!profile) throw new Error("User profile not found.");

      await saveUserSession({
        id: authData.user.id,
        full_name: profile.full_name,
        email: authData.user.email || email,
        role: profile.role as UserType,
        phone: profile.phone,
      });

      router.replace("/(app)/(tabs)");

    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim() || !validateEmail(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address first.");
      return;
    }
    Alert.alert("Reset Password", "Check your email for instructions.");
  };

  if (checkingSession) {
    return (
      <View className="flex-1 bg-[#166534] justify-center items-center">
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Abstract Background Shapes */}
      <View className="absolute inset-0 overflow-hidden">
        {/* Top Right Blob */}
        <View className="absolute -top-40 -right-40 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-60" />
        {/* Bottom Left Blob */}
        <View className="absolute -bottom-40 -left-20 w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-60" />
        {/* Center Accent */}
        <View className="absolute top-1/4 left-1/4 w-60 h-60 bg-lime-50 rounded-full blur-3xl opacity-40" />
      </View>

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-8 flex-1 justify-center py-10">

              {/* Brand Header */}
              <View className="items-center mb-12">
                <View className="bg-green-600 p-5 rounded-3xl mb-6 shadow-xl rotation-3">
                  <Ionicons name="leaf" size={42} color="white" />
                </View>
                <Text className="text-gray-900 text-4xl font-extrabold tracking-tight mb-2">
                  AgriConnect
                </Text>
                <Text className="text-gray-500 text-base font-medium">
                  Your Farm, Connected.
                </Text>
              </View>

              {/* Login Form Container */}
              <View className="bg-white/90 p-8 rounded-[32px] border border-white shadow-2xl">
                <Text className="text-gray-900 text-3xl font-bold mb-8 text-center tracking-tight">Welcome Back</Text>

                <View>
                  {/* Email Input */}
                  <View className="bg-gray-50/50 rounded-2xl flex-row items-center px-4 border border-gray-200 focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100 mb-10">
                    <Ionicons name="mail-outline" size={22} color="#6b7280" />
                    <TextInput
                      placeholder="Email Address"
                      placeholderTextColor="#9ca3af"
                      className="flex-1 py-5 px-4 text-gray-900 font-semibold text-base"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                    />
                  </View>

                  {/* Password Input */}
                  <View className="bg-gray-50/50 rounded-2xl flex-row items-center px-4 border border-gray-200 focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100 mb-6">
                    <Ionicons name="lock-closed-outline" size={22} color="#6b7280" />
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="#9ca3af"
                      className="flex-1 py-5 px-4 text-gray-900 font-semibold text-base"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#6b7280" />
                    </TouchableOpacity>
                  </View>

                  {/* Options Row */}
                  <View className="flex-row justify-between items-center mt-2 mb-8">
                    <TouchableOpacity
                      onPress={() => setRememberMe(!rememberMe)}
                      className="flex-row items-center py-2"
                      activeOpacity={0.7}>
                      <View className={`w-6 h-6 rounded-lg border-2 mr-3 items-center justify-center ${rememberMe ? 'bg-green-600 border-green-600' : 'border-gray-300 bg-white'}`}>
                        {rememberMe && <Ionicons name="checkmark" size={16} color="white" />}
                      </View>
                      <Text className="text-gray-600 text-sm font-semibold">Remember me</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleForgotPassword} className="py-2">
                      <Text className="text-green-600 text-sm font-bold">Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.9}
                    className={`py-5 rounded-2xl flex-row justify-center items-center shadow-xl ${loading ? 'bg-green-600/70' : 'bg-green-600'}`}>
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Text className="text-white font-bold text-xl mr-3 tracking-wide">Sign In</Text>
                        <Ionicons name="arrow-forward" size={24} color="white" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer Actions */}
              <View className="flex-row justify-center mt-12 mb-6">
                <Text className="text-gray-500 text-base">New to AgriConnect? </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                  <Text className="text-green-600 font-extrabold text-base">Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}