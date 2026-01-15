const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://sfnsbbhmobtqnmqcoazh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbnNiYmhtb2J0cW5tcWNvYXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDgxMTYsImV4cCI6MjA4MjY4NDExNn0.la4ygFdB0Byi2gMP_sjtCClLVPb-NfHshkoFikO4jxI";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    try {
        const { data: p, error: pe } = await supabase.from('products').select('*').limit(1);
        console.log("Products columns:", pe ? pe.message : Object.keys(p[0] || {}));

        const { data: u, error: ue } = await supabase.from('profiles').select('*').limit(1);
        console.log("Profiles columns:", ue ? ue.message : Object.keys(u[0] || {}));

        const { data: o, error: oe } = await supabase.from('orders').select('*').limit(1);
        console.log("Orders columns:", oe ? oe.message : Object.keys(o[0] || {}));
    } catch (e) {
        console.error(e);
    }
}
check();
