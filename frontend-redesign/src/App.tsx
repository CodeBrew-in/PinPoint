import { Route, Routes } from 'react-router-dom';
import { Layout, RequireAuth } from './components/Layout';
import AddPlace from './pages/AddPlace';
import { SignIn, SignUp } from './pages/Auth';
import CreateMap from './pages/CreateMap';
import Explore from './pages/Explore';
import Landing from './pages/Landing';
import { Contact, Privacy, Terms } from './pages/Legal';
import MapView from './pages/MapView';
import MyMaps from './pages/MyMaps';
import NotFound from './pages/NotFound';
import PlacePage from './pages/PlacePage';
import Profile from './pages/Profile';
import ReviewQueue from './pages/ReviewQueue';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        {/* Anyone can browse public maps and places. Private maps stay hidden until you are signed in. */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/map/:id" element={<MapView />} />
        <Route path="/map/:id/place/:placeId" element={<PlacePage />} />
        {/* Changing anything needs an account. */}
        <Route element={<RequireAuth />}>
          <Route path="/map/:id/add" element={<AddPlace />} />
          <Route path="/my-maps" element={<MyMaps />} />
          <Route path="/maps/new" element={<CreateMap />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/review" element={<ReviewQueue />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
