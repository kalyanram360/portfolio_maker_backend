import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter } from 'react-router-dom'
import Layout from './Layout.jsx'
import { RouterProvider } from 'react-router-dom'
import Home from './components/home/Home.jsx'
import Projects from './components/projects/Projects.jsx'
import SkillsPage from './components/skills/SkillPage.jsx'
import ContactPage from './components/contact/ContactPage.jsx'
const router = createBrowserRouter([
  {
    path: '/portfolio-website',
    element: <Layout />,
    children: [
      {
        path: '', // default child route
        element: <Home />,
      },
      {
        path: 'projects', // ✅ relative path
        element: <Projects />,
      },
      {
        path: 'skills', // ✅ relative path
        element: <SkillsPage />,
      },
      {
        path: 'contact', // ✅ relative path
        element: <ContactPage />,
      },
    ],
  },
]);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)