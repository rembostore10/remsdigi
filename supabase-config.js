// Konfigurasi Environment (Jika di hosting lokal/cPanel, ganti dengan string langsung. Jika di Vercel, ia otomatis membaca env GitHub)
const SUPABASE_URL = window.env?.SUPABASE_URL || "https://XYZ_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = window.env?.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Inisialisasi Klien Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// LOGIKA AUTENTIKASI
async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    if (error) throw error;
    return data;
}

async function logoutUser() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}
