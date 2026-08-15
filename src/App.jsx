import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Layout from './components/Layout';
import SavedMealPlans from './pages/SavedMealPlans';
import Nutrition from './pages/Nutrition';
import PantryDashboard from './pages/PantryDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import Datenschutz from './pages/Datenschutz';
import RepoStats from './pages/RepoStats';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import { AuthProvider } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<Layout />}>
                <Route path="/" element={null} />
                <Route path="/meal-plan" element={null} />
                <Route path="/plan-builder" element={null} />
                <Route path="/saved-plans" element={null} />
                <Route path="/pantry-dashboard" element={<PantryDashboard />} />
                <Route path="/nutrition" element={<Nutrition />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="/repo-stats" element={<RepoStats />} />
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App