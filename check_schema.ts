import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://sfnsbbhmobtqnmqcoazh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbnNiYmhtb2J0cW5tcWNvYXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDgxMTYsImV4cCI6MjA4MjY4NDExNn0.la4ygFdB0Byi2gMP_sjtCClLVPb-NfHshkoFikO4jxI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching product:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Columns in 'products' table:", Object.keys(data[0]));
    } else {
        console.log("No products found to infer schema.");
    }
}

checkSchema();
集中管理
