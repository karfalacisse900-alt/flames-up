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
import Art from './pages/Art';
import Discover from './pages/Discover';
import DiscoverForum from './pages/DiscoverForum';
import GamePlay from './pages/GamePlay';
import Games from './pages/Games';
import Home from './pages/Home';
import Live from './pages/Live';
import LiveRoomView from './pages/LiveRoomView';
import Messages from './pages/Messages';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import Referral from './pages/Referral';
import Notifications from './pages/Notifications';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Art": Art,
    "Discover": Discover,
    "DiscoverForum": DiscoverForum,
    "GamePlay": GamePlay,
    "Games": Games,
    "Home": Home,
    "Live": Live,
    "LiveRoomView": LiveRoomView,
    "Messages": Messages,
    "PostDetail": PostDetail,
    "Profile": Profile,
    "Wallet": Wallet,
    "Referral": Referral,
    "Notifications": Notifications,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};