import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import 'bootstrap-icons/font/bootstrap-icons.css';


export default function App() {
  return (
  <BrowserRouter>
  <Routes>
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/login" element={<AuthPage />} />
    <Route path="*" element={<AuthPage />} />
  </Routes>
  </BrowserRouter>
  )
}