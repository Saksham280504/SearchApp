import React from "react";
import "./loader.css"; // We'll extract the keyframes here

const Loader = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-white overflow-hidden">
      <div className="flex relative">
        <div className="dash first mx-[15px] w-[35px] h-[15px] rounded-full bg-[#529ff6] shadow-[0_0_15px_0_rgb(82,159,246)]"></div>
        <div className="dash second w-[35px]  mx-4 h-[15px] rounded-full bg-[#529ff6] shadow-[0_0_15px_0_rgb(82,159,246)]"></div>
        <div className="dash third mx-[15px] w-[35px] h-[15px] rounded-full bg-[#529ff6] shadow-[0_0_15px_0_rgb(82,159,246)]"></div>
        <div className="dash fourth w-[35px]  mx-4 h-[15px] rounded-full bg-[#529ff6] shadow-[0_0_15px_0_rgb(82,159,246)]"></div>
      </div>
    </div>
  );
};

export default Loader;
