import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Header from './component/Header'
import Home from './pages/Home'
import Log_in from './pages/Log_in'
import Sign_up from './pages/Sign_up'
import AppContextProvider from './context/AppContext'
import { ToastContainer } from 'react-toastify'
import Gender from './settings/Gender'
import BodyColor from './settings/BodyColor'
import UserProfile from './settings/UserProfile'
import EditProfile from './settings/EditProfile'
import AddClothing from './features/clothing/AddClothing'
import ClothingAIUpload from './features/clothing/ClothingAIUpload'
import AppHome from './appPages/AppHome'
import Wardrobe from './features/clothing/Wardrobe'
// import MatchingClothes from './features/clothing/MatchingClothes'
import EditClothing from './features/clothing/EditClothing'
import ChangePassword from './settings/ChangePassword'
import MyStyle from './settings/MyStyle'
import AiChat from './AI/AiChat'

// --- Admin ---
import AdminRoute from './component/routes/AdminRoute'
import AdminLogin from './pages/admin/AdminLogin'
import AdminSignUp from './pages/admin/AdminSignUp'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminThanks from './pages/admin/AdminThanks'
import AdminUsers from './pages/admin/AdminUsers'

function App() {
  return (
    <AppContextProvider>
      <ToastContainer theme='colored' autoClose={10000} />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/log_in" element={<Log_in />} />
          <Route path="/sign_up" element={<Sign_up />} />
          <Route path="/gender" element={<Gender />} />
          <Route path="/bodyColor" element={<BodyColor />} />
          <Route path="/user_profile" element={<UserProfile />} />
          <Route path="/edit_profile" element={<EditProfile />} />
          <Route path="/add_clothing" element={<AddClothing />} />
          <Route path="/clothing_ai" element={<ClothingAIUpload />} />
          <Route path="/app_home" element={<AppHome />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          {/* <Route path="/match_clothes" element={<MatchingClothes />} /> */}
          {/* <Route path="/match" element={<MatchingClothes />} /> */}
          <Route path="/edit_clothing" element={<EditClothing />} />
          <Route path="/change_password" element={<ChangePassword />} />
          <Route path="/My_style" element={<MyStyle />} />
          <Route path="/ai_chat" element={<AiChat />} />

          {/* --- Admin public pages --- */}
          <Route path="/admin_login" element={<AdminLogin />} />
          <Route path="/admin_signup" element={<AdminSignUp />} />

          {/* --- Admin protected pages (עטופות ב-AdminRoute) --- */}
          <Route
            path="/admin_dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin_thanks"
            element={
              <AdminRoute>
                <AdminThanks />
              </AdminRoute>
            }
          />
          <Route
            path="/admin_users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AppContextProvider>
  )
}

export default App
    