import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Header from './Header';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
