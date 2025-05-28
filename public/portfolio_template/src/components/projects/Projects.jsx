import React from 'react';
import ProjectCard from './ProjectCard';
import  data from '../../data.json';

const projects = data.projects_info;

const Projects = () => {
  return (
    <section className="pt-32 max-w-6xl mx-auto px-4">
      <h1 className="text-5xl font-bold text-white text-center mb-16">Projects</h1>
      {projects.map((project, index) => (
        <ProjectCard
          key={index}
          title={project.title}
          description={project.description}
          imageUrl={project.imageUrl}
          reverse={index % 2 !== 0}
          githubUrl = {project.githubUrl}
          liveUrl = {project.liveUrl}
        />
      ))}
    </section>
  );
};

export default Projects;