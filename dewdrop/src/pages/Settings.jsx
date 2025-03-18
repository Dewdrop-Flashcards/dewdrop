import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/settingsService';
import { cardService } from '../services/cardService';

// Password change form component that will be part of the Settings page
const PasswordChangeForm = () => {
  const { updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear any previous messages
    setMessage({ text: '', type: '' });

    // Validate new passwords match
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    // Validate new password length
    if (newPassword.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(currentPassword, newPassword);

      if (error) throw error;

      // Clear form on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ text: 'Password updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({
        text: error.message || 'Failed to update password. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-medium mb-4">Change Password</h2>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded ${message.type === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
            }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Current Password
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

// New component for study settings
const StudySettingsForm = () => {
  const [newCardsPerDay, setNewCardsPerDay] = useState(10);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load current settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await settingsService.getUserSettings();
        setNewCardsPerDay(settings.new_cards_per_day);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await settingsService.updateUserSettings({
        new_cards_per_day: newCardsPerDay
      });

      // Update the card service cache
      cardService.setNewCardsPerDay(newCardsPerDay);

      setMessage({ text: 'Settings updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({
        text: 'Failed to update settings. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-6">
      <h2 className="text-xl font-medium mb-4">Study Settings</h2>

      {message.text && (
        <div className={`mb-4 p-3 rounded ${message.type === 'error'
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700'
          }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="newCardsPerDay"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            New Cards Per Day
          </label>
          <input
            id="newCardsPerDay"
            type="number"
            min="1"
            max="100"
            value={newCardsPerDay}
            onChange={(e) => setNewCardsPerDay(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Maximum number of new cards to show each day
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="max-w-2xl">
        <StudySettingsForm />
        <PasswordChangeForm />
      </div>
    </div>
  );
}
