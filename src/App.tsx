import React, { useState, Suspense, lazy, useEffect } from 'react';
import { ErrorBoundary } from './components/ui';
import { Layout } from './components/layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { initializeFirebase } from './lib/firebase';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Matters = lazy(() => import('./pages/Matters'));
const Transactions = lazy(() => import('./pages/Transactions'));
const BankFeed = lazy(() => import('./pages/BankFeed'));
const Calculators = lazy(() => import('./pages/Calculators'));
const Reports = lazy(() => import('./pages/Reports'));
const RateCalendarPage = lazy(() => import('./pages/RateCalendar'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Settings = lazy(() => import('./pages/Settings'));
const InterestAllocationPage = lazy(() => import('./pages/InterestAllocation'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const PasswordReset = lazy(() => import('./pages/PasswordReset'));

// Loading component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black"></div>
    <p className="ml-3 text-gray-600">Loading...</p>
  </div>
);

// Page type mapping
type PageId =
  | 'dashboard'
  | 'matters'
  | 'transactions'
  | 'bank-feed'
  | 'calculators'
  | 'reports'
  | 'rate-calendar'
  | 'alerts'
  | 'interest-allocation'
  | 'settings'
  | 'matter-detail'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'password-reset';

// Session timeout hook
const useSessionTimeout = (timeoutMs: number = 30 * 60 * 1000) => {
  const { logout } = useAuth();
  const [timeoutExpired, setTimeoutExpired] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Session timeout - logging out');
      logout();
      setTimeoutExpired(true);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [logout, timeoutMs]);
};

// Main App Component
const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [matterDetailId, setMatterDetailId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Firebase on mount
  useEffect(() => {
    const initFirebase = async () => {
      try {
        await initializeFirebase();
        console.log('Firebase initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
      } finally {
        setLoading(false);
      }
    };

    initFirebase();
  }, []);

  // Handle page change
  const handlePageChange = (page: PageId) => {
    setCurrentPage(page);
    setMatterDetailId(null);
    // Scroll to top on page change
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  // Handle matter detail
  const handleMatterDetail = (matterId: string) => {
    setCurrentPage('matter-detail');
    setMatterDetailId(matterId);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  // Loading state
  if (loading) {
    return <PageLoader />;
  }

  // Render page based on current page ID
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <ProtectedRoute requireAuth={true}>
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        );
      case 'matters':
        return (
          <ProtectedRoute requireAuth={true}>
            <Suspense fallback={<PageLoader />}>
              <Matters onMatterDetail={handleMatterDetail} />
            </Suspense>
          </ProtectedRoute>
        );
      case 'transactions':
        return (
          <ProtectedRoute requireAuth={true}>
            <Suspense fallback={<PageLoader />}>
              <Transactions />
            </Suspense>
          </ProtectedRoute>
        );
      case 'bank-feed':
        return (
          <ProtectedRoute requireAuth={true}>
            <Suspense fallback={<PageLoader />}>
              <BankFeed />
            </Suspense>
          </ProtectedRoute>
        );
      case 'calculators':
        return (
          <ProtectedRoute requireAuth={true}>
            <Suspense fallback={<PageLoader />}>
              <Calculators />
            </Suspense>
          </ProtectedRoute>
        );
      case 'reports':
        return (
          <ProtectedRoute requireAuth={true}>
            <Suspense fallback={<PageLoader />}>
              <Reports />
            </Suspense>
          </ProtectedRoute>
        );
      case 'rate-calendar':
        return (
          <ProtectedRoute requireAuth={true}>
            <Suspense fallback={<PageLoader />}>
              <RateCalendarPage />
            </Suspense>
          </ProtectedRoute>
        );
      case 'alerts':
        return (
          <ProtectedRoute requireAuth={true}>
            <Suspense fallback={<PageLoader />}>
              <Alerts />
            </Suspense>
          </ProtectedRoute>
        );
      case 'interest-allocation':
        return (
          <ProtectedRoute requireAuth={true}>
            <Suspense fallback={<PageLoader />}>
              <InterestAllocationPage />
            </Suspense>
          </ProtectedRoute>
        );
      case 'settings':
        return (
          <ProtectedRoute requireAuth={true}>
            <Suspense fallback={<PageLoader />}>
              <Settings />
            </Suspense>
          </ProtectedRoute>
        );
      case 'matter-detail':
        return (
          <ProtectedRoute requireAuth={true}>
            <Suspense fallback={<PageLoader />}>
              <div className="p-6">
                <div className="text-center py-12">
                  <p className="text-gray-500">Matter Detail View for: {matterDetailId}</p>
                  <button
                    className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    onClick={() => handlePageChange('matters')}
                  >
                    Back to Matters
                  </button>
                </div>
              </div>
            </Suspense>
          </ProtectedRoute>
        );
      case 'login':
        return (
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        );
      case 'register':
        return (
          <Suspense fallback={<PageLoader />}>
            <Register />
          </Suspense>
        );
      case 'forgot-password':
        return (
          <Suspense fallback={<PageLoader />}>
            <ForgotPassword />
          </Suspense>
        );
      case 'password-reset':
        return (
          <Suspense fallback={<PageLoader />}>
            <PasswordReset />
          </Suspense>
        );
      default:
        return (
          <ProtectedRoute requireAuth={true}>
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        );
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={handlePageChange}>
      {renderPage()}
    </Layout>
  );
};

// Main App Component with AuthProvider
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
