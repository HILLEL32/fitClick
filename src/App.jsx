
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
import MatchingClothes from './features/clothing/MatchingClothes'
import EditClothing from './features/clothing/EditClothing'
import ChangePassword from './settings/ChangePassword'

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
          <Route path="/match" element={<MatchingClothes />} />
          <Route path="/edit_clothing" element={<EditClothing />} />
          <Route path="/change_password" element={<ChangePassword />} />



        </Routes>

      </BrowserRouter>
    </AppContextProvider>
  )
}

export default App
