import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout } = useAuthStore();
  
  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    isCitizen: user?.role === 'citizen',
    isOfficer: user?.role === 'revenue_officer',
    isAdmin: user?.role === 'verifier_admin',
  };
};
