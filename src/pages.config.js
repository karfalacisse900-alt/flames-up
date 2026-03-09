/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminAnalytics from './pages/AdminAnalytics';
import AdminContentManager from './pages/AdminContentManager';
import AdminModeration from './pages/AdminModeration';
import Art from './pages/Art';
import ArtStudio from './pages/ArtStudio';
import Collections from './pages/Collections';
import CreatePost from './pages/CreatePost';
import CreatorDashboard from './pages/CreatorDashboard';
import DailyChallenge from './pages/DailyChallenge';
import DidYouKnow from './pages/DidYouKnow';
import Discover from './pages/Discover';
import DiscoverForum from './pages/DiscoverForum';
import EditServiceProfile from './pages/EditServiceProfile';
import Explore from './pages/Explore';
import Gallery from './pages/Gallery';
import GamePlay from './pages/GamePlay';
import Games from './pages/Games';
import HallOfFame from './pages/HallOfFame';
import HelpCenter from './pages/HelpCenter';
import Home from './pages/Home';
import Live from './pages/Live';
import LiveRoomView from './pages/LiveRoomView';
import Messages from './pages/Messages';
import MyLibrary from './pages/MyLibrary';
import NotificationSettings from './pages/NotificationSettings';
import Notifications from './pages/Notifications';
import Places from './pages/Places';
import PostComments from './pages/PostComments';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import Referral from './pages/Referral';
import Shop from './pages/Shop';
import UserProfile from './pages/UserProfile';
import Wallet from './pages/Wallet';
import WeeklyChallenges from './pages/WeeklyChallenges';
import Groups from './pages/Groups';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAnalytics": AdminAnalytics,
    "AdminContentManager": AdminContentManager,
    "AdminModeration": AdminModeration,
    "Art": Art,
    "ArtStudio": ArtStudio,
    "Collections": Collections,
    "CreatePost": CreatePost,
    "CreatorDashboard": CreatorDashboard,
    "DailyChallenge": DailyChallenge,
    "DidYouKnow": DidYouKnow,
    "Discover": Discover,
    "DiscoverForum": DiscoverForum,
    "EditServiceProfile": EditServiceProfile,
    "Explore": Explore,
    "Gallery": Gallery,
    "GamePlay": GamePlay,
    "Games": Games,
    "HallOfFame": HallOfFame,
    "HelpCenter": HelpCenter,
    "Home": Home,
    "Live": Live,
    "LiveRoomView": LiveRoomView,
    "Messages": Messages,
    "MyLibrary": MyLibrary,
    "NotificationSettings": NotificationSettings,
    "Notifications": Notifications,
    "Places": Places,
    "PostComments": PostComments,
    "PostDetail": PostDetail,
    "Profile": Profile,
    "Referral": Referral,
    "Shop": Shop,
    "UserProfile": UserProfile,
    "Wallet": Wallet,
    "WeeklyChallenges": WeeklyChallenges,
    "Groups": Groups,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};