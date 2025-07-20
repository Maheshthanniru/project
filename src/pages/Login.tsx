import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import toast, { Toaster } from 'react-hot-toast';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user, login } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    
    if (result.success) {
      toast.success('Login successful!');
    } else {
      toast.error(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Logo/Image and Title */}
        <div className="flex flex-col items-center justify-center px-8 pt-8 pb-4">
          <img src="https://pmqeegdmcrktccszgbwu.supabase.co/storage/v1/object/public/images//download.jpeg.jpg" alt="Login Illustration" className="w-48 h-48 object-contain mb-4 rounded-xl shadow" />
          <h1 className="text-2xl font-bold text-gray-900 text-center">Thirumala Group</h1>
          <p className="text-gray-600 mt-1 text-center">Cotton Business Management</p>
          <p className="text-gray-500 text-sm mt-1 text-center">श्री तिरुमला कॉटन मिल्स</p>
        </div>

        {/* Login Form */}
        <div className="px-8 py-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Admin Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={setUsername}
              placeholder="Enter your username"
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Login Credentials */}
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Login Credentials:</h3>
            <div className="text-xs text-gray-700 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Main Admin:</span>
                <code className="bg-white px-2 py-1 rounded border">Bukka Ramesh / ramesh@1976</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;