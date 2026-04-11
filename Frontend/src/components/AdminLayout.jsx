import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-slate-900 text-white p-5">
        
        {/* Aquí luego pondremos tus links */}
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}