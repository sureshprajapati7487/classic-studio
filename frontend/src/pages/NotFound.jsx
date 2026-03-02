import { Link } from 'react-router-dom';
import { FiHome, FiArrowRight } from 'react-icons/fi';
import './NotFound.css';

export default function NotFound() {
    return (
        <div className="notfound page-enter">
            <div className="notfound__glow" />
            <div className="notfound__content">
                <div className="notfound__code">404</div>
                <h1 className="notfound__title">
                    Page <span className="gold-text">Not Found</span>
                </h1>
                <p className="notfound__desc">
                    Oops! Yeh page exist nahi karta. Shayad link galat hai ya page hata diya gaya.
                </p>
                <div className="notfound__actions">
                    <Link to="/" className="btn btn-primary">
                        <FiHome size={16} /> Go Home
                    </Link>
                    <Link to="/portfolio" className="btn btn-outline">
                        View Portfolio <FiArrowRight size={15} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
