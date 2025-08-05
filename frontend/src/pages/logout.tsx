import { useEffect } from 'react';
import axios from '../utils/axios';
import { useRouter } from 'next/router';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    axios.post('/logout').then(() => {
      localStorage.removeItem('token');
      router.push('/login');
    });
  }, []);

  return <p className="p-6 text-center">Logging out...</p>;
}
