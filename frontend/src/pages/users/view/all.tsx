
import Link from 'next/link'
import { useEffect, useState } from 'react'
import axios from '@/utils/axios'
import { useRouter } from 'next/router'

interface User {
  id: number
  name: string
  email: string
  mobile: string
  address: string
  age: number
}

export default function AllUsers() {
  const [users, setUsers] = useState<User[]>([])
  const router = useRouter()

  useEffect(() => {
    axios.get('/all_users')
      .then(res => {
        console.log("Fetched users:", res.data)
        setUsers(res.data)
      })
      .catch(err => {
        console.error("Error fetching users:", err)
        if (err.response?.status === 401) {
          router.push('/login')
        }
      })
  }, [])


const deleteUser = async (id: number) => {
  console.log('Clicked delete')
  console.log("Trying to delete user ID:", id)

  if (!confirm('Are you sure you want to delete this user?')) return

  try {
    const res = await axios.delete(`/users/${id}`)
    console.log("Delete response:", res.data)
    setUsers(prev => prev.filter(user => user.id !== id))
  } catch (err: any) {
    console.error("Error deleting user:", err.response?.data || err.message)
    alert('Failed to delete user.')
  }
}

  const logout = async () => {
    await axios.post('/logout');
    localStorage.removeItem('token');
    router.push('/login');
  };



  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-white">
 <div className="flex justify-between items-center mb-8">
  <h2 className="text-3xl font-bold">All Users</h2>

  <div className="flex gap-2">
  <Link href="/users/create" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded">
    + Create User
  </Link>
  <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded">
    🏠 Dashboard
  </Link>
  <button
    onClick={logout}
    className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white"
  >
    🚪 Logout
  </button>
</div>
</div>

      <table className="w-full border-collapse bg-black shadow-lg rounded overflow-hidden">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="border border-gray-600 px-4 py-2">Name</th>
            <th className="border border-gray-600 px-4 py-2">Email</th>
            <th className="border border-gray-600 px-4 py-2">Mobile</th>
            <th className="border border-gray-600 px-4 py-2">Address</th>
            <th className="border border-gray-600 px-4 py-2">Age</th>
            <th className="border border-gray-600 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-gray-400 py-8">No users found.</td>
            </tr>
          ) : (
            users.map(user => {
              console.log("Rendering user:", user)

              return (
                <tr key={user.id} className="hover:bg-gray-900 transition">
                  <td className="border border-gray-700 px-4 py-2">{user.name}</td>
                  <td className="border border-gray-700 px-4 py-2">{user.email}</td>
                  <td className="border border-gray-700 px-4 py-2">{user.mobile}</td>
                  <td className="border border-gray-700 px-4 py-2">{user.address}</td>
                  <td className="border border-gray-700 px-4 py-2">{user.age}</td>
                  <td className="border border-gray-700 px-4 py-2 flex gap-2 flex-wrap">
                    <Link href={`/users/view/user?id=${user.id}`}>
                      <button className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded">View</button>
                    </Link>
                    <Link href={`/users/edit/${user.id}`}>
                      <button className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded">Edit</button>
                    </Link>


          

<button
  onClick={() => {
    console.log("Delete button clicked")
    deleteUser(user.id)
  }}
  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
>
  Delete
</button>




                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}


