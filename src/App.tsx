/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { StudyPlansPage } from './pages/StudyPlansPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';

function normalizeHashPath(hashValue: string): string {
  const cleaned = hashValue.replace(/^#/, '').split('?')[0];
  return cleaned || '/';
}

function shouldUseHashRouting(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.location.hash.startsWith('#/')) return true;
  const { hostname, protocol, port } = window.location;
  if (
    hostname.endsWith('.github.io') ||
    protocol === 'file:' ||
    port === '4173' ||
    import.meta.env.PROD
  ) {
    return true;
  }
  return false;
}

function getInitialRoute(): string {
  if (typeof window === 'undefined') return '/';
  if (window.location.hash.startsWith('#/')) {
    return normalizeHashPath(window.location.hash);
  }
  const path = window.location.pathname || '/';
  return path === '/index.html' ? '/' : path;
}

function AppShell() {
  const [currentPath, setCurrentPath] = useState<string>(getInitialRoute);
  const useHash = shouldUseHashRouting();

  useEffect(() => {
    const onRouteChange = () => {
      setCurrentPath(getInitialRoute());
    };
    window.addEventListener('popstate', onRouteChange);
    window.addEventListener('hashchange', onRouteChange);
    return () => {
      window.removeEventListener('popstate', onRouteChange);
      window.removeEventListener('hashchange', onRouteChange);
    };
  }, []);

  const navigate = (path: string) => {
    if (useHash) {
      if (window.location.hash !== `#${path}`) {
        window.location.hash = path;
      }
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPage = () => {
    switch (currentPath) {
      case '/':
        return <HomePage onNavigate={navigate} />;
      case '/study-plans':
        return <StudyPlansPage />;
      case '/resources':
        return <ResourcesPage />;
      case '/announcements':
        return <AnnouncementsPage />;
      case '/notifications':
        return <NotificationsPage />;
      case '/achievements':
        return <AchievementsPage />;
      case '/contact':
        return <ContactPage />;
      case '/login':
        return <LoginPage onNavigate={navigate} />;
      case '/register':
        return <RegisterPage onNavigate={navigate} />;
      case '/dashboard':
        return <DashboardPage onNavigate={navigate} />;
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar currentPath={currentPath} onNavigate={navigate} />
      <main className="flex-1">{renderPage()}</main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ErrorBoundary>
  );
}
