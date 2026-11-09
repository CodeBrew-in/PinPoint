import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import { AppProvider } from './context/AppContext';
import { TopNav } from './components/navigation/TopNav';
import { ToastContainer } from './components/ui/Toast';

import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { PublicMapDetails } from './pages/PublicMapDetails';
import { Pricing } from './pages/Pricing';
import { Support } from './pages/Support';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { MyMaps } from './pages/MyMaps';
import { MapWorkspace } from './pages/MapWorkspace';
import { LocationDetails } from './pages/LocationDetails';
import { CreateMap } from './pages/CreateMap';
import { AddLocation } from './pages/AddLocation';
import { Profile } from './pages/Profile';

// Every screen has its own URL. Screens that work with the user's own data
// sit behind ProtectedRoute, which sends logged-out users to /login.
function Shell() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] dark:bg-[#15171A] text-[#171717] dark:text-[#F0EDE6] transition-colors">
      <TopNav />

      <div className="flex-1 flex flex-col">
        <Routes>
          {/* Public screens */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/explore/maps/:mapId" element={<PublicMapDetails />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/support" element={<Support />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Screens that need a logged-in user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-maps" element={<MyMaps />} />
            <Route path="/maps/new" element={<CreateMap />} />
            <Route path="/maps/:mapId" element={<MapWorkspace />} />
            <Route path="/locations/new" element={<AddLocation />} />
            <Route path="/locations/:locationId" element={<LocationDetails />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Shell />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
