import { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';

const ReportsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6">Reports</h1>
          {/* Add your reports content here */}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage; 