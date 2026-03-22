// src/components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { to: "/",          label: "Home" },
  { to: "/query",     label: "Query" },
  { to: "/analytics", label: "Analytics" },
];

function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <span className="text-xl font-bold text-gray-800 tracking-tight">
        SearchApp
      </span>
      <div className="flex gap-6">
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`text-sm font-medium transition-colors ${
              pathname === to
                ? "text-blue-600 border-b-2 border-blue-600 pb-0.5"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
