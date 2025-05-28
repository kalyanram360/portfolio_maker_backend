

import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const ProjectCard = ({ title, description, imageUrl, reverse, githubUrl, liveUrl }) => {
  return (
    <motion.div
      className={`flex flex-col md:flex-row items-center gap-8 my-12 px-6 py-8 rounded-3xl border border-cyan-300/20 shadow-xl transition-all 
        ${reverse ? 'md:flex-row-reverse' : ''}
        bg-gradient-to-br from-cyan-900 via-cyan-800 to-slate-900`}
      whileHover={{ scale: 1.03 }}
    >
      {/* Project Image */}
      <img
        src={imageUrl}
        alt={title}
        className="w-full md:w-1/2 rounded-2xl shadow-lg border border-cyan-400/20"
      />

      {/* Project Details */}
      <div className="text-white md:w-1/2 space-y-4">
        <h2 className="text-3xl font-bold text-cyan-300">{title}</h2>
        <p className="text-lg text-slate-200 leading-relaxed">{description}</p>
        {/* Optional: Add GitHub / Live links */}
        <div className="flex space-x-4 pt-2">
    {githubUrl && (
      <a 
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-sm text-white hover:text-cyan-300 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        GitHub
      </a>
    )}
    
    {liveUrl && (
      <a 
        href={liveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-sm text-white hover:text-cyan-300 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Live Demo
      </a>
    )}
  </div>
      </div>
    </motion.div>
  );
};

ProjectCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  imageUrl: PropTypes.string.isRequired,
  reverse: PropTypes.bool,
};

export default ProjectCard;