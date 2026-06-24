import { useContext } from 'react';
import { useSelector } from 'react-redux';
import { AppContext } from '../context/AppContext';

// Public
import LandingPage from './Landing/LandingPage';
import Register from './Register/Register';

// Shared
import Resources from './Resources/Resources';
import LegalGuide from './LegalGuide/LegalGuide';
import ArticleView from './LegalGuide/ArticleView';

// User portal
import Dashboard from './Dashboard/Dashboard';
import Assistant from './Assistant/Assistant';
import LawyerListing from './Lawyer/LawyerListing';
import LawyerDetail from './Lawyer/LawyerDetail';
import UserProfile from './Profile/UserProfile';
import UserConsultations from './Consultation/UserConsultations';
import Chat from './Chat/Chat';

// Lawyer portal
import LawyerProfile from './Lawyer/LawyerProfile';
import LawyerVerification from './Lawyer/LawyerVerification';
import ConsultationManagement from './Lawyer/ConsultationManagement';

// Admin portal
import AdminPanel from './Admin/AdminPanel';

const PageRouter = () => {
  const { page } = useContext(AppContext);
  const { isAuthenticated } = useSelector(s => s.auth);
  const { isAuthenticated: isLawyerAuth } = useSelector(s => s.lawyer);

  // Public routes (no auth)
  if (!isAuthenticated && !isLawyerAuth) {
    switch (page) {
      case 'register':      return <Register />;
      case 'lawyer-register': return <Register />;
      case 'resources':    return <Resources />;
      case 'legal-guide':  return <LegalGuide />;
      case 'article':      return <ArticleView />;
      default:             return <LandingPage />;
    }
  }

  // Lawyer portal routes
  if (isLawyerAuth) {
    switch (page) {
      case 'lawyer-dashboard': return <LawyerProfile />;
      case 'lawyer-verify':    return <LawyerVerification />;
      case 'lawyer-clients':   return <ConsultationManagement />;
      case 'lawyer-profile':   return <LawyerProfile />;
      case 'chat':             return <Chat />;
      case 'legal-guide':      return <LegalGuide />;
      case 'article':          return <ArticleView />;
      case 'resources':        return <Resources />;
      default:                 return <LawyerProfile />;
    }
  }

  // User / Admin portal routes
  switch (page) {
    case 'dashboard':         return <Dashboard />;
    case 'assistant':         return <Assistant />;
    case 'lawyers':           return <LawyerListing />;
    case 'lawyer-detail':     return <LawyerDetail />;
    case 'profile':           return <UserProfile />;
    case 'my-consultations':  return <UserConsultations />;
    case 'chat':              return <Chat />;
    case 'legal-guide':       return <LegalGuide />;
    case 'article':           return <ArticleView />;
    case 'resources':         return <Resources />;
    case 'admin':             return <AdminPanel />;
    default:                  return <Dashboard />;
  }
};

export default PageRouter;
