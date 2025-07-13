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
        {/* Header with Deity Image */}
        <div className="bg-gradient-to-br from-orange-500 via-red-600 to-yellow-600 px-8 py-6 text-center relative">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-4 w-8 h-8 border-2 border-yellow-300 rounded-full"></div>
            <div className="absolute top-4 right-6 w-6 h-6 border-2 border-orange-300 rounded-full"></div>
            <div className="absolute bottom-3 left-6 w-4 h-4 border-2 border-red-300 rounded-full"></div>
            <div className="absolute bottom-2 right-4 w-10 h-10 border-2 border-yellow-300 rounded-full"></div>
          </div>
          
          {/* Deity representation */}
          <div className="w-20 h-24 bg-gradient-to-b from-yellow-200 to-orange-300 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg relative z-10">
            <div className="w-16 h-20 bg-gradient-to-b from-amber-100 to-orange-200 rounded-lg flex items-center justify-center relative">
              {/* Main deity figure */}
              <div className="w-12 h-16 bg-gradient-to-b from-yellow-300 to-orange-400 rounded-full relative">
                {/* Face */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-600 rounded-full"></div>
                {/* Eyes */}
                <div className="absolute top-4 left-2 w-1 h-1 bg-black rounded-full"></div>
                <div className="absolute top-4 right-2 w-1 h-1 bg-black rounded-full"></div>
                {/* Ornaments */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-red-700 rounded"></div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-gradient-to-t from-red-600 to-orange-500 rounded-b-full"></div>
              </div>
              {/* Crown */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-t-full"></div>
              {/* Side ornaments */}
              <div className="absolute top-4 -left-1 w-2 h-6 bg-gradient-to-b from-yellow-400 to-red-500 rounded-l-full"></div>
              <div className="absolute top-4 -right-1 w-2 h-6 bg-gradient-to-b from-yellow-400 to-red-500 rounded-r-full"></div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white relative z-10">Thirumala Group</h1>
          <p className="text-orange-100 mt-1 relative z-10">Cotton Business Management</p>
          <p className="text-yellow-200 text-sm mt-1 relative z-10">श्री तिरुमला कॉटन मिल्स</p>
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

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Demo Credentials:</h3>
            <div className="text-xs text-gray-700 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Admin:</span>
                <code className="bg-white px-2 py-1 rounded border">admin / admin123</code>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Manager:</span>
                <code className="bg-white px-2 py-1 rounded border">manager / manager123</code>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Operator:</span>
                <code className="bg-white px-2 py-1 rounded border">operator / op123</code>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Staff:</span>
                <code className="bg-white px-2 py-1 rounded border">rajesh.kumar / rajesh123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;