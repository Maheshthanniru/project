import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Settings, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';
import Input from '../UI/Input';
import toast from 'react-hot-toast';

const Header: React.FC = () => {
  const today = new Date();
  const { user, changePassword } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      toast.error('New password must be at least 4 characters');
      return;
    }

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.error || 'Failed to change password');
    }

    setLoading(false);
  };

  return (
    <>
      <header className='bg-white shadow-sm border-b border-gray-200 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Dashboard
            </h2>
            <div className='flex items-center gap-2 text-sm text-gray-500'>
              <Calendar className='w-4 h-4' />
              {format(today, 'EEEE, MMMM do, yyyy')}
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => setShowPasswordModal(true)}
              className='flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
              title='Change Password'
            >
              <Settings className='w-4 h-4' />
              <span>Change Password</span>
            </button>
            <div className='flex items-center gap-2 text-sm'>
              <span className='text-gray-600'>Welcome,</span>
              <span className='font-semibold text-gray-900'>{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4'>
            <div className='flex items-center justify-between p-6 border-b border-gray-200'>
              <h3 className='text-xl font-semibold text-gray-900'>
                Change Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className='text-gray-400 hover:text-gray-600'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className='p-6 space-y-4'>
              <div className='relative'>
                <Input
                  label='Current Password'
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder='Enter current password'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className='absolute right-3 top-8 text-gray-400 hover:text-gray-600'
                >
                  {showCurrentPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>

              <div className='relative'>
                <Input
                  label='New Password'
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder='Enter new password (min 4 characters)'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className='absolute right-3 top-8 text-gray-400 hover:text-gray-600'
                >
                  {showNewPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>

              <div className='relative'>
                <Input
                  label='Confirm New Password'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder='Confirm new password'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-8 text-gray-400 hover:text-gray-600'
                >
                  {showConfirmPassword ? (
                    <EyeOff className='w-5 h-5' />
                  ) : (
                    <Eye className='w-5 h-5' />
                  )}
                </button>
              </div>

              <div className='flex gap-3 pt-4'>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className='flex-1'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={loading}
                  className='flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
