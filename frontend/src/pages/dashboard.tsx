
import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/profile');
        setProfile(res.data);
      } catch {
        alert('Session expired. Please login again.');
        router.push('/login');
      }
    };
    fetchProfile();
  }, []);

  const logout = async () => {
    await axios.post('/logout');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!profile) return <p className="text-center p-6">Loading profile...</p>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-6 space-y-4">
        <h2 className="text-xl font-bold mb-4">Control Panel</h2>
        <nav className="space-y-2">
          <Link href="/dashboard" className="block hover:bg-gray-700 px-3 py-2 rounded">🏠 Dashboard</Link>
          <Link href="/users/view/all" className="block hover:bg-gray-700 px-3 py-2 rounded">👥 Users</Link>
          <Link href="/users/create" className="block hover:bg-gray-700 px-3 py-2 rounded">➕ Add User</Link>
        </nav>
        <button
          onClick={logout}
          className="w-full mt-8 bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white"
        >
          🚪 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-4">Welcome, {profile.username}</h1>
        <div className="space-y-2">
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
        </div>
      </main>
    </div>
  );
}
