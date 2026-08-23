import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Signup from './pages/Signup'
import Login from './pages/Login'

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">PinPoint</h1>
      <div className="space-x-4">
        <Link to="/login" className="text-blue-500 underline">Go to Login</Link>
        <Link to="/signup" className="text-blue-500 underline">Go to Sign Up</Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}