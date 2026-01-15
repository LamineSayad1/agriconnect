
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://sfnsbbhmobtqnmqcoazh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbnNiYmhtb2J0cW5tcWNvYXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDgxMTYsImV4cCI6MjA4MjY4NDExNn0.la4ygFdB0Byi2gMP_sjtCClLVPb-NfHshkoFikO4jxI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Checking reviews table...");
    const { data, error } = await supabase.from('reviews').select('id').limit(1);
    if (error) {
        console.log("Error accessing reviews:", error.message);
    } else {
        console.log("Reviews table exists. Data:", data);
    }
}

check();
