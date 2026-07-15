'use client';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Gagal Login: ' + error.message);
    } else {
      router.push('/');
      router.refresh();
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` }
    });

    if (error) {
      alert('Gagal Daftar: ' + error.message);
    } else {
      alert('Registrasi sukses! Silakan cek email Anda untuk verifikasi.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-bold text-center text-cyan-400 mb-6">REMSDIGI AUTH</h1>
        <form className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-400"
              required 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-gray-700 rounded-lg focus:outline-none focus:border-cyan-400"
              required 
            />
          </div>
          
          <div className="flex gap-4 pt-2">
            <button 
              onClick={handleLogin} 
              disabled={loading}
              className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 font-semibold rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Masuk'}
            </button>
            <button 
              onClick={handleRegister} 
              disabled={loading}
              className="flex-1 py-3 border border-gray-700 hover:bg-slate-800 font-semibold rounded-lg transition disabled:opacity-50"
            >
              Daftar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
