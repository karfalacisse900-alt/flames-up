/**
 * pages.config.js - Page routing configuration with lazy loading
 * All pages use React.lazy for code splitting / faster initial load.
 * NOTE: This file must NOT contain JSX - use pages.config.jsx if JSX is needed.
 */
import { lazy } from 'react';
import { LazyPage } from './lib/LazyPage.jsx';
import __Layout from './Layout.jsx';

const AdminAnalytics       = lazy(() => import('./pages/AdminAnalytics'));
const AdminContentManager  = lazy(() => import('./pages/AdminContentManager'));
const AdminModeration      = lazy(() => import('./pages/AdminModeration'));
const Art                  = lazy(() => import('./pages/Art'));
const ArtStudio            = lazy(() => import('./pages/ArtStudio'));
const CampusMap            = lazy(() => import('./pages/CampusMap'));
const Collections          = lazy(() => import('./pages/Collections'));
const CreateGroup          = lazy(() => import('./pages/CreateGroup'));
const CreatePost           = lazy(() => import('./pages/CreatePost'));
const CreatePostFlow       = lazy(() => import('./pages/CreatePostFlow'));
const CreatorApplication   = lazy(() => import('./pages/CreatorApplication'));
const CreatorDashboard     = lazy(() => import('./pages/CreatorDashboard'));
const DailyChallenge       = lazy(() => import('./pages/DailyChallenge'));
const DidYouKnow           = lazy(() => import('./pages/DidYouKnow'));
const Discover             = lazy(() => import('./pages/Discover'));
const DiscoverForum        = lazy(() => import('./pages/DiscoverForum'));
const EditServiceProfile   = lazy(() => import('./pages/EditServiceProfile'));
const Explore              = lazy(() => import('./pages/Explore'));
const Gallery              = lazy(() => import('./pages/Gallery'));
const GamePlay             = lazy(() => import('./pages/GamePlay'));
const Games                = lazy(() => import('./pages/Games'));
const GoLive               = lazy(() => import('./pages/GoLive'));
const Groups               = lazy(() => import('./pages/Groups'));
const HallOfFame           = lazy(() => import('./pages/HallOfFame'));
const HelpCenter           = lazy(() => import('./pages/HelpCenter'));
const Home                 = lazy(() => import('./pages/Home'));
const Live                 = lazy(() => import('./pages/Live'));
const LiveRoomView         = lazy(() => import('./pages/LiveRoomView'));
const Messages             = lazy(() => import('./pages/Messages'));
const MyLibrary            = lazy(() => import('./pages/MyLibrary'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const Notifications        = lazy(() => import('./pages/Notifications'));
const NowBoard             = lazy(() => import('./pages/NowBoard'));
const PlaceDetail          = lazy(() => import('./pages/PlaceDetail'));
const Places               = lazy(() => import('./pages/Places'));
const PostComments         = lazy(() => import('./pages/PostComments'));
const PostDetail           = lazy(() => import('./pages/PostDetail'));
const Profile              = lazy(() => import('./pages/Profile'));
const Referral             = lazy(() => import('./pages/Referral'));
const Shop                 = lazy(() => import('./pages/Shop'));
const StatusViewer         = lazy(() => import('./pages/StatusViewer'));
const UserProfile          = lazy(() => import('./pages/UserProfile'));
const Wallet               = lazy(() => import('./pages/Wallet'));
const WeeklyChallenges     = lazy(() => import('./pages/WeeklyChallenges'));

// Wrap a lazy component with Suspense so it works in the pagesConfig loop
function wrapLazy(LazyComponent) {
  return function LazyPage(props) {
    return LazyPage({ LazyComponent, ...props });
  };
}

export const PAGES = {
  "AdminAnalytics":       (p) => LazyPage({ LazyComponent: AdminAnalytics, ...p }),
  "AdminContentManager":  (p) => LazyPage({ LazyComponent: AdminContentManager, ...p }),
  "AdminModeration":      (p) => LazyPage({ LazyComponent: AdminModeration, ...p }),
  "Art":                  (p) => LazyPage({ LazyComponent: Art, ...p }),
  "ArtStudio":            (p) => LazyPage({ LazyComponent: ArtStudio, ...p }),
  "CampusMap":            (p) => LazyPage({ LazyComponent: CampusMap, ...p }),
  "Collections":          (p) => LazyPage({ LazyComponent: Collections, ...p }),
  "CreateGroup":          (p) => LazyPage({ LazyComponent: CreateGroup, ...p }),
  "CreatePost":           (p) => LazyPage({ LazyComponent: CreatePost, ...p }),
  "CreatePostFlow":       (p) => LazyPage({ LazyComponent: CreatePostFlow, ...p }),
  "CreatorApplication":   (p) => LazyPage({ LazyComponent: CreatorApplication, ...p }),
  "CreatorDashboard":     (p) => LazyPage({ LazyComponent: CreatorDashboard, ...p }),
  "DailyChallenge":       (p) => LazyPage({ LazyComponent: DailyChallenge, ...p }),
  "DidYouKnow":           (p) => LazyPage({ LazyComponent: DidYouKnow, ...p }),
  "Discover":             (p) => LazyPage({ LazyComponent: Discover, ...p }),
  "DiscoverForum":        (p) => LazyPage({ LazyComponent: DiscoverForum, ...p }),
  "EditServiceProfile":   (p) => LazyPage({ LazyComponent: EditServiceProfile, ...p }),
  "Explore":              (p) => LazyPage({ LazyComponent: Explore, ...p }),
  "Gallery":              (p) => LazyPage({ LazyComponent: Gallery, ...p }),
  "GamePlay":             (p) => LazyPage({ LazyComponent: GamePlay, ...p }),
  "Games":                (p) => LazyPage({ LazyComponent: Games, ...p }),
  "GoLive":               (p) => LazyPage({ LazyComponent: GoLive, ...p }),
  "Groups":               (p) => LazyPage({ LazyComponent: Groups, ...p }),
  "HallOfFame":           (p) => LazyPage({ LazyComponent: HallOfFame, ...p }),
  "HelpCenter":           (p) => LazyPage({ LazyComponent: HelpCenter, ...p }),
  "Home":                 (p) => LazyPage({ LazyComponent: Home, ...p }),
  "Live":                 (p) => LazyPage({ LazyComponent: Live, ...p }),
  "LiveRoomView":         (p) => LazyPage({ LazyComponent: LiveRoomView, ...p }),
  "Messages":             (p) => LazyPage({ LazyComponent: Messages, ...p }),
  "MyLibrary":            (p) => LazyPage({ LazyComponent: MyLibrary, ...p }),
  "NotificationSettings": (p) => LazyPage({ LazyComponent: NotificationSettings, ...p }),
  "Notifications":        (p) => LazyPage({ LazyComponent: Notifications, ...p }),
  "NowBoard":             (p) => LazyPage({ LazyComponent: NowBoard, ...p }),
  "PlaceDetail":          (p) => LazyPage({ LazyComponent: PlaceDetail, ...p }),
  "Places":               (p) => LazyPage({ LazyComponent: Places, ...p }),
  "PostComments":         (p) => LazyPage({ LazyComponent: PostComments, ...p }),
  "PostDetail":           (p) => LazyPage({ LazyComponent: PostDetail, ...p }),
  "Profile":              (p) => LazyPage({ LazyComponent: Profile, ...p }),
  "Referral":             (p) => LazyPage({ LazyComponent: Referral, ...p }),
  "Shop":                 (p) => LazyPage({ LazyComponent: Shop, ...p }),
  "StatusViewer":         (p) => LazyPage({ LazyComponent: StatusViewer, ...p }),
  "UserProfile":          (p) => LazyPage({ LazyComponent: UserProfile, ...p }),
  "Wallet":               (p) => LazyPage({ LazyComponent: Wallet, ...p }),
  "WeeklyChallenges":     (p) => LazyPage({ LazyComponent: WeeklyChallenges, ...p }),
};

export const pagesConfig = {
  mainPage: "Home",
  Pages: PAGES,
  Layout: __Layout,
};