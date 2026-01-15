
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

    const testStatuses = ['pending', 'Pending', 'PENDING', 'confirmed', 'Confirmed', 'delivered', 'Delivered'];

    for (const s of testStatuses) {
        console.log(`Testing status: '${s}'...`);
        const { error } = await supabase.from('orders').insert({
            buyer_id: buyerId,
            status: s,
            total_amount: 1
        });
        if (error) {
            console.log(`  Failed: ${error.message}`);
        } else {
            console.log(`  SUCCESS! '${s}' is valid.`);
        }
    }
}

run();
