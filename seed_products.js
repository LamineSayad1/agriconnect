
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://sfnsbbhmobtqnmqcoazh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbnNiYmhtb2J0cW5tcWNvYXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDgxMTYsImV4cCI6MjA4MjY4NDExNn0.la4ygFdB0Byi2gMP_sjtCClLVPb-NfHshkoFikO4jxI";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

const farmerEmail = "seed_farmer_new@test.com";
const supplierEmail = "seed_supplier_new@test.com";
const password = "Password123!";

const products = [
    { name: "Pommes Golden", category: "fruits", price: 2.5, unit: "kg", stock_quantity: 100, description: "Pommes délicieuses du verger." },
    { name: "Tomates Bio", category: "vegetables", price: 3.0, unit: "kg", stock_quantity: 50, description: "Tomates juteuses sans pesticides." },
    { name: "Lait Frais", category: "dairy", price: 1.2, unit: "l", stock_quantity: 30, description: "Lait de vache frais du matin." },
    { name: "Blé Tendre", category: "grains", price: 0.8, unit: "kg", stock_quantity: 500, description: "Blé pour farine de qualité." },
    { name: "Fraises", category: "fruits", price: 5.0, unit: "kg", stock_quantity: 20, description: "Fraises sucrées de saison." },
    { name: "Carottes", category: "vegetables", price: 1.5, unit: "kg", stock_quantity: 80, description: "Carottes croquantes." },
];

const supplies = [
    { name: "Engrais Azoté", category: "fertilizer", price: 25.0, stock: 40, description: "Engrais riche en azote pour croissance rapide." },
    { name: "Pelle Robuste", category: "tools", price: 15.0, stock: 10, description: "Pelle en acier trempé." },
    { name: "Graines de Mais", category: "seeds", price: 10.0, stock: 100, description: "Graines de maïs à haut rendement." },
    { name: "Aliment Poulet", category: "feed", price: 12.0, stock: 60, description: "Mélange complet pour volailles." },
    { name: "Sécateur Pro", category: "tools", price: 35.0, stock: 15, description: "Sécateur ergonomique." },
];

async function authenticateUser(email, role) {
    console.log(`Authenticating ${role} (${email})...`);

    // Try sign in first
    let { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error || !user) {
        console.log(`User not found or error, creating new user...`);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: `Seed ${role}`,
                    role: role,
                    phone: "12345678"
                }
            }
        });

        if (signUpError) {
            console.error(`Error signing up ${role}:`, signUpError.message);
            return null;
        }
        user = signUpData.user;
    }

    if (!user) {
        console.error("Failed to get user object.");
        return null;
    }

    console.log(`User ${user.id} authenticated.`);
    return user;
}

async function seed() {
    // 1. Seed Farmer Products
    const farmerUser = await authenticateUser(farmerEmail, 'farmer');
    if (farmerUser) {
        // Check if profile exists (managed by trigger usually, but just in case)
        // We rely on the auth user id being the profile id.

        console.log("Inserting products...");
        for (const p of products) {
            const { error } = await supabase.from('products').insert({
                ...p,
                farmer_id: farmerUser.id
            });
            if (error) console.error("Error inserting product:", error.message);
            else console.log(`Inserted product: ${p.name}`);
        }
    }

    // 2. Seed Supplier Supplies
    const supplierUser = await authenticateUser(supplierEmail, 'supplier');
    if (supplierUser) {
        console.log("Inserting supplies...");
        for (const s of supplies) {
            const { error } = await supabase.from('supplies').insert({
                ...s,
                supplier_id: supplierUser.id
            });
            if (error) console.error("Error inserting supply:", error.message);
            else console.log(`Inserted supply: ${s.name}`);
        }
    }
}

seed().then(() => console.log("Seeding complete."));
