import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { NavigationStackProvider } from '@/lib/NavigationStack';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { lazy, Suspense } from 'react';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import PageLoader from '@/components/ui/PageLoader';

const Live           = lazy(() => import('./pages/Live'));
const UserProfile    = lazy(() => import('./pages/UserProfile'));
const PlaceDetail    = lazy(() => import('./pages/PlaceDetail'));
const ListenDontJudge = lazy(() => import('./pages/ListenDontJudge'));
const LiveNearby     = lazy(() => import('./pages/LiveNearby'));
const Onboarding     = lazy(() => import('./pages/Onboarding'));
const CreatorDashboard = lazy(() => import('./pages/CreatorDashboard'));
const AdminCreators  = lazy(() => import('./pages/AdminCreators'));
const CreatorLanding = lazy(() => import('./pages/CreatorLanding'));
const Settings       = lazy(() => import('./pages/Settings'));
const EditProfile    = lazy(() => import('./pages/EditProfile'));

function SuspensePage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -18 },
};
const pageTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };


const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Hardware back button — pop the nav stack instead of exiting the app
  useHardwareBack();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ width: "100%" }}
      >
        <Routes location={location}>
          <Route path="/" element={
            <LayoutWrapper currentPageName={mainPageKey}>
              <MainPage />
            </LayoutWrapper>
          } />
          {Object.entries(Pages).map(([path, Page]) => (
            <Route
              key={path}
              path={`/${path}`}
              element={
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              }
            />
          ))}
          <Route path="/Live" element={<SuspensePage><LayoutWrapper currentPageName="Live"><Live /></LayoutWrapper></SuspensePage>} />
          <Route path="/user/:email" element={<SuspensePage><LayoutWrapper currentPageName="UserProfile"><UserProfile /></LayoutWrapper></SuspensePage>} />
          <Route path="/PlaceDetail" element={<SuspensePage><LayoutWrapper currentPageName="PlaceDetail"><PlaceDetail /></LayoutWrapper></SuspensePage>} />
          <Route path="/ListenDontJudge" element={<SuspensePage><LayoutWrapper currentPageName="ListenDontJudge"><ListenDontJudge /></LayoutWrapper></SuspensePage>} />
          <Route path="/LiveNearby" element={<SuspensePage><LayoutWrapper currentPageName="LiveNearby"><LiveNearby /></LayoutWrapper></SuspensePage>} />
          <Route path="/Onboarding" element={<SuspensePage><Onboarding /></SuspensePage>} />
          <Route path="/CreatorDashboard" element={<SuspensePage><LayoutWrapper currentPageName="CreatorDashboard"><CreatorDashboard /></LayoutWrapper></SuspensePage>} />
          <Route path="/AdminCreators" element={<SuspensePage><LayoutWrapper currentPageName="AdminCreators"><AdminCreators /></LayoutWrapper></SuspensePage>} />
          <Route path="/CreatorLanding" element={<SuspensePage><LayoutWrapper currentPageName="CreatorLanding"><CreatorLanding /></LayoutWrapper></SuspensePage>} />
          <Route path="/Settings" element={<SuspensePage><LayoutWrapper currentPageName="Settings"><Settings /></LayoutWrapper></SuspensePage>} />
          <Route path="/EditProfile" element={<SuspensePage><LayoutWrapper currentPageName="EditProfile"><EditProfile /></LayoutWrapper></SuspensePage>} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationStackProvider>
          <NavigationTracker />
          <AuthenticatedApp />
          </NavigationStackProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App