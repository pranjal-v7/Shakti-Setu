import { useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppProvider, AppContext } from "./context/AppContext";
import { getCurrentUser } from "./store/slices/authSlice";
import { getCurrentLawyer } from "./store/slices/lawyerSlice";
import UserLayout from "./components/layouts/UserLayout";
import LawyerLayout from "./components/layouts/LawyerLayout";
import PageRouter from "./components/PageRouter";
import "./styles/App.css";

function AppContent() {
  const dispatch = useDispatch();
  const { setUser, setPage, page, setOpenArticleId } = useContext(AppContext);
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const { isAuthenticated: isLawyerAuth, lawyer } = useSelector((s) => s.lawyer);

  // Handle ?articleId= deep links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get("articleId");
    if (articleId) {
      setOpenArticleId(articleId);
      setPage("article");
    }
  }, [setPage, setOpenArticleId]);

  // Restore user session
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) dispatch(getCurrentUser());
  }, [dispatch, user]);

  // Restore lawyer session
  useEffect(() => {
    const token = localStorage.getItem("lawyerToken");
    if (token && !lawyer) dispatch(getCurrentLawyer());
  }, [dispatch, lawyer]);

  // Sync user to context
  useEffect(() => { setUser(user || null); }, [user, setUser]);

  // Auto-redirect after login based on role
  useEffect(() => {
    if (isLawyerAuth && page === 'home') {
      setPage('lawyer-dashboard');
    } else if (isAuthenticated && page === 'home') {
      const isAdmin = user?.role === 'admin';
      setPage(isAdmin ? 'admin' : 'dashboard');
    }
  }, [isAuthenticated, isLawyerAuth, user, page, setPage]);

  // ── Lawyer portal ─────────────────────────────────────────────────────────
  if (isLawyerAuth) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div className="background-overlay" />
        <LawyerLayout>
          <PageRouter />
        </LawyerLayout>
      </div>
    );
  }

  // ── User / Admin portal ───────────────────────────────────────────────────
  if (isAuthenticated) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div className="background-overlay" />
        <UserLayout>
          <PageRouter />
        </UserLayout>
      </div>
    );
  }

  // ── Public / Landing ──────────────────────────────────────────────────────
  return (
    <div className="app-root">
      <div className="background-overlay" />
      <PageRouter />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
