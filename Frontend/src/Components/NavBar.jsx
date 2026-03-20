import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <span className="text-xl font-bold text-gray-800 tracking-tight">
        🧪 SearchApp
      </span>
      <div className="flex gap-6">
        <Link
          to="/"
          className={`text-sm font-medium transition-colors ${
            pathname === "/"
              ? "text-blue-600 border-b-2 border-blue-600 pb-0.5"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Home
        </Link>
        <Link
          to="/query"
          className={`text-sm font-medium transition-colors ${
            pathname === "/query"
              ? "text-blue-600 border-b-2 border-blue-600 pb-0.5"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Query
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;