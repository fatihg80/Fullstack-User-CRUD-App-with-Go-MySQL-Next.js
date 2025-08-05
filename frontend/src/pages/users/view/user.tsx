import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from '@/utils/axios'
import Link from 'next/link'

interface User {
  id: number
  name: string
  email: string
  mobile: string
  address: string
  age: number
}

export default function ViewUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id) {
      axios.get(`/users/${id}`)
        .then(res => {
          setUser(res.data)
          setLoading(false)
        })
        .catch(err => {
          setError('User not found or error loading data.')
          setLoading(false)
        })
    }
  }, [id])

  if (loading) return <p className="p-6 text-center text-white">Loading...</p>
  if (error || !user) return <p className="text-red-400 p-6 text-center">{error}</p>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">User Details</h2>
        <Link href="/users/view/all" className="text-blue-400 hover:underline">← Back to All Users</Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-black border border-gray-700 rounded-lg">
          <tbody>
            <tr className="border-b border-gray-700">
              <td className="px-4 py-3 text-red-400 font-semibold">Name</td>
              <td className="px-4 py-3 text-green-400">{user.name}</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="px-4 py-3 text-red-400 font-semibold">Email</td>
              <td className="px-4 py-3 text-green-400">{user.email}</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="px-4 py-3 text-red-400 font-semibold">Mobile</td>
              <td className="px-4 py-3 text-green-400">{user.mobile}</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="px-4 py-3 text-red-400 font-semibold">Address</td>
              <td className="px-4 py-3 text-green-400">{user.address}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-red-400 font-semibold">Age</td>
              <td className="px-4 py-3 text-green-400">{user.age}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
