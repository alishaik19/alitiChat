import { Link } from "react-router-dom";
import "./PageNotFound.css";

function PageNotFound() {
  return (
    <div className="notfound-wrapper">
      <div className="notfound-glow"></div>

      <div className="notfound-content">
        <h1 className="notfound-code">404</h1>
        <div className="notfound-icon">☕</div>
        <h2 className="notfound-title">Oops! Page Spilled</h2>
        <p className="notfound-text">
          The page you're looking for doesn't exist or has been moved. Let's get
          you back to safety.
        </p>

        <Link to="/" className="notfound-btn">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default PageNotFound;
