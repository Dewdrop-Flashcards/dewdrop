import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />

            <div className="flex-1 overflow-auto">
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
