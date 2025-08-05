import { useState } from 'react'
import { useRouter } from 'next/router'
import axios from '../../utils/axios'

export default function CreateUser() {
  const [user, setUser] = useState({ name: '', email: '', mobile: '', address: '', age: 0 })
  const router = useRouter()

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
      await axios.post('/users', user)
      router.push('/users/view/all')
    } catch (err) {
      alert('Failed to create user')
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-black text-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-blue-400 text-center">Add New User</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-red-400">Name</label>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={user.name}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block mb-1 text-red-400">Email</label>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={user.email}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block mb-1 text-red-400">Mobile</label>
          <input
            type="text"
            name="mobile"
            placeholder="Mobile"
            value={user.mobile}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block mb-1 text-red-400">Address</label>
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={user.address}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block mb-1 text-red-400">Age</label>
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={user.age}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-4 font-bold"
        >
          Create
        </button>
      </form>
    </div>
  )
}
