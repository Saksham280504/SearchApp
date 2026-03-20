import { useState } from "react";
import CompoundSearch from "../Components/CompoundSearch";
import CategorySearch from "../Components/CategorySearch";

function QueryPage() {
  const [activeTab, setActiveTab] = useState("compound");

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mt-6 mb-2">Search</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Choose a search mode below to get started.
      </p>

      {/* Tab Switcher */}
      <div className="flex bg-white rounded-xl shadow-md p-1 mb-8 gap-1">
        <button
          onClick={() => setActiveTab("compound")}
          className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeTab === "compound"
              ? "bg-blue-500 text-white shadow"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          🔬 Compound Search
        </button>
        <button
          onClick={() => setActiveTab("category")}
          className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeTab === "category"
              ? "bg-green-500 text-white shadow"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          🗂️ Category Search
        </button>
      </div>

      {/* Tab Description Badge */}
      <div className="mb-6">
        {activeTab === "compound" ? (
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
            Search by compound name → view files, properties &amp; bar graphs
          </span>
        ) : (
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
            Search by category → browse all matching compounds
          </span>
        )}
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === "compound" ? <CompoundSearch /> : <CategorySearch />}
      </div>
    </div>
  );
}

export default QueryPage;