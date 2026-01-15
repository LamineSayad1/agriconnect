import { supabase } from '@/lib/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Orders() {
  const router = useRouter();
  const [userType, setUserType] = useState<"farmer" | "buyer" | "supplier" | null>(null);
  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'completed'
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserAndOrders = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const type = profile?.role || "buyer";
      setUserType(type);

      // 2. Fetch Orders
      // Query filter depends on role

      const roleTheme: any = {
        buyer: {
          primary: "#d97706",
          secondary: "#fef3c7",
          text: "text-amber-700",
          bg: "bg-amber-50",
          border: "border-amber-100",
          icon: "bag-handle-outline"
        },
        farmer: {
          primary: "#10b981",
          secondary: "#dcfce7",
          text: "text-emerald-700",
          bg: "bg-emerald-50",
          border: "border-emerald-100",
          icon: "leaf-outline"
        },
        supplier: {
          primary: "#1e40af",
          secondary: "#dbeafe",
          text: "text-blue-700",
          bg: "bg-blue-50",
          border: "border-blue-100",
          icon: "construct-outline"
        }
      };

      if (type === 'buyer') {
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select(`
                *,
                items:order_items (
                    *,
                    product:products (name, price)
                )
            `)
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) console.error(error);

        // Client-side status filter
        const filtered = (ordersData || []).filter(o => {
          const isComplete = ['delivered', 'cancelled'].includes(o.status);
          return activeTab === 'active' ? !isComplete : isComplete;
        });
        setOrders(filtered);

      } else if (type === 'farmer') {
        // For farmers, get items they sold
        // We query order_items -> products where farmer_id = me
        const { data: itemsData, error } = await supabase
          .from('order_items')
          .select(`
                *,
                order:orders (id, created_at, status, buyer_id),
                product:products!inner (name, farmer_id)
            `)
          .eq('product.farmer_id', user.id)
          .order('created_at', { foreignTable: 'order', ascending: false });

        if (error) console.error(error);

        // Group items by Order? Or just list items to ship.
        // Listing items to ship is often clearer for farmers.
        // Filter by status of the PARENT order?
        const filtered = (itemsData || []).filter(item => {
          const status = item.order?.status || 'pending';
          const isComplete = ['delivered', 'cancelled'].includes(status);
          return activeTab === 'active' ? !isComplete : isComplete;
        });
        setOrders(filtered);
      } else if (type === 'supplier') {
        // For suppliers, get requests for their items
        const { data: requestsData, error } = await supabase
          .from('supply_requests')
          .select(`
                *,
                supply:supplies (id, name, price, supplier_id),
                farmer:profiles!supply_requests_farmer_id_fkey (id, full_name, location)
            `)
          .eq('supply.supplier_id', user.id)
          .order('created_at', { ascending: false });

        if (error) console.error("Supplier fetch error:", error);

        const filtered = (requestsData || []).filter(req => {
          const isComplete = ['delivered', 'cancelled'].includes(req.status);
          return activeTab === 'active' ? !isComplete : isComplete;
        });
        setOrders(filtered);
      }
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchUserAndOrders();
  }, [activeTab, fetchUserAndOrders]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return "bg-yellow-100 text-yellow-800";
      case 'shipped': return "bg-blue-100 text-blue-800";
      case 'delivered': return "bg-green-100 text-green-800";
      case 'cancelled': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Only Farmers should update status
  const handleUpdateStatus = async (orderId: string, currentStatus: string, isSupplyRequest = false) => {
    // If we are updating the main ORDER status (assuming 1-1 mapping for simplicity or updating parent)
    const nextStatus = currentStatus === 'pending' ? 'shipped' : 'delivered';

    Alert.alert(
      "Update Order",
      `Mark order as ${nextStatus}?`,
      [
        { text: "Cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const table = isSupplyRequest ? 'supply_requests' : 'orders';
            const { error } = await supabase
              .from(table)
              .update({ status: nextStatus })
              .eq('id', orderId);

            if (error) Alert.alert("Error", error.message);
            else fetchUserAndOrders();
          }
        }
      ]
    );
  };

  const isSupplier = userType === 'supplier';
  const isFarmer = userType === 'farmer';
  const isBuyer = userType === 'buyer';

  const primaryText = isSupplier ? "text-blue-800" : isFarmer ? "text-emerald-800" : "text-amber-800";
  const primaryBg = isSupplier ? "bg-blue-600" : isFarmer ? "bg-emerald-600" : "bg-amber-600";
  const primaryBorder = isSupplier ? "border-blue-500" : isFarmer ? "border-emerald-500" : "border-amber-500";
  const activeTabText = isSupplier ? "text-blue-600" : isFarmer ? "text-emerald-600" : "text-amber-600";

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator
          size="large"
          color={isSupplier ? "#2563eb" : isFarmer ? "#10b981" : "#d97706"}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 32, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' }}>
        <View className={`w-14 h-14 rounded-2xl ${isSupplier ? 'bg-blue-50' : isFarmer ? 'bg-emerald-50' : 'bg-amber-50'} items-center justify-center mb-4`}>
          <Ionicons
            name={isSupplier ? "cube" : isFarmer ? "leaf" : "cart"}
            size={32}
            color={isSupplier ? "#2563eb" : isFarmer ? "#10b981" : "#d97706"}
          />
        </View>
        <Text className={`text-3xl font-extrabold ${primaryText}`}>
          {isFarmer ? "My Sales" : "My Orders"}
        </Text>
        <View className={`h-1.5 w-10 ${primaryBg} rounded-full mt-2 mb-3`} />
        <Text className="text-gray-500 text-sm font-medium text-center px-4">
          {isFarmer ? 'Manage and track your product sales' :
            isSupplier ? 'Track and fulfill your supply requests' : 'Your complete purchase history'}
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 32, backgroundColor: 'white', paddingTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 16, borderBottomWidth: 4, borderBottomColor: activeTab === 'active' ? (isSupplier ? '#3b82f6' : isFarmer ? '#10b981' : '#d97706') : 'transparent' }}
          onPress={() => setActiveTab("active")}
        >
          <Text className={`text-center font-black text-[15px] ${activeTab === 'active' ? activeTabText : 'text-gray-300'}`}>
            ACTIVE
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 16, borderBottomWidth: 4, borderBottomColor: activeTab === 'completed' ? (isSupplier ? '#3b82f6' : isFarmer ? '#10b981' : '#d97706') : 'transparent' }}
          onPress={() => setActiveTab("completed")}
        >
          <Text className={`text-center font-black text-[15px] ${activeTab === 'completed' ? activeTabText : 'text-gray-300'}`}>
            HISTORY
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {orders.length > 0 ? (
          orders.map((item) => {
            const status = isBuyer || isSupplier ? item.status : item.order?.status;
            const date = isBuyer || isSupplier ? item.created_at : item.order?.created_at;

            const displayTitle = isBuyer
              ? `Order #${item.id.substring(0, 8)}`
              : isSupplier
                ? item.supply?.name
                : item.product?.name;

            const displaySub = isBuyer
              ? `${item.items?.length || 0} items purchased`
              : isSupplier
                ? `Requester: ${item.farmer?.full_name}`
                : `Customer: ${item.order?.buyer_id?.substring(0, 8)}`;

            return (
              <View key={item.id} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm mb-6">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1 pr-4">
                    <Text className="font-black text-gray-900 text-2xl tracking-tighter" numberOfLines={1}>
                      {displayTitle}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons
                        name={isSupplier ? "person-outline" : isBuyer ? "basket-outline" : "person-outline"}
                        size={14}
                        color="#9ca3af"
                      />
                      <Text className="text-gray-400 font-bold text-xs ml-1">{displaySub}</Text>
                    </View>
                  </View>
                  <View className={`px-4 py-2 rounded-2xl ${getStatusColor(status).split(' ')[0]}`}>
                    <Text className={`text-[10px] font-black tracking-[2px] ${getStatusColor(status).split(' ')[1]}`}>
                      {status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Content Section */}
                <View className="bg-gray-50/50 rounded-3xl p-4 mb-4 border border-gray-50">
                  {isBuyer && item.items?.length > 0 ? (
                    item.items.map((orderItem: any) => (
                      <View key={orderItem.id} className="flex-row justify-between items-center py-1.5">
                        <Text className="text-gray-700 text-sm font-bold">• {orderItem.product?.name}</Text>
                        <Text className="text-gray-400 text-xs font-black">X{orderItem.quantity}</Text>
                      </View>
                    ))
                  ) : (
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Quantity</Text>
                        <Text className="text-lg font-black text-gray-800">{item.quantity || '--'}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Value</Text>
                        <Text className={`text-lg font-black ${primaryText}`}>
                          ${((item.price || item.product?.price || item.supply?.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <View className="flex-row justify-between items-center pt-2">
                  <View>
                    <Text className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Transaction Date</Text>
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={12} color="#4b5563" />
                      <Text className="text-xs text-gray-700 font-black ml-1">
                        {new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    {isFarmer && activeTab === 'active' && item.order?.id && (
                      <TouchableOpacity
                        onPress={() => item.order?.id && handleUpdateStatus(item.order.id, status)}
                        className="bg-emerald-600 px-6 py-3 rounded-2xl shadow-md shadow-emerald-200 active:scale-95 transition-all"
                      >
                        <Text className="text-white text-xs font-black uppercase tracking-widest">Update Bill</Text>
                      </TouchableOpacity>
                    )}

                    {isSupplier && activeTab === 'active' && (
                      <TouchableOpacity
                        onPress={() => handleUpdateStatus(item.id, status, true)}
                        className="bg-blue-600 px-6 py-3 rounded-2xl shadow-md shadow-blue-200 active:scale-95 transition-all"
                      >
                        <Text className="text-white text-xs font-black uppercase tracking-widest">Dispatch</Text>
                      </TouchableOpacity>
                    )}

                    {isBuyer && status === 'delivered' && (
                      <TouchableOpacity
                        onPress={() => router.push({ pathname: "/submit-review", params: { orderId: item.id, productId: item.items?.[0]?.product_id, productName: item.items?.[0]?.product?.name } })}
                        className="bg-amber-600 px-6 py-3 rounded-2xl shadow-md shadow-amber-200 active:scale-95 transition-all"
                      >
                        <Text className="text-white text-xs font-black uppercase tracking-widest">Review</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View className="py-32 items-center px-10">
            <View className={`w-24 h-24 ${isSupplier ? 'bg-blue-50' : isFarmer ? 'bg-emerald-50' : 'bg-amber-50'} rounded-[40px] items-center justify-center mb-6`}>
              <Ionicons
                name="file-tray-outline"
                size={40}
                color={isSupplier ? "#2563eb" : isFarmer ? "#10b981" : "#d97706"}
              />
            </View>
            <Text className="text-gray-900 text-2xl font-black text-center">Empty Inbox</Text>
            <Text className="text-gray-400 text-sm text-center mt-3 font-medium leading-5">
              {isFarmer ? "No sales activity recorded yet. Listing more products might help!" :
                isSupplier ? "No supply requests currently pending. Refresh to check for new leads." :
                  "You haven't placed any orders yet. Start exploring the marketplace!"}
            </Text>
          </View>
        )}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
