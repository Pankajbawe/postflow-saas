import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicOnlyRoute } from '@/components/PublicOnlyRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { ToastContainer } from '@/components/ui/Toast';
import { LoginPage } from '@/components/auth/LoginPage';
import { SignupPage } from '@/components/auth/SignupPage';
import { ForgotPasswordPage } from '@/components/auth/ForgotPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CreatePostPage } from '@/pages/CreatePostPage';
import { AIRepurposePage } from '@/pages/AIRepurposePage';
import { CalendarPage } from '@/pages/CalendarPage';
import { ContentLibraryPage } from '@/pages/ContentLibraryPage';
import { SocialAccountsPage } from '@/pages/SocialAccountsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { PostHistoryPage } from '@/pages/PostHistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
              <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />

              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
              <Route path="/create-post" element={<ProtectedRoute><AppLayout><CreatePostPage /></AppLayout></ProtectedRoute>} />
              <Route path="/ai-repurpose" element={<ProtectedRoute><AppLayout><AIRepurposePage /></AppLayout></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><AppLayout><CalendarPage /></AppLayout></ProtectedRoute>} />
              <Route path="/content-library" element={<ProtectedRoute><AppLayout><ContentLibraryPage /></AppLayout></ProtectedRoute>} />
              <Route path="/social-accounts" element={<ProtectedRoute><AppLayout><SocialAccountsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AppLayout><AnalyticsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/post-history" element={<ProtectedRoute><AppLayout><PostHistoryPage /></AppLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
