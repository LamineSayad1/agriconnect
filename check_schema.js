const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://sfnsbbhmobtqnmqcoazh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbnNiYmhtb2J0cW5tcWNvYXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDgxMTYsImV4cCI6MjA4MjY4NDExNn0.la4ygFdB0Byi2gMP_sjtCClLVPb-NfHshkoFikO4jxI";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .limit(1);

        if (error) {
            console.error("Error fetching product:", error);
            return;
        }

        if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            console.log("Columns:", columns);
            if (columns.includes('target_audience')) {
                console.log("RESULT: target_audience EXISTS");
            } else {
                console.log("RESULT: target_audience MISSING");
            }
        } else {
            console.log("No products found to infer schema via select.");
            const { error: insertError } = await supabase
                .from('products')
                .insert({ target_audience: 'test' });

            if (insertError && insertError.message.includes('column "target_audience" of relation "products" does not exist')) {
                console.log("RESULT: target_audience MISSING");
            } else {
                console.log("RESULT: target_audience MIGHT EXIST or error:", insertError?.message);
            }
        }
    } catch (e) {
        console.error("Script error:", e);
    }
}

checkSchema();
