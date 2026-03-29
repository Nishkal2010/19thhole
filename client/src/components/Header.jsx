import { useAuth } from '../contexts/AuthContext';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="header-inner container">
        <span className="header-title">The 19th Hole</span>
        {user && (
          <div className="header-right">
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="header-avatar"
                referrerPolicy="no-referrer"
              />
            )}
            <button onClick={logout} className="header-signout">Sign out</button>
          </div>
        )}
      </div>
      <div className="header-divider" />
    </header>
  );
}
