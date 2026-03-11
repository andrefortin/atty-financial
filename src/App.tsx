import React, { useState, Suspense, lazy } from 'react';
import { ErrorBoundary } from './components/ui';
import { Layout } from './components/layout';

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

// Loading component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black"></div>
    <p className="ml-3 text-gray-600">Loading...</p>
  </div>
);

// Page type mapping
type PageId = 'dashboard' | 'matters' | 'transactions' | 'bank-feed' | 'calculators' | 'reports' | 'rate-calendar' | 'alerts' | 'interest-allocation' | 'settings' | 'matter-detail';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [matterDetailId, setMatterDetailId] = useState<string | null>(null);

  const handlePageChange = (page: PageId) => {
    setCurrentPage(page);
    setMatterDetailId(null);
    // Scroll to top on page change
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleMatterDetail = (matterId: string) => {
    setCurrentPage('matter-detail');
    setMatterDetailId(matterId);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        );
      case 'matters':
        return (
          <Suspense fallback={<PageLoader />}>
            <Matters onMatterDetail={handleMatterDetail} />
          </Suspense>
        );
      case 'transactions':
        return (
          <Suspense fallback={<PageLoader />}>
            <Transactions />
          </Suspense>
        );
      case 'bank-feed':
        return (
          <Suspense fallback={<PageLoader />}>
            <BankFeed />
          </Suspense>
        );
      case 'calculators':
        return (
          <Suspense fallback={<PageLoader />}>
            <Calculators />
          </Suspense>
        );
      case 'reports':
        return (
          <Suspense fallback={<PageLoader />}>
            <Reports />
          </Suspense>
        );
      case 'rate-calendar':
        return (
          <Suspense fallback={<PageLoader />}>
            <RateCalendarPage />
          </Suspense>
        );
      case 'alerts':
        return (
          <Suspense fallback={<PageLoader />}>
            <Alerts />
          </Suspense>
        );
      case 'interest-allocation':
        return (
          <Suspense fallback={<PageLoader />}>
            <InterestAllocationPage />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<PageLoader />}>
            <Settings />
          </Suspense>
        );
      case 'matter-detail':
        // Matter detail would be rendered here when we implement the component
        return (
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
        );
      default:
        return (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        );
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={handlePageChange}>
      {renderPage()}
    </Layout>
  );
};

export default App;
