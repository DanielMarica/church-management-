import React, { useState, useEffect } from 'react';
import { isSupabaseEnabled, supabase } from './lib/supabase';
import type { Profile } from '@/src/types/database';
import {
  Calendar,
  Users,
  BookOpen,
  LogOut,
  GraduationCap,
  MessageSquare,
  Package,
  LayoutDashboard,
  Church,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar';
import { ScrollArea } from '@/src/components/ui/scroll-area';

// Components
import Dashboard from './src/components/Dashboard';
import Children from './src/components/Children';
import Teams from './src/components/Teams';
import Courses from './src/components/Courses';
import Planning from './src/components/Planning';
import Formation from './src/components/Formation';
import Forum from './src/components/Forum';
import LessonStocks from './src/components/LessonStocks';
import Login from './src/components/Login';
import Register from './src/components/Register';
import { User } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const isOfflineMode = !isSupabaseEnabled || !supabase;

  const offlineProfile: Profile = {
    id: 'offline-user',
    email: 'offline@local.dev',
    full_name: 'Mode Local',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  useEffect(() => {
    if (isOfflineMode || !supabase) {
      setProfile(offlineProfile);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isOfflineMode]);

  const loadProfile = async (userId: string) => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      setUser(null);
      setProfile(offlineProfile);
      setActiveModule('dashboard');
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Church className="w-16 h-16 text-foreground animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isOfflineMode && (!user || !profile)) {
    return showRegister ? (
      <Register onBackToLogin={() => setShowRegister(false)} />
    ) : (
      <Login onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  const currentProfile = profile ?? offlineProfile;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'children', label: 'Children', icon: Users },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'formation', label: 'Formation', icon: GraduationCap },
    { id: 'forum', label: 'Forum', icon: MessageSquare },
    { id: 'lesson-stocks', label: 'Lesson Stocks', icon: Package },
  ];

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard profile={currentProfile} />;
      case 'children':
        return <Children profile={currentProfile} />;
      case 'teams':
        return <Teams profile={currentProfile} />;
      case 'courses':
        return <Courses profile={currentProfile} />;
      case 'planning':
        return <Planning profile={currentProfile} />;
      case 'formation':
        return <Formation profile={currentProfile} />;
      case 'forum':
        return <Forum profile={currentProfile} />;
      case 'lesson-stocks':
        return <LessonStocks profile={currentProfile} />;
      default:
        return <Dashboard profile={currentProfile} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 md:p-4 flex gap-4 overflow-hidden relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside
        className={`bg-white shadow-lg transition-all duration-300 flex flex-col z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:rounded-3xl
          fixed md:relative
          inset-y-0 left-0
          w-64 md:w-64
          h-screen md:h-[calc(100vh-2rem)]
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <Church className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-lg">Sunday School</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden hover:bg-purple-100 hover:text-purple-600 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Divider */}
        <div className="px-4 mb-4 flex-shrink-0">
          <div className="h-px bg-gray-200"></div>
        </div>

        {/* User Info */}
        <div className="px-4 mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold">
                {currentProfile.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-gray-900">
                {currentProfile.full_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {currentProfile.role}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Label */}
        <div className="px-4 mb-2 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Menu
          </p>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-hidden px-3">
          <ScrollArea className="h-full">
            <nav className="space-y-1 pb-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-black text-white shadow-lg'
                        : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </div>

        {/* General Label */}
        <div className="px-4 mb-2 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            General
          </p>
        </div>

        {/* Sign Out */}
        <div className="p-3 flex-shrink-0">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content - Responsive */}
      <main 
        className="flex-1 bg-white shadow-sm overflow-y-auto md:rounded-3xl h-screen md:h-[calc(100vh-2rem)] p-4 md:p-6"
      >
        {/* Mobile Menu Button */}
        <div className="md:hidden mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {menuItems.find(item => item.id === activeModule)?.label}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {renderModule()}
      </main>
    </div>
  );
}

export default App;