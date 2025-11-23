import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './components/theme-provider';
import { Toaster } from 'sonner';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import UniversityDashboard from './pages/UniversityDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Verifier from './pages/Verifier';
import Home from './pages/Home';

// Protected Route Component
function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'university' | 'student' }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-2xl">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  return (
    <>
      <Routes>
        <Route path="/" element={!isAuthenticated ? <Home /> : <Navigate to={user?.role === 'university' ? '/university' : '/student'} replace />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={user?.role === 'university' ? '/university' : '/student'} />} />
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to={user?.role === 'university' ? '/university' : '/student'} />} />
        <Route path="/verify" element={<Verifier />} />

        <Route
          path="/university/*"
          element={
            <ProtectedRoute role="university">
              <UniversityDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/*"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster theme={resolvedTheme} richColors />
    </>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="cert-system-theme">
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
