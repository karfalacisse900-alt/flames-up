/**
 * pages.config.js - Page routing configuration with lazy loading
 * All pages use React.lazy for code splitting / faster initial load.
 */
import React, { Suspense } from 'react';
import __Layout from './Layout.jsx';

// ── Lazy page imports (code-split per page) ──────────────────────────────────
const AdminAnalytics       = React.lazy(() => import('./pages/AdminAnalytics'));
const AdminContentManager  = React.lazy(() => import('./pages/AdminContentManager'));
const AdminModeration      = React.lazy(() => import('./pages/AdminModeration'));
const Art                  = React.lazy(() => import('./pages/Art'));
const ArtStudio            = React.lazy(() => import('./pages/ArtStudio'));
const CampusMap            = React.lazy(() => import('./pages/CampusMap'));
const Collections          = React.lazy(() => import('./pages/Collections'));
const CreateGroup          = React.lazy(() => import('./pages/CreateGroup'));
const CreatePost           = React.lazy(() => import('./pages/CreatePost'));
const CreatePostFlow       = React.lazy(() => import('./pages/CreatePostFlow'));
const CreatorApplication   = React.lazy(() => import('./pages/CreatorApplication'));
const CreatorDashboard     = React.lazy(() => import('./pages/CreatorDashboard'));
const DailyChallenge       = React.lazy(() => import('./pages/DailyChallenge'));
const DidYouKnow           = React.lazy(() => import('./pages/DidYouKnow'));
const Discover             = React.lazy(() => import('./pages/Discover'));
const DiscoverForum        = React.lazy(() => import('./pages/DiscoverForum'));
const EditServiceProfile   = React.lazy(() => import('./pages/EditServiceProfile'));
const Explore              = React.lazy(() => import('./pages/Explore'));
const Gallery              = React.lazy(() => import('./pages/Gallery'));
const GamePlay             = React.lazy(() => import('./pages/GamePlay'));
const Games                = React.lazy(() => import('./pages/Games'));
const GoLive               = React.lazy(() => import('./pages/GoLive'));
const Groups               = React.lazy(() => import('./pages/Groups'));
const HallOfFame           = React.lazy(() => import('./pages/HallOfFame'));
const HelpCenter           = React.lazy(() => import('./pages/HelpCenter'));
const Home                 = React.lazy(() => import('./pages/Home'));
const Live                 = React.lazy(() => import('./pages/Live'));
const LiveRoomView         = React.lazy(() => import('./pages/LiveRoomView'));
const Messages             = React.lazy(() => import('./pages/Messages'));
const MyLibrary            = React.lazy(() => import('./pages/MyLibrary'));
const NotificationSettings = React.lazy(() => import('./pages/NotificationSettings'));
const Notifications        = React.lazy(() => import('./pages/Notifications'));
const NowBoard             = React.lazy(() => import('./pages/NowBoard'));
const PlaceDetail          = React.lazy(() => import('./pages/PlaceDetail'));
const Places               = React.lazy(() => import('./pages/Places'));
const PostComments         = React.lazy(() => import('./pages/PostComments'));
const PostDetail           = React.lazy(() => import('./pages/PostDetail'));
const Profile              = React.lazy(() => import('./pages/Profile'));
const Referral             = React.lazy(() => import('./pages/Referral'));
const Shop                 = React.lazy(() => import('./pages/Shop'));
const StatusViewer         = React.lazy(() => import('./pages/StatusViewer'));
const UserProfile          = React.lazy(() => import('./pages/UserProfile'));
const Wallet               = React.lazy(() => import('./pages/Wallet'));
const WeeklyChallenges     = React.lazy(() => import('./pages/WeeklyChallenges'));

// Page-level suspense fallback — matches app bg to avoid flash
function PageFallback() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-app)",
      }}
    >
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
    </div>
  );
}

// HOC: wraps a lazy component in Suspense so the pagesConfig loop works unchanged
function lazy(LazyComponent) {
  return function LazyPage(props) {
    return (
      <Suspense fallback={<PageFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

export const PAGES = {
  "AdminAnalytics":       lazy(AdminAnalytics),
  "AdminContentManager":  lazy(AdminContentManager),
  "AdminModeration":      lazy(AdminModeration),
  "Art":                  lazy(Art),
  "ArtStudio":            lazy(ArtStudio),
  "CampusMap":            lazy(CampusMap),
  "Collections":          lazy(Collections),
  "CreateGroup":          lazy(CreateGroup),
  "CreatePost":           lazy(CreatePost),
  "CreatePostFlow":       lazy(CreatePostFlow),
  "CreatorApplication":   lazy(CreatorApplication),
  "CreatorDashboard":     lazy(CreatorDashboard),
  "DailyChallenge":       lazy(DailyChallenge),
  "DidYouKnow":           lazy(DidYouKnow),
  "Discover":             lazy(Discover),
  "DiscoverForum":        lazy(DiscoverForum),
  "EditServiceProfile":   lazy(EditServiceProfile),
  "Explore":              lazy(Explore),
  "Gallery":              lazy(Gallery),
  "GamePlay":             lazy(GamePlay),
  "Games":                lazy(Games),
  "GoLive":               lazy(GoLive),
  "Groups":               lazy(Groups),
  "HallOfFame":           lazy(HallOfFame),
  "HelpCenter":           lazy(HelpCenter),
  "Home":                 lazy(Home),
  "Live":                 lazy(Live),
  "LiveRoomView":         lazy(LiveRoomView),
  "Messages":             lazy(Messages),
  "MyLibrary":            lazy(MyLibrary),
  "NotificationSettings": lazy(NotificationSettings),
  "Notifications":        lazy(Notifications),
  "NowBoard":             lazy(NowBoard),
  "PlaceDetail":          lazy(PlaceDetail),
  "Places":               lazy(Places),
  "PostComments":         lazy(PostComments),
  "PostDetail":           lazy(PostDetail),
  "Profile":              lazy(Profile),
  "Referral":             lazy(Referral),
  "Shop":                 lazy(Shop),
  "StatusViewer":         lazy(StatusViewer),
  "UserProfile":          lazy(UserProfile),
  "Wallet":               lazy(Wallet),
  "WeeklyChallenges":     lazy(WeeklyChallenges),
};

export const pagesConfig = {
  mainPage: "Home",
  Pages: PAGES,
  Layout: __Layout,
};