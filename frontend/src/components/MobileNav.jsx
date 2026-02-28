import { NavLink } from 'react-router-dom';
import { FiHome, FiGrid, FiTag, FiShoppingBag, FiMail } from 'react-icons/fi';
import './MobileNav.css';

const NAV = [
    { path: '/', label: 'Home', icon: <FiHome size={22} /> },
    { path: '/portfolio', label: 'Portfolio', icon: <FiGrid size={22} /> },
    { path: '/pricing', label: 'Pricing', icon: <FiTag size={22} /> },
    { path: '/order', label: 'Order', icon: <FiShoppingBag size={22} /> },
    { path: '/contact', label: 'Contact', icon: <FiMail size={22} /> },
];

export default function MobileNav() {
    return (
        <nav className="mobile-nav" aria-label="Mobile navigation">
            {NAV.map(({ path, label, icon }) => (
                <NavLink
                    key={path}
                    to={path}
                    end={path === '/'}
                    className={({ isActive }) =>
                        `mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''}`
                    }
                >
                    <span className="mobile-nav__icon">{icon}</span>
                    <span className="mobile-nav__label">{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
