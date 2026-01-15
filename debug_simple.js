
const { createClient } = require('@supabase/supabase-js');

const AsyncStorage = {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
};

const supabaseUrl = "https://sfnsbbhmobtqnmqcoazh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbnNiYmhtb2J0cW5tcWNvYXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDgxMTYsImV4cCI6MjA4MjY4NDExNn0.la4ygFdB0Byi2gMP_sjtCClLVPb-NfHshkoFikO4jxI";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
    },
});

async function run() {
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    const buyerId = profiles && profiles[0]?.id;
    if (!buyerId) return;

    console.log("Testing 'pending'...");
    const { error: err1 } = await supabase.from('orders').insert({ buyer_id: buyerId, status: 'pending', total_amount: 1 });
    console.log("  'pending' result:", err1 ? err1.message : "SUCCESS");

    console.log("Testing 'Pending'...");
    const { error: err2 } = await supabase.from('orders').insert({ buyer_id: buyerId, status: 'Pending', total_amount: 1 });
    console.log("  'Pending' result:", err2 ? err2.message : "SUCCESS");
}

run();
