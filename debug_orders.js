
const { createClient } = require('@supabase/supabase-js');

// Mock AsyncStorage
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
    console.log("Fetching profiles for buyer_id...");
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    const buyerId = profiles && profiles[0]?.id;

    if (!buyerId) {
        console.log("No profile found to use as buyer.");
        return;
    }
    console.log("Using buyerId:", buyerId);

    // Test 1: lowercase 'pending'
    console.log("Attempting insert with status 'pending'...");
    const { error: err1 } = await supabase.from('orders').insert({
        buyer_id: buyerId,
        status: 'pending',
        total_amount: 10
    });

    if (err1) {
        console.error("Insert 'pending' failed:", err1.message);

        // Test 2: Capitalized 'Pending'
        console.log("Attempting insert with status 'Pending'...");
        const { error: err2 } = await supabase.from('orders').insert({
            buyer_id: buyerId,
            status: 'Pending',
            total_amount: 10
        });
        if (err2) {
            console.error("Insert 'Pending' failed:", err2.message);
        } else {
            console.log("Success with 'Pending'!");
        }

    } else {
        console.log("Success with 'pending'!");
    }
}

run();
