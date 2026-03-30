import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NavigationStackProvider } from '@/lib/NavigationStack';
import { TabHistoryProvider } from '@/lib/TabHistoryContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { lazy, Suspense } from 'react';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import PageLoader from '@/components/ui/PageLoader';

// Add page imports here
const Live             = lazy(() => import('./pages/Live'));
const UserProfile      = lazy(() => import('./pages/UserProfile'));
const PlaceDetail      = lazy(() => import('./pages/PlaceDetail'));
const ListenDontJudge  = lazy(() => import('./pages/ListenDontJudge'));
const LiveNearby       = lazy(() => import('./pages/LiveNearby'));
const Onboarding       = lazy(() => import('./pages/Onboarding'));
const CreatorDashboard = lazy(() => import('./pages/CreatorDashboard'));
const AdminCreators    = lazy(() => import('./pages/AdminCreators'));
const CreatorLanding   = lazy(() => import('./pages/CreatorLanding'));
const Settings         = lazy(() => import('./pages/Settings'));
const EditProfile      = lazy(() => import('./pages/EditProfile'));
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const TripPlanner      = lazy(() => import('./pages/TripPlanner'));
const AdminScamReports = lazy(() => import('./pages/AdminScamReports'));
const FashionFeed      = lazy(() => import('./pages/FashionFeed'));
const NearbyPlaces     = lazy(() => import('./pages/NearbyPlaces'));

function SuspensePage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout
  ? <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  useHardwareBack();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <PageLoader />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/" element={<LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>} />

      {/* pagesConfig loop — existing pages */}
      {Object.entries(Pages).map(([path, Page]) => (
        <Route key={path} path={`/${path}`} element={<LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>} />
      ))}

      {/* Extra pages not in pagesConfig */}
      <Route path="/Live"              element={<SuspensePage><LayoutWrapper currentPageName="Live"><Live /></LayoutWrapper></SuspensePage>} />
      <Route path="/user/:email"       element={<SuspensePage><LayoutWrapper currentPageName="UserProfile"><UserProfile /></LayoutWrapper></SuspensePage>} />
      <Route path="/PlaceDetail"       element={<SuspensePage><LayoutWrapper currentPageName="PlaceDetail"><PlaceDetail /></LayoutWrapper></SuspensePage>} />
      <Route path="/ListenDontJudge"   element={<SuspensePage><LayoutWrapper currentPageName="ListenDontJudge"><ListenDontJudge /></LayoutWrapper></SuspensePage>} />
      <Route path="/LiveNearby"        element={<SuspensePage><LayoutWrapper currentPageName="LiveNearby"><LiveNearby /></LayoutWrapper></SuspensePage>} />
      <Route path="/Onboarding"        element={<SuspensePage><Onboarding /></SuspensePage>} />
      <Route path="/CreatorDashboard"  element={<SuspensePage><LayoutWrapper currentPageName="CreatorDashboard"><CreatorDashboard /></LayoutWrapper></SuspensePage>} />
      <Route path="/AdminCreators"     element={<SuspensePage><LayoutWrapper currentPageName="AdminCreators"><AdminCreators /></LayoutWrapper></SuspensePage>} />
      <Route path="/CreatorLanding"    element={<SuspensePage><LayoutWrapper currentPageName="CreatorLanding"><CreatorLanding /></LayoutWrapper></SuspensePage>} />
      <Route path="/Settings"          element={<SuspensePage><LayoutWrapper currentPageName="Settings"><Settings /></LayoutWrapper></SuspensePage>} />
      <Route path="/EditProfile"       element={<SuspensePage><LayoutWrapper currentPageName="EditProfile"><EditProfile /></LayoutWrapper></SuspensePage>} />
      <Route path="/Dashboard"         element={<SuspensePage><LayoutWrapper currentPageName="Dashboard"><Dashboard /></LayoutWrapper></SuspensePage>} />
      <Route path="/TripPlanner"       element={<SuspensePage><LayoutWrapper currentPageName="TripPlanner"><TripPlanner /></LayoutWrapper></SuspensePage>} />
      <Route path="/AdminScamReports"  element={<SuspensePage><LayoutWrapper currentPageName="AdminScamReports"><AdminScamReports /></LayoutWrapper></SuspensePage>} />
      <Route path="/FashionFeed"       element={<SuspensePage><LayoutWrapper currentPageName="FashionFeed"><FashionFeed /></LayoutWrapper></SuspensePage>} />
      <Route path="/NearbyPlaces"      element={<SuspensePage><LayoutWrapper currentPageName="NearbyPlaces"><NearbyPlaces /></LayoutWrapper></SuspensePage>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <TabHistoryProvider>
              <NavigationStackProvider>
                <NavigationTracker />
                <AuthenticatedApp />
              </NavigationStackProvider>
            </TabHistoryProvider>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App