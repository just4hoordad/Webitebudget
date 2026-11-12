import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';
import PageNotFound from './lib/PageNotFound';
import SharedPlan from './pages/SharedPlan';
import PlanReview from '@/pages/PlanReview';
import Layout from './components/Layout';
import SavedMealPlans from './pages/SavedMealPlans';
import Nutrition from './pages/Nutrition';
import About from './pages/About';
import PantryDashboard from './pages/PantryDashboard';
import Contact from './pages/Contact';
import Datenschutz from './pages/Datenschutz';
import RepoStats from './pages/RepoStats';
import Recipes from '@/pages/Recipes';
import ABTest from '@/pages/ABTest';
import Community from '@/pages/Community';
import Profile from '@/pages/Profile';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import { AuthProvider } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { MonetizationProvider } from '@/lib/MonetizationContext';

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <MonetizationProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<Layout />}>
                <Route path="/" element={null} />
                <Route path="/budget" element={null} />
                <Route path="/meal-plan" element={null} />
                <Route path="/plan-review" element={<PlanReview />} />
                <Route path="/plan-builder" element={null} />
                <Route path="/saved-plans" element={null} />
                <Route path="/nutrition" element={<Nutrition />} />
                <Route path="/pantry" element={<PantryDashboard />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="/repo-stats" element={<RepoStats />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/ab-test" element={<ABTest />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/community" element={<Community />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="/share/:token" element={<SharedPlan />} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          </MonetizationProvider>
          <Toaster />
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App