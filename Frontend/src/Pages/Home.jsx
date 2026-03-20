import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100 p-8 text-center">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
        Welcome to SearchApp 🧪
      </h1>
      <p className="text-gray-500 max-w-md mb-8 text-base leading-relaxed">
        Perform real-time compound and category searches across your dataset.
        Filter by properties, visualize area distributions, and compare results side by side.
      </p>

      <div className="flex gap-6 flex-wrap justify-center mb-12">
        <div className="bg-white rounded-xl shadow p-5 w-52 text-left">
          <div className="text-2xl mb-2">🔬</div>
          <h3 className="font-bold text-gray-700 mb-1">Compound Search</h3>
          <p className="text-sm text-gray-500">Search by compound name and explore matching files with their full properties.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 w-52 text-left">
          <div className="text-2xl mb-2">🗂️</div>
          <h3 className="font-bold text-gray-700 mb-1">Category Search</h3>
          <p className="text-sm text-gray-500">Browse all compounds within a category and drill into individual results.</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 w-52 text-left">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-bold text-gray-700 mb-1">Compare Results</h3>
          <p className="text-sm text-gray-500">Save multiple compound searches and compare their area bar graphs.</p>
        </div>
      </div>

      <button
        onClick={() => navigate("/query")}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-xl shadow-md transition-all text-base"
      >
        Get Started →
      </button>
    </div>
  );
}

export default Home;