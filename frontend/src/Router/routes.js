import React from "react";
import Preview from "../views/Preview";


// All HOME PAGE ROUTES

import Home1 from "../views/homes/Home1"
import Home2 from "../views/homes/Home2"
import Home3 from "../views/homes/Home3"

//  Account inner pages
import ConnectWalllet from "../views/pages/account/ConnectWalllet"
import EditProfile from "../views/pages/account/EditProfile"
import Login from "../views/pages/account/Login"
import Profile from "../views/pages/account/Profile"
import Register from "../views/pages/account/Register"

//  Blog inner pages
import Blog from "../views/pages/blog/Blog"
import Article from "../views/pages/blog/Article"

//  item inner pages

import ItemDetails from "../views/pages/item/ItemDetails"
import Upload from "../views/pages/item/Upload"
import UploadType from "../views/pages/item/UploadType"

// NftPages
import Collections from "../views/pages/NftPages/Collections"
import Creators from "../views/pages/NftPages/Creators"
import LiveAuctions from "../views/pages/NftPages/LiveAuctions"
import Marketplace from "../views/pages/NftPages/Marketplace"
import Ranking from "../views/pages/NftPages/Ranking"
import UpcomingProjects from "../views/pages/NftPages/UpcomingProjects"

// other pages
import Activity from "../views/pages/others/Activity"
import Newsletter from "../views/pages/others/Newsletter"
import NoResults from "../views/pages/others/NoResults"
import PrivacyPolicy from "../views/pages/others/PrivacyPolicy"
import NotFound from "../views/NotFound"
import Chat from "../views/pages/Support/Chat"
import SubmitRequest from "../views/pages/Support/SubmitRequest"
import Faq from "../views/pages/Support/Faq"
import Forum from "../views/pages/forum/Forum"
import PostDetails from "../views/pages/forum/PostDetails"
import Contact from "../views/pages/Support/Contact"


// Route Specific
import { BrowserRouter, Route, Routes } from "react-router-dom";
const AppRoutes = () => {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Preview />} />
                    <Route path="/home-1" element={<Home1 />} />
                    <Route path="/home-2" element={<Home2 />} />
                    <Route path="/home-3" element={<Home3 />} />
                    {/* inner pages */}
                    <Route path="/connect-wallet" element={<ConnectWalllet />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/edit-profile" element={<EditProfile />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/article" element={<Article />} />
                    <Route path="/item-details" element={<ItemDetails />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/upload-type" element={<UploadType />} />
                    <Route path="/collections" element={<Collections />} />
                    <Route path="/creators" element={<Creators />} />
                    <Route path="/live-auctions" element={<LiveAuctions />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/ranking" element={<Ranking />} />
                    <Route path="/upcoming-projects" element={<UpcomingProjects />} />
                    <Route path="/activity" element={<Activity />} />
                    <Route path="/newsletter" element={<Newsletter />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/submit-request" element={<SubmitRequest />} />
                    <Route path="/no-results" element={<NoResults />} />
                    <Route path="/faq" element={<Faq />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/forum" element={<Forum />} />
                    <Route path="/post-details" element={<PostDetails />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route element={<NotFound />} />

                </Routes>
            </BrowserRouter>
        </>
    );
};

export default AppRoutes;
