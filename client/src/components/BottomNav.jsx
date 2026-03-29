import { NavLink } from 'react-router-dom';
import { Home, Flag, Newspaper, Headphones } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/leaderboard', label: 'Scores', Icon: Flag },
  { to: '/articles', label: 'News', Icon: Newspaper },
  { to: '/podcasts', label: 'Podcasts', Icon: Headphones },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} strokeWidth={1.8} />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
