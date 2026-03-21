import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { lazy, Suspense } from 'react';

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

function PageFallback() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-app)" }}>
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
    </div>
  );
}

function SuspensePage({ children }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
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
          <Route path="/Live" element={<LayoutWrapper currentPageName="Live"><Live /></LayoutWrapper>} />
          <Route path="/user/:email" element={<LayoutWrapper currentPageName="UserProfile"><UserProfile /></LayoutWrapper>} />
          <Route path="/PlaceDetail" element={<LayoutWrapper currentPageName="PlaceDetail"><PlaceDetail /></LayoutWrapper>} />
          <Route path="/ListenDontJudge" element={<LayoutWrapper currentPageName="ListenDontJudge"><ListenDontJudge /></LayoutWrapper>} />
          <Route path="/LiveNearby" element={<LayoutWrapper currentPageName="LiveNearby"><LiveNearby /></LayoutWrapper>} />
          <Route path="/Onboarding" element={<Onboarding />} />
          <Route path="/CreatorDashboard" element={<LayoutWrapper currentPageName="CreatorDashboard"><CreatorDashboard /></LayoutWrapper>} />
          <Route path="/AdminCreators" element={<LayoutWrapper currentPageName="AdminCreators"><AdminCreators /></LayoutWrapper>} />
          <Route path="/CreatorLanding" element={<LayoutWrapper currentPageName="CreatorLanding"><CreatorLanding /></LayoutWrapper>} />
          <Route path="/Settings" element={<LayoutWrapper currentPageName="Settings"><Settings /></LayoutWrapper>} />
          <Route path="/EditProfile" element={<LayoutWrapper currentPageName="EditProfile"><EditProfile /></LayoutWrapper>} />
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
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App