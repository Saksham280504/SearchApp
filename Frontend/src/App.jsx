import React, { useState } from "react";
import axios from "axios";

// This is a React app using Tailwind CSS for styling and Axios to interact with a backend API.

function App() {
    const [keyword, setKeyword] = useState("");
    const [searchType, setSearchType] = useState("compound");
    const [downloadLink, setDownloadLink] = useState("");
    const [sortedFileNames, setsortedFileNames] = useState([]);

    /*
       component uses useState to manage:

keyword: Stores the user's search input.
searchType: Either "compound" or "category".
downloadLink: Stores the link to the filtered Excel file if results are found.
     */

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!keyword) return alert("Enter a search keyword");

        try {
            const res = await axios.post("http://localhost:5000/search", { keyword, searchType });
            if (res.data.success) {
                setDownloadLink(res.data.file); // Set the download link in state
                console.log(res.data.file);
                setsortedFileNames(res.data.fileNames);
                console.log(res.data.fileNames);
            } else {
                alert("No matches found.");
            }
        } catch (err) {
            console.error(err);
            alert("Error processing search");
        }
        console.log(`Download Link:${downloadLink}`);
        console.log(sortedFileNames);
    };

    const handleDownload = async () => {
        if(!downloadLink) {
            alert("No file available for download.");
            return;
        }

        try {
            const response = await axios.get(downloadLink, { responseType: "blob"})

            const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = 'filtered_results.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download failed", error);
            alert("Error downloading file");
        }
    };

    /*
    Prevents default form submission (e.preventDefault()).
Checks if a keyword is entered; otherwise, it alerts the user.
Sends a POST request to http://localhost:5000/search with keyword and searchType.
If results exist, it sets downloadLink to display a download button.
If no matches are found, it alerts the user.
     */

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
          {/* Centers the content using Flexbox (flex-col items-center justify-center).
Sets a light gray background (bg-gray-100).
Ensures it takes up the full screen height (min-h-screen). */}
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Compound & Category Search</h1>
            {/* Uses large, bold text (text-3xl font-bold).
Adds some bottom spacing (mb-6). */}
            <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              {/* Creates a card-like search form (bg-white p-6 rounded-lg shadow-lg).
Limits width for a clean, centered layout (w-full max-w-md) */}
                <input
                    type="text"
                    placeholder="Enter search keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                {/* Full width (w-full) and rounded corners (rounded-lg).
                Adds a blue focus effect (focus:ring-2 focus:ring-blue-500). */}
                <div className="flex items-center space-x-4 mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            id="compound"
                            name="searchType"
                            value="compound"
                            checked={searchType === "compound"}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="w-4 h-4"
                        />
                        <span className="text-gray-700">Compound Search</span>
                    </label>
                    {/* Styled radio buttons with proper spacing (space-x-2).
Clicking on the label selects the radio button (cursor-pointer). */}
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            id="category"
                            name="searchType"
                            value="category"
                            checked={searchType === "category"}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="w-4 h-4"
                        />
                        <span className="text-gray-700">Category Search</span>
                    </label>
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                    Search
                </button>
                {/* Blue button (bg-blue-500) that darkens on hover (hover:bg-blue-600).
Smooth transition effect (transition-all). */}
            </form>

            {downloadLink && (
                <button onClick={handleDownload} className="mt-6 p-4 bg-white shadow-md rounded-lg w-full max-w-md text-center">
                    Download Results
                </button>
            )}
            {/* If downloadLink exists, it shows a download button.
Uses text-center to align text properly.
The download link has hover effects (hover:underline).
 */}
        </div>
    );
}

export default App;

// How does it work?
// User enters a keyword and selects Compound Search or Category Search.
// On search, the app sends the request to http://localhost:5000/search.
// If matches are found, the user gets a downloadable Excel file.
// Otherwise, an alert is shown.

// --------------------------------------------------


// import React, { useState } from "react";
// import axios from "axios";

// function App() {
//   const [keyword, setKeyword] = useState("");
//   const [searchType, setSearchType] = useState("compound");
//   const [downloadLink, setDownloadLink] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if(!keyword) return alert("Enter a search keyword");

//     try {
//       const res = await axios.post("http://localhost:5000/search", {keyword, searchType });
//       if (res.data.success) {
//         setDownloadLink(res.data.file);
//       } else {
//         alert("No matches found");
//       } 
//     } catch (err) {
//         console.error(err);
//         alert("Error processing search");
//       }
    
// };

// return (
//   <>
//   <div>
//   <h1>Compound & Category Search</h1>
//   <form onSubmit={handleSubmit}>
//     <input 
//     type="text"
//     placeholder="Enter search keyword"
//     value={keyword}
//     onChange={(e) => setKeyword(e.target.value)}
//     required
//     />
//     <div>
//   <label>
//     <input 
//     type="radio" 
//     name="searchType"
//     id="compound"
//     value="compound"
//     checked={searchType === "compound"}
//     onChange={(e) => setSearchType(e.target.value)}
//     />
//     <span>Compound Search</span>
//   </label>
//   <label>
//     <input 
//     type="radio" 
//     name="searchType"
//     id="category"
//     value="category"
//     checked={searchType === "category"}
//     onChange={(e) => setSearchType(e.target.value)}
//     />
//     <span>Category Search</span>
//   </label>
//   </div>
//   <button
//    type="submit">
//     Search
//   </button>
//   </form>

//   {downloadLink && (
//     <div>
//       <p>Download Filtered Results:</p>
//       <a href={downloadLink} download>
//         Download Excel
//       </a>
//     </div>
//   )}
//   </div>
//   </>
// );
// }

// export default App;