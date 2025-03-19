import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import GitHubLoginButton from '../components/auth/GitHubLoginButton';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const { user } = useAuth();

    // Redirect if user is already logged in
    if (user) return <Navigate to="/dashboard" replace />;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
                    </h2>
                </div>

                <div className="mt-8">
                    {isLogin ? (
                        <LoginForm />
                    ) : (
                        <RegisterForm />
                    )}

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <GitHubLoginButton />
                        </div>
                    </div>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            className="font-medium text-blue-600 hover:text-blue-500"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
