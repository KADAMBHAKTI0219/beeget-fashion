import AdminDashboard from '../components/Admin/AdminDashboard';
import NewDashboard from '../components/Admin/NewDashboard';
import Layout from '../components/Layout/Layout';
import { useState } from 'react';

const AdminPage = () => {
  const [useNewDashboard, setUseNewDashboard] = useState(true);
  
  return (
    <Layout hideHeader={true}>
      {useNewDashboard ? <NewDashboard /> : <AdminDashboard />}
    </Layout>
  );

export default AdminPage;