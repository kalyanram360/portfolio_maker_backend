import React from 'react';
import data from '../../data.json';

const SkillsPage = () => {

  const languages = data.languages_skills_info;


  const frameworks = data.frameworks_skills_info;


  const SkillCard = ({ skill }) => (
    <div className="bg-cyan-900/30 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-700/50 hover:shadow-cyan-500/20 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center mb-4">
        <div className="bg-cyan-800/50 p-3 rounded-full mr-4 w-16 h-16 flex items-center justify-center">
          <img src={skill.icon} alt={skill.name} className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-medium text-white">{skill.name}</h3>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-cyan-400 h-2.5 rounded-full" 
          style={{ width: `${skill.level}%` }}
        ></div>
      </div>
      <div className="mt-2 text-right text-gray-300 text-sm">{skill.level}%</div>
    </div>
  );

  return (
    <div className="pt-32 pb-16 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-12">My Skills</h1>
        
        {/* Languages Section */}
        <div className="mb-16">
          <div className="flex items-center mb-8">
            <div className="flex-grow h-px bg-cyan-700/50"></div>
            <h2 className="text-2xl font-semibold text-cyan-400 px-4">Languages</h2>
            <div className="flex-grow h-px bg-cyan-700/50"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {languages.map((skill) => (
              <SkillCard key={skill.name} skill={skill} />
            ))}
          </div>
        </div>
        
        {/* Frameworks Section */}
        <div>
          <div className="flex items-center mb-8">
            <div className="flex-grow h-px bg-cyan-700/50"></div>
            <h2 className="text-2xl font-semibold text-cyan-400 px-4">Frameworks</h2>
            <div className="flex-grow h-px bg-cyan-700/50"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {frameworks.map((skill) => (
              <SkillCard key={skill.name} skill={skill} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsPage;