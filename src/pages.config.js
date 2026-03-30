/**
 * pages.config.js — lazy-loaded page registry (no JSX in this file)
 */
import { lazy } from 'react';
import { withSuspense } from './lib/LazyPage.jsx';
import __Layout from './Layout.jsx';

const AdminAnalytics       = withSuspense(lazy(() => import('./pages/AdminAnalytics')));
const AdminContentManager  = withSuspense(lazy(() => import('./pages/AdminContentManager')));
const AdminModeration      = withSuspense(lazy(() => import('./pages/AdminModeration')));
const Art                  = withSuspense(lazy(() => import('./pages/Art')));
const ArtStudio            = withSuspense(lazy(() => import('./pages/ArtStudio')));
const CampusMap            = withSuspense(lazy(() => import('./pages/CampusMap')));
const Collections          = withSuspense(lazy(() => import('./pages/Collections')));
const CreateGroup          = withSuspense(lazy(() => import('./pages/CreateGroup')));
const CreatePost           = withSuspense(lazy(() => import('./pages/CreatePost')));
const CreatePostFlow       = withSuspense(lazy(() => import('./pages/CreatePostFlow')));
const CreatorApplication   = withSuspense(lazy(() => import('./pages/CreatorApplication')));
const CreatorDashboard     = withSuspense(lazy(() => import('./pages/CreatorDashboard')));
const DailyChallenge       = withSuspense(lazy(() => import('./pages/DailyChallenge')));
const DidYouKnow           = withSuspense(lazy(() => import('./pages/DidYouKnow')));
const Discover             = withSuspense(lazy(() => import('./pages/Discover')));
const DiscoverForum        = withSuspense(lazy(() => import('./pages/DiscoverForum')));
const EditServiceProfile   = withSuspense(lazy(() => import('./pages/EditServiceProfile')));
const Explore              = withSuspense(lazy(() => import('./pages/Explore')));
const Gallery              = withSuspense(lazy(() => import('./pages/Gallery')));
const GamePlay             = withSuspense(lazy(() => import('./pages/GamePlay')));
const Games                = withSuspense(lazy(() => import('./pages/Games')));
const GoLive               = withSuspense(lazy(() => import('./pages/GoLive')));
const Groups               = withSuspense(lazy(() => import('./pages/Groups')));
const HallOfFame           = withSuspense(lazy(() => import('./pages/HallOfFame')));
const HelpCenter           = withSuspense(lazy(() => import('./pages/HelpCenter')));
const Home                 = withSuspense(lazy(() => import('./pages/Home')));
const Live                 = withSuspense(lazy(() => import('./pages/Live')));
const LiveRoomView         = withSuspense(lazy(() => import('./pages/LiveRoomView')));
const Messages             = withSuspense(lazy(() => import('./pages/Messages')));
const MyLibrary            = withSuspense(lazy(() => import('./pages/MyLibrary')));
const NotificationSettings = withSuspense(lazy(() => import('./pages/NotificationSettings')));
const Notifications        = withSuspense(lazy(() => import('./pages/Notifications')));
const NowBoard             = withSuspense(lazy(() => import('./pages/NowBoard')));
const PlaceDetail          = withSuspense(lazy(() => import('./pages/PlaceDetail')));
const Places               = withSuspense(lazy(() => import('./pages/Places')));
const PostComments         = withSuspense(lazy(() => import('./pages/PostComments')));
const PostDetail           = withSuspense(lazy(() => import('./pages/PostDetail')));
const Profile              = withSuspense(lazy(() => import('./pages/Profile')));
const Referral             = withSuspense(lazy(() => import('./pages/Referral')));
const Shop                 = withSuspense(lazy(() => import('./pages/Shop')));
const StatusViewer         = withSuspense(lazy(() => import('./pages/StatusViewer')));
const UserProfile          = withSuspense(lazy(() => import('./pages/UserProfile')));
const Wallet               = withSuspense(lazy(() => import('./pages/Wallet')));
const WeeklyChallenges     = withSuspense(lazy(() => import('./pages/WeeklyChallenges')));
const ExploreArea          = withSuspense(lazy(() => import('./pages/ExploreArea')));

export const PAGES = {
  "AdminAnalytics":       AdminAnalytics,
  "AdminContentManager":  AdminContentManager,
  "AdminModeration":      AdminModeration,
  "Art":                  Art,
  "ArtStudio":            ArtStudio,
  "CampusMap":            CampusMap,
  "Collections":          Collections,
  "CreateGroup":          CreateGroup,
  "CreatePost":           CreatePost,
  "CreatePostFlow":       CreatePostFlow,
  "CreatorApplication":   CreatorApplication,
  "CreatorDashboard":     CreatorDashboard,
  "DailyChallenge":       DailyChallenge,
  "DidYouKnow":           DidYouKnow,
  "Discover":             Discover,
  "DiscoverForum":        DiscoverForum,
  "EditServiceProfile":   EditServiceProfile,
  "Explore":              Explore,
  "Gallery":              Gallery,
  "GamePlay":             GamePlay,
  "Games":                Games,
  "GoLive":               GoLive,
  "Groups":               Groups,
  "HallOfFame":           HallOfFame,
  "HelpCenter":           HelpCenter,
  "Home":                 Home,
  "Live":                 Live,
  "LiveRoomView":         LiveRoomView,
  "Messages":             Messages,
  "MyLibrary":            MyLibrary,
  "NotificationSettings": NotificationSettings,
  "Notifications":        Notifications,
  "NowBoard":             NowBoard,
  "PlaceDetail":          PlaceDetail,
  "Places":               Places,
  "PostComments":         PostComments,
  "PostDetail":           PostDetail,
  "Profile":              Profile,
  "Referral":             Referral,
  "Shop":                 Shop,
  "StatusViewer":         StatusViewer,
  "UserProfile":          UserProfile,
  "Wallet":               Wallet,
  "WeeklyChallenges":     WeeklyChallenges,
  "ExploreArea":          ExploreArea,
};

export const pagesConfig = {
  mainPage: "Home",
  Pages: PAGES,
  Layout: __Layout,
};