
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import axios from '@/utils/axios'

export default function EditUser() {
  const [user, setUser] = useState({ name: '', email: '', mobile: '', address: '', age: 0 })
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
        .catch(() => {
          setError('User not found')
          setLoading(false)
        })
    }
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUser(prev => ({
      ...prev,
      [name]: name === 'age' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.put(`/users/${id}`, user)
      router.push('/users/view/all')
    } catch (err) {
      console.error(err)
      alert('Error updating user')
    }
  }

  if (loading) return <p className="text-center text-white p-6">Loading...</p>
  if (error) return <p className="text-center text-red-500 p-6">{error}</p>

  return (
    <div className="max-w-xl mx-auto mt-10 bg-black text-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-green-400 text-center">Edit User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-red-400">Name</label>
          <input
            type="text"
            name="name"
            value={user.name}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded bg-gray-800 text-white focus:outline-none"
            placeholder="Full Name"
          />
        </div>

        <div>
          <label className="block mb-1 text-red-400">Email</label>
          <input
            type="email"
            name="email"
            value={user.email}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded bg-gray-800 text-white focus:outline-none"
            placeholder="Email"
          />
        </div>

        <div>
          <label className="block mb-1 text-red-400">Mobile</label>
          <input
            type="text"
            name="mobile"
            value={user.mobile}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded bg-gray-800 text-white focus:outline-none"
            placeholder="Mobile Number"
          />
        </div>

        <div>
          <label className="block mb-1 text-red-400">Address</label>
          <input
            type="text"
            name="address"
            value={user.address}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded bg-gray-800 text-white focus:outline-none"
            placeholder="Address"
          />
        </div>

        <div>
          <label className="block mb-1 text-red-400">Age</label>
          <input
            type="number"
            name="age"
            value={user.age}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded bg-gray-800 text-white focus:outline-none"
            placeholder="Age"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded mt-4"
        >
          Update User
        </button>
      </form>
    </div>
  )
}
