import { supabase } from "@/lib/supabaseClient";
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Search() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [searchQuery, setSearchQuery] = useState(q || "");
  const [activeFilter] = useState("all");
  const [userType, setUserType] = useState<"farmer" | "buyer" | "supplier">("buyer");
  const [loading, setLoading] = useState(false);

  const [results, setResults] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // ------------------------- GET USER TYPE -------------------------
  const loadUserType = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setUserType((data?.role as any) || "buyer");
  }, []);

  // ------------------------- LOAD RESULTS -------------------------
  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const isSearchForSupplies = userType === "farmer";
      const tableName = isSearchForSupplies ? "supplies" : "products";
      const ownerIdField = isSearchForSupplies ? "supplier_id" : "farmer_id";

      let query = supabase
        .from(tableName)
        .select(`*`);

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      // Filter by target audience for products
      if (tableName === "products") {
        if (userType === "buyer") {
          query = query.eq("target_audience", "buyer");
        } else if (userType === "supplier") {
          query = query.eq("target_audience", "supplier");
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        setResults([]);
        return;
      }

      const ownerIds = [...new Set(data.map(item => item[ownerIdField]).filter(Boolean))];

      let profilesMap: Record<string, any> = {};
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", ownerIds);

        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        }
      }

      const mappedResults = data.map(item => {
        const owner = profilesMap[item[ownerIdField]] || {};
        return {
          ...item,
          ownerName: owner.full_name || "Unknown",
          ownerFarm: owner.farm_name || "Local Provider",
          displayPrice: isSearchForSupplies ? `$${item.price}` : `$${item.price}/kg`,
          emoji: isSearchForSupplies ? (item.category === 'tools' ? '🚜' : '🌱') : (item.category === 'fruits' ? '🍎' : '🥬')
        };
      });

      setResults(mappedResults);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, userType]);

  const loadFarms = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, farm_name, rating, role")
      .eq("role", "farmer");

    if (!error && data) setFarms(data);
  }, []);

  useEffect(() => { loadUserType(); }, [loadUserType]);
  useEffect(() => { if (q) setSearchQuery(q); }, [q]);
  useEffect(() => {
    loadResults();
    if (userType !== 'farmer') loadFarms();
  }, [selectedCategory, userType, loadResults, loadFarms]);

  const filteredResults = results.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFarms = farms.filter((farm) =>
    farm.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Role-based Design System
  const isSupplier = userType === 'supplier';
  const isFarmer = userType === 'farmer';
  const isBuyer = userType === 'buyer';

  const roleTheme: any = {
    buyer: {
      primary: "#d97706",
      secondary: "#fef3c7",
      text: "text-amber-600",
      primaryBg: "bg-amber-600",
      lightBg: "bg-amber-50",
      border: "border-amber-100",
      icon: "search-outline"
    },
    farmer: {
      primary: "#10b981",
      secondary: "#dcfce7",
      text: "text-emerald-600",
      primaryBg: "bg-emerald-600",
      lightBg: "bg-emerald-50",
      border: "border-emerald-100",
      icon: "leaf-outline"
    },
    supplier: {
      primary: "#1e40af",
      secondary: "#dbeafe",
      text: "text-blue-600",
      primaryBg: "bg-blue-600",
      lightBg: "bg-blue-50",
      border: "border-blue-100",
      icon: "construct-outline"
    }
  };
  const currentTheme = roleTheme[userType];

  const renderResult = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={{
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
      }}
      onPress={() => {
        const path = (userType === "farmer") ? "/supply-details" : "/product-details";
        router.push({ pathname: path as any, params: { id: item.id } });
      }}
    >
      <View className={`w-24 h-24 rounded-3xl items-center justify-center mr-4 overflow-hidden shadow-inner ${currentTheme.lightBg}`}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Text className="text-4xl">{item.emoji}</Text>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-start">
          <Text className="font-black text-gray-900 text-xl tracking-tight flex-1" numberOfLines={1}>
            {item.name}
          </Text>
          <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-xl">
            <Ionicons name="star" size={10} color="#f59e0b" />
            <Text className="text-gray-900 font-bold text-[10px] ml-1">{item.rating || "4.5"}</Text>
          </View>
        </View>

        <Text className="text-gray-400 font-bold text-xs mt-0.5" numberOfLines={1}>
          {item.ownerFarm || item.ownerName}
        </Text>

        <View className="flex-row items-center justify-between mt-3">
          <View className={`${currentTheme.lightBg} px-3 py-1.5 rounded-2xl`}>
            <Text className={`${currentTheme.text} font-black text-sm`}>{item.displayPrice}</Text>
          </View>
          <View className={`w-8 h-8 rounded-full ${currentTheme.primaryBg} items-center justify-center shadow-sm`}>
            <Ionicons name="chevron-forward" size={16} color="white" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFarm = (farm: any) => (
    <TouchableOpacity
      key={farm.id}
      className="bg-white rounded-[32px] p-4 border border-gray-100 shadow-sm mb-4 flex-row items-center"
    >
      <View className="w-20 h-20 bg-blue-50 rounded-3xl items-center justify-center mr-4">
        <Text className="text-3xl">🏞️</Text>
      </View>

      <View className="flex-1">
        <Text className="font-black text-gray-900 text-lg tracking-tight">{farm.full_name}</Text>
        <Text className="text-gray-400 font-bold text-xs mt-0.5" numberOfLines={1}>
          {farm.farm_name || "Professional Farm"}
        </Text>

        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center">
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text className="text-gray-900 font-black text-xs ml-1">{farm.rating || "4.7"}</Text>
          </View>
          <Text className="text-blue-600 font-black text-xs uppercase tracking-widest">Visit Farm</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 16, backgroundColor: 'white' }}>
        <View className="flex-row justify-between items-center mb-1">
          <Text className={`text-4xl font-black tracking-tighter ${isFarmer ? 'text-emerald-800' : isSupplier ? 'text-blue-800' : 'text-amber-800'}`}>
            {isFarmer ? "Equipment" : isSupplier ? "Inventory" : "Search"}
          </Text>
          <View className={`w-12 h-12 rounded-2xl ${currentTheme.lightBg} items-center justify-center`}>
            <Ionicons name={isFarmer ? "hammer" : isSupplier ? "cube" : "search"} size={24} color={currentTheme.primary} />
          </View>
        </View>
        <Text className="text-gray-400 font-bold text-sm mb-4">
          {isFarmer ? "Find tools & seeds for your land" : isSupplier ? "Find products from farmers" : "Explore fresh organic products"}
        </Text>

        {/* SEARCH BAR */}
        <View className="bg-gray-100/80 rounded-[28px] px-5 py-2 flex-row items-center mb-6 border border-gray-50">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            placeholder={isFarmer ? "Search tools, seeds..." : isSupplier ? "Search farm inventory..." : "What are you looking for?"}
            className="flex-1 text-gray-900 font-bold text-base ml-3 py-3"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#d1d5db" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* CATEGORY FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-full mr-2 shadow-sm ${!selectedCategory ? currentTheme.primaryBg : 'bg-white border border-gray-100'}`}
          >
            <Text className={`${!selectedCategory ? 'text-white' : 'text-gray-400'} font-black text-xs uppercase tracking-widest`}>All</Text>
          </TouchableOpacity>
          {(isFarmer
            ? ['seeds', 'tools', 'fertilizer', 'feed']
            : ['fruits', 'vegetables', 'dairy', 'grains', 'meat']
          ).map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-full mr-2 shadow-sm ${selectedCategory === cat ? currentTheme.primaryBg : 'bg-white border border-gray-100'}`}
            >
              <Text className={`${selectedCategory === cat ? 'text-white' : 'text-gray-400'} font-black text-xs uppercase tracking-widest capitalize`}>{cat}</Text>
            </TouchableOpacity>
          ))}
          <View className="w-6" />
        </ScrollView>
      </View>

      {/* RESULTS */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="py-20">
            <ActivityIndicator size="large" color={currentTheme.primary} />
          </View>
        ) : (
          <>
            {filteredResults.length > 0 && (
              <>
                <View className="flex-row justify-between items-end mb-4 px-2">
                  <Text className="text-xl font-black text-gray-900 tracking-tight">
                    {isFarmer ? 'Supply Results' : isSupplier ? 'Farm Products' : 'Best Matches'}
                  </Text>
                  <Text className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.text}`}>
                    {filteredResults.length} FOUND
                  </Text>
                </View>
                {filteredResults.map(renderResult)}
              </>
            )}

            {isBuyer && filteredFarms.length > 0 && (
              <>
                <View className="flex-row justify-between items-end mt-8 mb-4 px-2">
                  <Text className="text-xl font-black text-gray-900 tracking-tight">Top Farms</Text>
                  <Text className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    {filteredFarms.length} DISCOVERED
                  </Text>
                </View>
                {filteredFarms.map(renderFarm)}
              </>
            )}

            {!loading && searchQuery && filteredResults.length === 0 && filteredFarms.length === 0 && (
              <View className="items-center justify-center py-20">
                <View className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${currentTheme.lightBg}`}>
                  <Ionicons name="search-outline" size={48} color={currentTheme.primary} />
                </View>
                <Text className="text-xl font-black text-gray-900 tracking-tight mb-2">No Results Found</Text>
                <Text className="text-gray-400 font-bold text-center px-10">
                  Try adjusting your search or filters to find what you're looking for.
                </Text>
              </View>
            )}
          </>
        )}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
