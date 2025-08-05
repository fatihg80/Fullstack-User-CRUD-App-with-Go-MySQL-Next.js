import { useForm } from 'react-hook-form'
import axios from '../utils/axios'
import { useRouter } from 'next/router'

type LoginData = {
  email: string
  password: string
}

export default function Login() {
  const { register, handleSubmit } = useForm<LoginData>()
  const router = useRouter()

  const onSubmit = async (data: LoginData) => {
    try {
      const res = await axios.post('/login', data)
      localStorage.setItem('token', res.data.token)
      router.push('/dashboard')
    } catch (err: any) {
      alert('Login failed: ' + err?.response?.data)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold">Login</h2>
      <input className="border p-2 w-full" placeholder="Email" {...register('email')} required />
      <input className="border p-2 w-full" type="password" placeholder="Password" {...register('password')} required />
      <button className="bg-green-600 text-white p-2 w-full" type="submit">Login</button>
    </form>
  )
}
