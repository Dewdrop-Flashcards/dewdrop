import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabaseClient';

export default function PasswordReset() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  
  // Check if this is a valid password reset page access
  useEffect(() => {
    const handleAuthStateChange = async () => {
      // Check if this has the recovery parameter or is in recovery flow
      const isRecoveryFlow = 
        location.search.includes('recovery=true') || 
        location.hash.includes('type=recovery');
      
      if (!isRecoveryFlow) {
        // If we're not in recovery flow, check if the user is logged in
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          // If not logged in and not in recovery flow, redirect to login
          navigate('/auth');
          return;
        }
      }
      
      // If we have a recovery flow, stay on this page even if user is logged in
      // This allows completing password reset from the email link
    };
    
    handleAuthStateChange();
  }, [navigate, location]);
  
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setMessage({ text: '', type: '' });
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });
      
      if (error) throw error;
      
      setMessage({ 
        text: 'Your password has been successfully reset. You can now login with your new password.', 
        type: 'success' 
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
      
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage({ 
        text: error.message || 'Failed to reset password. Please try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Watch password field to use in validation
  const password = watch('password', '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>
        
        {message.text && (
          <div 
            className={`p-4 rounded ${
              message.type === 'error' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}
          >
            {message.text}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                {...register('password', { 
                  required: 'New password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === password || 'The passwords do not match'
                })}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? 'Updating password...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
