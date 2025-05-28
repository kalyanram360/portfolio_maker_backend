import { useState, useEffect } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid"; 
import data from "../../data.json"

const Home = () => {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const quote = data.home_info.quote || "Welcome to my portfolio!"; // Fallback quote if data is not available
  const image = data.home_info.image || ""; // Fallback image if data is not available
  
  useEffect(() => {
    if (index < quote.length) {
      const timeout = setTimeout(() => {
        setText((prev) => prev + quote[index]);
        setIndex((prev) => prev + 1);
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [index]);
  
  return (
    <div className="flex flex-col items-center justify-center pt-32 pb-10 max-w-xl mx-auto min-h-screen">
      {/* Profile photo with glowing border */}
      <div className="relative mb-8">
        <div className="w-100 h-100 rounded-full absolute animate-pulse bg-cyan-400 opacity-50 blur-md"></div>
        <div className="w-100 h-100 rounded-full relative overflow-hidden border-4 border-cyan-900">
          <img 
            src={image} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      
      {/* Typewriter effect quotation */}
      <div className="text-center  mb-15 ">
        <p className="text-5xl  text-gray-200 font-mono font-blod  ">"{text}<span className="animate-pulse">|</span>"</p>
      </div>
      
      {/* Download resume button */}
      <a href="#" download>
      <button 
        className="bg-cyan-900 text-white px-6 py-3 rounded-full text-2xl font-medium hover:bg-cyan-800 transition-colors duration-300 shadow-lg border border-slate-700/50 flex items-center gap-3"
      >
        <ArrowDownTrayIcon className="h-6 w-6" />
        Download Resume
      </button>
      </a>
    </div>
  );
};

export default Home;