import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoanForm from '../../components/LoanForm';

const AddLoan: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-yellow-50 flex flex-col">
      <LoanForm
        apiPrefix="admin"
        token={token || ''}
        user={user}
        onSuccess={() => navigate('/admin/dashboard')}
      />
    </div>
  );
};

export default AddLoan; 