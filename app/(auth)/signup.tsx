import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UserRole = "farmer" | "buyer" | "supplier";

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export default function Signup() {
  const router = useRouter();

  const [role, setRole] = useState<UserRole>("farmer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validatePassword = (value: string): ValidationResult => {
    if (value.length < 8) return { valid: false, error: "Password must be at least 8 characters" };
    if (!/[A-Z]/.test(value)) return { valid: false, error: "Password must contain at least one uppercase letter" };
    if (!/[0-9]/.test(value)) return { valid: false, error: "Password must contain at least one number" };
    return { valid: true };
  };

  const validateForm = (): ValidationResult => {
    if (!fullName.trim()) return { valid: false, error: "Please enter your full name" };
    if (fullName.trim().length < 2) return { valid: false, error: "Name must be at least 2 characters" };

    const e = email.trim().toLowerCase();
    if (!e) return { valid: false, error: "Please enter your email" };
    if (!validateEmail(e)) return { valid: false, error: "Please enter a valid email address" };

    if (!password) return { valid: false, error: "Please enter a password" };
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) return passwordValidation;

    if (password !== confirmPassword) return { valid: false, error: "Passwords do not match" };

    const p = phone.trim();
    if (!p) return { valid: false, error: "Please enter your phone number" };
    if (p.length < 8) return { valid: false, error: "Please enter a valid phone number" };

    return { valid: true };
  };

  const handleSignup = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      Alert.alert("Validation Error", validation.error);
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: role,
            phone: phone.trim(),
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user data returned from signup");

      // Profile creation is now handled by a database trigger for reliability

      Alert.alert(
        "Account created",
        "You can now log in.",
        [{ text: "Go to Login", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (err: any) {
      Alert.alert("Signup Failed", err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleInfo = (roleType: UserRole) => {
    const roleConfig = {
      farmer: { emoji: "🌱", label: "Farmer" },
      buyer: { emoji: "🛒", label: "Buyer" },
      supplier: { emoji: "📦", label: "Supplier" },
    };
    return roleConfig[roleType];
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Background (ne doit jamais capter les touches) */}
      <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
        <View className="absolute -top-40 -left-40 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-60" />
        <View className="absolute top-1/2 -right-20 w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-60" />
        <View className="absolute bottom-0 left-20 w-72 h-72 bg-lime-50 rounded-full blur-3xl opacity-40" />
      </View>

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View className="px-6 pt-4">
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                activeOpacity={0.8}
                className="w-12 h-12 bg-white rounded-2xl border border-gray-100 items-center justify-center shadow-sm"
              >
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View className="px-8 pb-12">
              <View className="mt-8 mb-8">
                <Text className="text-gray-900 text-3xl font-bold tracking-tight mb-2">
                  Create Account
                </Text>
                <Text className="text-gray-500 text-base">
                  Join AgriConnect today.
                </Text>
              </View>

              {/* Card */}
              <View className="bg-white/90 p-6 rounded-[32px] border border-white shadow-2xl">
                {/* Roles */}
                <Text className="text-gray-700 font-bold mb-5 ml-1">I am a...</Text>

                <View className="flex-row justify-between mb-8">
                  {(["farmer", "buyer", "supplier"] as UserRole[]).map((r) => {
                    const roleInfo = getRoleInfo(r);
                    const isSelected = role === r;

                    return (
                      <TouchableOpacity
                        key={r}
                        onPress={() => setRole(r)}
                        activeOpacity={0.85}
                        className="flex-1 py-3 mx-1 rounded-2xl border-2 items-center justify-center"
                        style={{
                          backgroundColor: isSelected ? "#16a34a" : "#f9fafb",
                          borderColor: isSelected ? "#16a34a" : "#f3f4f6",
                        }}
                      >
                        <Text className="text-2xl mb-1">{roleInfo.emoji}</Text>
                        <Text className={`font-bold text-xs ${isSelected ? "text-white" : "text-gray-500"}`}>
                          {roleInfo.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Fields: gap au lieu de space-y */}
                <View className="gap-5">
                  {/* Full Name */}
                  <View className="bg-gray-50/60 rounded-2xl flex-row items-center px-4 border border-gray-200">
                    <Ionicons name="person-outline" size={20} color="#6b7280" />
                    <TextInput
                      placeholder="Full Name"
                      placeholderTextColor="#9ca3af"
                      className="flex-1 py-4 px-3 text-gray-900 font-semibold"
                      value={fullName}
                      onChangeText={setFullName}
                      editable={!loading}
                    />
                  </View>

                  {/* Email */}
                  <View className="bg-gray-50/60 rounded-2xl flex-row items-center px-4 border border-gray-200">
                    <Ionicons name="mail-outline" size={20} color="#6b7280" />
                    <TextInput
                      placeholder="Email Address"
                      placeholderTextColor="#9ca3af"
                      className="flex-1 py-4 px-3 text-gray-900 font-semibold"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                    />
                  </View>

                  {/* Phone */}
                  <View className="bg-gray-50/60 rounded-2xl flex-row items-center px-4 border border-gray-200">
                    <Ionicons name="call-outline" size={20} color="#6b7280" />
                    <TextInput
                      placeholder="Phone Number"
                      placeholderTextColor="#9ca3af"
                      className="flex-1 py-4 px-3 text-gray-900 font-semibold"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      editable={!loading}
                    />
                  </View>

                  {/* Password */}
                  <View className="bg-gray-50/60 rounded-2xl flex-row items-center px-4 border border-gray-200">
                    <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="#9ca3af"
                      className="flex-1 py-4 px-3 text-gray-900 font-semibold"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      className="p-2"
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Confirm Password */}
                  <View className="bg-gray-50/60 rounded-2xl flex-row items-center px-4 border border-gray-200 ">
                    <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
                    <TextInput
                      placeholder="Confirm Password"
                      placeholderTextColor="#9ca3af"
                      className="flex-1 py-4 px-3 text-gray-900  font-semibold"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword((v) => !v)}
                      className="p-2"
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Submit */}
                  <TouchableOpacity
                    onPress={handleSignup}
                    disabled={loading}
                    activeOpacity={0.9}
                    className={`mt-10 py-5 rounded-2xl flex-row justify-center items-center shadow-xl ${loading ? 'bg-green-600/70' : 'bg-green-600'}`}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Text className="text-white font-bold text-xl mr-2 tracking-wide">
                          Create Account
                        </Text>
                        <Ionicons name="chevron-forward" size={24} color="white" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer */}
              <View className="flex-row justify-center mt-8 mb-6">
                <Text className="text-gray-500 text-base">Already a member? </Text>
                <TouchableOpacity onPress={() => router.replace("/(auth)/login")} activeOpacity={0.8}>
                  <Text className="text-green-600 font-extrabold text-base">Sign In</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
