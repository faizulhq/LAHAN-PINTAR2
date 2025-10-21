import Cookies from 'js-cookie'
import axios from 'axios'

const API = 'http://localhost:8000/api'

export const login = async (username, password) => {
  const res = await axios.post(`${API}/login/`, { username, password })
  const { access, refresh, user } = res.data

  // Simpan token ke cookie
  Cookies.set('access', access, { path: '/', sameSite: 'Lax' })
  Cookies.set('refresh', refresh, { path: '/', sameSite: 'Lax' })
  Cookies.set('user', JSON.stringify(user), { path: '/', sameSite: 'Lax' })

  return user
}

export const register = async (formData) => {
  const res = await axios.post(`${API}/register/`, formData)
  const { access, refresh, user } = res.data

  Cookies.set('access', access, { path: '/', sameSite: 'Lax' })
  Cookies.set('refresh', refresh, { path: '/', sameSite: 'Lax' })
  Cookies.set('user', JSON.stringify(user), { path: '/', sameSite: 'Lax' })

  return user
}

export const logout = () => {
  Cookies.remove('access')
  Cookies.remove('refresh')
  Cookies.remove('user')
}

export const getUser = () => {
  const user = Cookies.get('user')
  return user ? JSON.parse(user) : null
}
