import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { useRouter } from 'next/router';

type User = {
  id: number;
  name: string;
  email: string;
  mobile: string;
  address: string;
  age: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [refresh, setRefresh] = useState(false);
  const router = useRouter();

  useEffect(() => {
    axios.get('/users')
      .then(res => setUsers(res.data))
      .catch(() => {
        alert('Unauthorized or session expired');
        router.push('/login');
      });
  }, [refresh]);

  const deleteUser = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await axios.delete(`/users/${id}`);
      setRefresh(!refresh);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Users List</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Mobile</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="text-center border">
              <td className="p-2 border">{user.id}</td>
              <td className="p-2 border">{user.name}</td>
              <td className="p-2 border">{user.email}</td>
              <td className="p-2 border">{user.mobile}</td>
              <td className="p-2 border space-x-2">
                <button onClick={() => router.push(`/users/edit/${user.id}`)} className="bg-yellow-400 px-2 py-1">Edit</button>
                <button onClick={() => deleteUser(user.id)} className="bg-red-500 text-white px-2 py-1">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => router.push('/users/create')} className="mt-4 bg-green-600 text-white px-4 py-2">Add New User</button>
    </div>
  );
}
