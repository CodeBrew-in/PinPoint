import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  // 1. Create state to store what the user types
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 2. Create the function that talks to the backend
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop the page from refreshing
    setError(''); // Clear any old errors

    try {
      const response = await axios.post('http://localhost:8000/login', {
        email,
        password,
      });

      // Show the success message from FastAPI!
      alert(response.data.message); 
      
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.response?.data?.detail || "Invalid email or password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <h2 className="text-center text-3xl font-bold text-gray-900">Log in to PinPoint</h2>
        
        {/* Show error message if login fails */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 3. Connect the form to our handleLogin function */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm" 
                placeholder="Email address" 
              />
            </div>
            <div>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm" 
                placeholder="Password" 
              />
            </div>
          </div>
          <button type="submit" 
            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Log in
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">Sign up</Link>
        </p>
      </div>
    </div>
  );
}