import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import {
  MapPin,
  Search,
  Compass,
  Folder,
  Plus,
  User,
  LogOut,
  LogIn,
  Settings,
  Menu,
  X,
  LayoutDashboard,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';

export const TopNav: React.FC = () => {
  const {
    currentScreen,
    navigateTo,
    isAuthenticated,
    logout,
    user,
    searchQuery,
    setSearchQuery,
    theme,
    toggleTheme,
  } = useApp();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo('explore');
    }
  };

  return (
    <header className="h-14 bg-white dark:bg-[#15171A] border-b border-[#D9D6CF] dark:border-[#2D333D] px-4 md:px-6 flex items-center justify-between z-30 shrink-0 sticky top-0 transition-colors">
      {/* Left: Brand Logo & Navigation Links */}
      <div className="flex items-center gap-6 lg:gap-8">
        <button
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none"
          title="Go to Home"
        >
          <div className="w-7 h-7 bg-[#C84B31] rounded-[6px] flex items-center justify-center text-white shadow-xs">
            <MapPin className="w-4 h-4 fill-white text-[#C84B31]" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl tracking-tight text-[#171717] dark:text-[#F0EDE6] font-semibold leading-none">
              PinPoint
            </span>
            <span className="text-[9px] uppercase tracking-widest text-[#68655F] dark:text-[#9C978D] font-mono leading-none mt-0.5">
              Maps
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => navigateTo('home')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors cursor-pointer ${
              currentScreen === 'home'
                ? 'bg-[#F7F5F0] dark:bg-[#1E2228] text-[#171717] dark:text-[#F0EDE6] font-semibold'
                : 'text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] hover:bg-[#F7F5F0]/60 dark:hover:bg-[#1E2228]/60'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigateTo('explore')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              currentScreen === 'explore'
                ? 'bg-[#F7F5F0] dark:bg-[#1E2228] text-[#171717] dark:text-[#F0EDE6] font-semibold'
                : 'text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] hover:bg-[#F7F5F0]/60 dark:hover:bg-[#1E2228]/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            The Public Map
          </button>

          {isAuthenticated && (
            <>
              <button
                onClick={() => navigateTo('my-maps')}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  currentScreen === 'my-maps'
                    ? 'bg-[#F7F5F0] dark:bg-[#1E2228] text-[#171717] dark:text-[#F0EDE6] font-semibold'
                    : 'text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] hover:bg-[#F7F5F0]/60 dark:hover:bg-[#1E2228]/60'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                My Maps
              </button>
              <button
                onClick={() => navigateTo('map-workspace')}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  currentScreen === 'map-workspace'
                    ? 'bg-[#FAF0ED] dark:bg-[#341B18] text-[#C84B31] dark:text-[#E26D54] font-semibold border border-[#E8BFB5]/50 dark:border-[#52251F]'
                    : 'text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] hover:bg-[#F7F5F0]/60 dark:hover:bg-[#1E2228]/60'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Workspace
              </button>
              <button
                onClick={() => navigateTo('dashboard')}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  currentScreen === 'dashboard'
                    ? 'bg-[#F7F5F0] dark:bg-[#1E2228] text-[#171717] dark:text-[#F0EDE6] font-semibold'
                    : 'text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] hover:bg-[#F7F5F0]/60 dark:hover:bg-[#1E2228]/60'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </button>
            </>
          )}

          {!isAuthenticated && (
            <>
              <button
                onClick={() => navigateTo('pricing')}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
                  currentScreen === 'pricing'
                    ? 'bg-[#F7F5F0] dark:bg-[#1E2228] text-[#171717] dark:text-[#F0EDE6] font-semibold'
                    : 'text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6]'
                }`}
              >
                Pricing
              </button>
              <button
                onClick={() => navigateTo('support')}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
                  currentScreen === 'support'
                    ? 'bg-[#F7F5F0] dark:bg-[#1E2228] text-[#171717] dark:text-[#F0EDE6] font-semibold'
                    : 'text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6]'
                }`}
              >
                Documentation
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Middle: Quick Search */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden lg:flex items-center relative w-72 max-w-xs"
      >
        <Search className="w-3.5 h-3.5 text-[#68655F] dark:text-[#9C978D] absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search The Public Map..."
          className="w-full h-8 pl-8 pr-3 text-xs bg-[#F7F5F0] dark:bg-[#1E2228] text-[#171717] dark:text-[#F0EDE6] placeholder:text-[#68655F]/70 dark:placeholder:text-[#9C978D]/70 rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] focus:bg-white dark:focus:bg-[#242930] focus:outline-none focus:border-[#171717] dark:focus:border-[#E26D54] transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] text-xs"
          >
            ×
          </button>
        )}
      </form>

      {/* Right Actions: Theme Toggle + Add Location + Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Subtle, Eye-Friendly Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-8 h-8 rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] bg-white dark:bg-[#1E2228] text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#2A2F38] flex items-center justify-center transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to warm light mode' : 'Switch to eye-friendly dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#E26D54]" />
          ) : (
            <Moon className="w-4 h-4 text-[#171717]" />
          )}
        </button>

        {isAuthenticated ? (
          <>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
              onClick={() => navigateTo('add-location')}
              className="font-medium"
            >
              Add Location
            </Button>

            {/* Profile Menu Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] hover:bg-[#F7F5F0] dark:hover:bg-[#1E2228] transition-colors focus:outline-none cursor-pointer"
                aria-label="User profile menu"
              >
                <img
                  src={user?.avatar}
                  alt={user?.name || 'User avatar'}
                  className="w-6 h-6 rounded-[4px] object-cover border border-[#D9D6CF] dark:border-[#2D333D]"
                />
                <span className="text-xs font-medium text-[#171717] dark:text-[#F0EDE6] hidden sm:inline max-w-[100px] truncate">
                  {user?.name.split(' ')[0]}
                </span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1E2228] border border-[#D9D6CF] dark:border-[#2D333D] rounded-[8px] shadow-lg dark:shadow-2xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-[#D9D6CF] dark:border-[#2D333D] bg-[#F7F5F0]/50 dark:bg-[#15171A]/60">
                    <p className="font-semibold text-[#171717] dark:text-[#F0EDE6] truncate">{user?.name}</p>
                    <p className="text-[#68655F] dark:text-[#9C978D] text-[11px] font-mono">{user?.handle}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigateTo('profile');
                      }}
                      className="w-full px-3 py-2 text-left text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#242930] flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#68655F] dark:text-[#9C978D]" />
                      Profile & Settings
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigateTo('my-maps');
                      }}
                      className="w-full px-3 py-2 text-left text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#242930] flex items-center gap-2 cursor-pointer"
                    >
                      <Folder className="w-3.5 h-3.5 text-[#68655F] dark:text-[#9C978D]" />
                      My Maps ({user?.stats.mapsCreated || 0})
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigateTo('create-map');
                      }}
                      className="w-full px-3 py-2 text-left text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#242930] flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#68655F] dark:text-[#9C978D]" />
                      Create New Map
                    </button>
                    <button
                      onClick={toggleTheme}
                      className="w-full px-3 py-2 text-left text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#242930] flex items-center justify-between cursor-pointer border-t border-[#D9D6CF]/50 dark:border-[#2D333D]/50 mt-1 pt-1"
                    >
                      <span className="flex items-center gap-2">
                        {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#E26D54]" /> : <Moon className="w-3.5 h-3.5 text-[#68655F]" />}
                        Theme Mode
                      </span>
                      <span className="text-[10px] uppercase font-mono text-[#68655F] dark:text-[#9C978D]">{theme}</span>
                    </button>
                  </div>

                  <div className="border-t border-[#D9D6CF] dark:border-[#2D333D] pt-1">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 text-left text-[#C84B31] dark:text-[#E26D54] hover:bg-[#FDF2F0] dark:hover:bg-[#2E1D1B] flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-[#C84B31] dark:text-[#E26D54]" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateTo('sign-in')}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigateTo('sign-up')}
            >
              Get Started
            </Button>
          </div>
        )}

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-[#68655F] dark:text-[#9C978D] hover:text-[#171717] dark:hover:text-[#F0EDE6] rounded-[6px] hover:bg-[#F7F5F0] dark:hover:bg-[#1E2228] cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-[#171717] dark:text-[#F0EDE6]" />
          ) : (
            <Menu className="w-5 h-5 text-[#171717] dark:text-[#F0EDE6]" />
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-white dark:bg-[#15171A] border-b border-[#D9D6CF] dark:border-[#2D333D] p-4 shadow-lg dark:shadow-2xl flex flex-col gap-3 z-40">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[#68655F] dark:text-[#9C978D] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search places or coordinates..."
              className="w-full h-9 pl-8 pr-3 text-xs bg-[#F7F5F0] dark:bg-[#1E2228] text-[#171717] dark:text-[#F0EDE6] placeholder:text-[#68655F]/70 dark:placeholder:text-[#9C978D]/70 rounded-[6px] border border-[#D9D6CF] dark:border-[#2D333D] focus:outline-none"
            />
          </form>

          <div className="flex flex-col gap-1 border-t border-[#D9D6CF] dark:border-[#2D333D] pt-2">
            <button
              onClick={() => {
                navigateTo('home');
                setIsMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-xs font-medium text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#1E2228] rounded-[4px] cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => {
                navigateTo('explore');
                setIsMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-xs font-medium text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#1E2228] rounded-[4px] cursor-pointer"
            >
              The Public Map
            </button>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    navigateTo('map-workspace');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left px-3 py-2 text-xs font-medium text-[#C84B31] dark:text-[#E26D54] bg-[#FAF0ED] dark:bg-[#341B18] rounded-[4px]"
                >
                  Map Workspace
                </button>
                <button
                  onClick={() => {
                    navigateTo('my-maps');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left px-3 py-2 text-xs font-medium text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#1E2228] rounded-[4px]"
                >
                  My Maps
                </button>
                <button
                  onClick={() => {
                    navigateTo('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left px-3 py-2 text-xs font-medium text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#1E2228] rounded-[4px]"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    navigateTo('profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left px-3 py-2 text-xs font-medium text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#1E2228] rounded-[4px]"
                >
                  Profile & Settings
                </button>
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left px-3 py-2 text-xs font-medium text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#1E2228] rounded-[4px] flex items-center justify-between"
                >
                  <span>Theme Mode</span>
                  <span className="uppercase font-mono text-[10px] text-[#68655F] dark:text-[#9C978D]">{theme}</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left px-3 py-2 text-xs font-medium text-[#C84B31] dark:text-[#E26D54] hover:bg-[#FDF2F0] dark:hover:bg-[#2E1D1B] rounded-[4px]"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigateTo('pricing');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left px-3 py-2 text-xs font-medium text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#1E2228] rounded-[4px]"
                >
                  Pricing
                </button>
                <button
                  onClick={() => {
                    navigateTo('support');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left px-3 py-2 text-xs font-medium text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#1E2228] rounded-[4px]"
                >
                  Documentation
                </button>
                <button
                  onClick={() => {
                    navigateTo('sign-in');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left px-3 py-2 text-xs font-medium text-[#171717] dark:text-[#F0EDE6] hover:bg-[#F7F5F0] dark:hover:bg-[#1E2228] rounded-[4px]"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
