import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTableMode } from '../contexts/TableModeContext';
import Button from '../components/UI/Button';
import { FileCheck, Briefcase } from 'lucide-react';

const ModeSelection: React.FC = () => {
  const navigate = useNavigate();
  const { setMode } = useTableMode();

  const handleRegularMode = () => {
    setMode('regular');
    navigate('/');
  };

  const handleITRMode = () => {
    setMode('itr');
    navigate('/');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center p-4'>
      <div className='max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden'>
        {/* Logo/Image and Title */}
        <div className='flex flex-col items-center justify-center px-8 pt-8 pb-6'>
          <img
            src='https://pmqeegdmcrktccszgbwu.supabase.co/storage/v1/object/public/images//download.jpeg.jpg'
            alt='Thirumala Group'
            className='w-48 h-48 object-contain mb-4 rounded-xl shadow'
          />
          <h1 className='text-3xl font-bold text-gray-900 text-center'>
            Thirumala Group
          </h1>
          <p className='text-gray-600 mt-2 text-center'>
            Cotton Business Management
          </p>
          <p className='text-gray-500 text-sm mt-1 text-center'>
            श्री तिरुमला कॉटन मिल्स
          </p>
        </div>

        {/* Mode Selection Buttons */}
        <div className='px-8 py-6'>
          <div className='space-y-4'>
            <Button
              onClick={handleRegularMode}
              className='w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 text-lg font-semibold shadow-lg flex items-center justify-center gap-3'
            >
              <Briefcase className='w-6 h-6' />
              Regular Mode
            </Button>

            <Button
              onClick={handleITRMode}
              className='w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 text-lg font-semibold shadow-lg flex items-center justify-center gap-3'
            >
              <FileCheck className='w-6 h-6' />
              ITR Mode
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelection;

