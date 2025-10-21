'use client';
import { useState } from 'react';
import { useRegister } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const registerMutation = useRegister();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); // Bersihkan error sebelumnya

    if (!username || !email || !password || !password2) {
      setError('Semua field harus diisi.');
      return;
    }

    if (password !== password2) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }
    
    // Role 'Viewer' akan di-handle oleh backend jika dikosongkan
    // Sesuai dengan backend serializer
    registerMutation.mutate(
      { username, email, password, password2, role: 'Viewer' },
      {
        onError: (err) => {
          // Menampilkan error validasi dari server
          const serverErrors = err.response?.data;
          if (serverErrors) {
            const errorMessages = Object.entries(serverErrors)
              .map(([key, value]) => `${key}: ${value.join(', ')}`)
              .join('\n');
            setError(errorMessages || 'Registrasi gagal.');
          } else {
            setError('Registrasi gagal. Silakan coba lagi.');
          }
        },
      }
    );
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <form onSubmit={handleSubmit}>
        <h2 style={{ textAlign: 'center' }}>Register Akun Baru</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={registerMutation.isPending}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={registerMutation.isPending}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={registerMutation.isPending}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password2" style={{ display: 'block', marginBottom: '5px' }}>Konfirmasi Password</label>
          <input
            id="password2"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            disabled={registerMutation.isPending}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={registerMutation.isPending} 
          style={{ width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {registerMutation.isPending ? 'Mendaftarkan...' : 'Register'}
        </button>

        {(error || registerMutation.isError) && (
          <p style={{ color: 'red', textAlign: 'center', marginTop: '10px', whiteSpace: 'pre-wrap' }}>
            {error || 'Registrasi gagal.'}
          </p>
        )}

        <p style={{ textAlign: 'center', marginTop: '15px' }}>
          Sudah punya akun?{' '}
          <span 
            onClick={() => router.push('/login')} 
            style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Login di sini
          </span>
        </p>
      </form>
    </div>
  );
}