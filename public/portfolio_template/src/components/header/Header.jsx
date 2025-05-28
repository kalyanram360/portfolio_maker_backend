
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import data from '../../data.json'; // Assuming you have a data.json file for the brand name
name = data.home_info.name; // Extracting the brand name from the data

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed w-full top-0 z-50 px-4 py-3">
      <nav className="bg-cyan-900 backdrop-blur-sm max-w-6xl mx-auto rounded-full px-5 py-2 shadow-lg border border-slate-700/50 relative">
        <div className="flex items-center justify-between">
          {/* Logo/Brand Name */}
          <div className="text-white font-semibold text-2xl py-2">
            {name}
          </div>

          {/* Hamburger Menu Button (Mobile Only) */}
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-0.5 bg-white mb-1.5"></div>
            <div className="w-6 h-0.5 bg-white mb-1.5"></div>
            <div className="w-6 h-0.5 bg-white"></div>
          </button>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex md:flex-1 md:justify-end md:gap-8 text-center">
            <li>
              <NavLink
                to=""
                className={({ isActive }) => 
                  `px-3 py-2 text-white rounded-full text-2xl transition-colors duration-300 ${
                    isActive ? 'bg-gray-800' : 'hover:bg-gray-800'
                  }`
                }
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="projects"
                className={({ isActive }) => 
                  `px-3 py-2 text-white rounded-full text-2xl transition-colors duration-300 ${
                    isActive ? 'bg-gray-800' : 'hover:bg-gray-800'
                  }`
                }
              >
                Projects
              </NavLink>
            </li>
            <li>
              <NavLink
                to="skills"
                className={({ isActive }) => 
                  `px-3 py-2 text-white rounded-full text-2xl transition-colors duration-300 ${
                    isActive ? 'bg-gray-800' : 'hover:bg-gray-800'
                  }`
                }
              >
                Skills
              </NavLink>
            </li>
            <li>
              <NavLink
                to="contact"
                className={({ isActive }) => 
                  `px-3 py-2 text-white rounded-full text-2xl transition-colors duration-300 ${
                    isActive ? 'bg-gray-800' : 'hover:bg-gray-800'
                  }`
                }
              >
                Contact
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 mt-2 p-3 bg-cyan-900 rounded-xl shadow-lg border border-slate-700/50">
            <ul className="flex flex-col text-center space-y-2">
              <li>
                <NavLink
                  to=""
                  className={({ isActive }) => 
                    `block px-3 py-2 text-white rounded-lg text-lg transition-colors duration-300 ${
                      isActive ? 'bg-gray-800' : 'hover:bg-gray-800'
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="projects"
                  className={({ isActive }) => 
                    `block px-3 py-2 text-white rounded-lg text-lg transition-colors duration-300 ${
                      isActive ? 'bg-gray-800' : 'hover:bg-gray-800'
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Projects
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="skills"
                  className={({ isActive }) => 
                    `block px-3 py-2 text-white rounded-lg text-lg transition-colors duration-300 ${
                      isActive ? 'bg-gray-800' : 'hover:bg-gray-800'
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Skills
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="contact"
                  className={({ isActive }) => 
                    `block px-3 py-2 text-white rounded-lg text-lg transition-colors duration-300 ${
                      isActive ? 'bg-gray-800' : 'hover:bg-gray-800'
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </NavLink>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;