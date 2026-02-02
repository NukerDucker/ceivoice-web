'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';

const SidebarDemo = () => {
  const [currentRole, setCurrentRole] = useState<'user' | 'admin' | 'assignee'>('user');

  return (
    <div className="flex gap-0 h-screen bg-gray-50">
      <Sidebar
        userRole={currentRole}
        userName="Palm Pollapat"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-10 py-10 bg-white border-b border-gray-200">
          <div className="flex gap-2.5">
            <button
              onClick={() => setCurrentRole('user')}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                currentRole === 'user'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              User View
            </button>
            <button
              onClick={() => setCurrentRole('admin')}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                currentRole === 'admin'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              Admin View
            </button>
            <button
              onClick={() => setCurrentRole('assignee')}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                currentRole === 'assignee'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              Assignee View
            </button>
          </div>
        </div>

        <div className="flex-1 px-10 py-10 bg-gray-50 overflow-auto">
          <div className="bg-white rounded-lg p-10 shadow-sm">
            <h2 className="mt-0 text-gray-900 text-2xl font-semibold">Sidebar Component Demo</h2>

            <h3 className="text-orange-500 mt-8 text-lg font-semibold">Usage</h3>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm text-gray-700 font-mono">{`import { Sidebar } from '@/components/dashboard/sidebar';

// User Sidebar
<Sidebar
  userRole="user"
  userName="Palm Pollapat"
  userAvatar="/path/to/avatar.jpg"
/>

// Admin Sidebar
<Sidebar
  userRole="admin"
  userName="Admin User"
  userAvatar="/path/to/avatar.jpg"
/>`}</pre>

            <h3 className="text-orange-500 mt-8 text-lg font-semibold">Menu Configuration</h3>
            <p className="text-gray-600 leading-relaxed">
              The sidebar automatically switches menu items based on the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">userRole</code> prop.
              You can easily add or modify menu items in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">menuConfig</code> object inside the Sidebar component.
            </p>

            <h3 className="text-orange-500 mt-8 text-lg font-semibold">Features</h3>
            <ul className="text-gray-600 leading-loose">
              <li>Role-based menu rendering (user/admin)</li>
              <li>Active state management</li>
              <li>Expandable submenus with smooth animations</li>
              <li>Hover effects and micro-interactions</li>
              <li>Responsive design</li>
              <li>Customizable user profile section</li>
              <li>Lucide React icons integration</li>
              <li>Modern gradient aesthetics</li>
            </ul>

            <h3 className="text-orange-500 mt-8 text-lg font-semibold">Props</h3>
            <ul className="text-gray-600 leading-loose">
              <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">userRole</code> - 'user' | 'admin' (default: 'user')</li>
              <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">userName</code> - string (default: 'Palm Pollapat')</li>
              <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">userAvatar</code> - string | null (default: null)</li>
            </ul>

            <h3 className="text-orange-500 mt-8 text-lg font-semibold">Customization</h3>
            <p className="text-gray-600 leading-relaxed">
              Modify the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">menuConfig</code> object in the Sidebar component to add new menu items or change existing ones.
              Each menu item supports icon, label, path, and optional submenu functionality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarDemo;