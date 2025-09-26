import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AdminLogin from '../components/Admin/AdminLogin';
import AdminPanel from '../components/Admin/AdminPanel';

const AdminPage = () => {
  const { user } = useAuth();

  return (
    <div className="admin-page">
      <div className="container">
        {user ? <AdminPanel /> : <AdminLogin />}
      </div>
    </div>
  );
};

export default AdminPage;
