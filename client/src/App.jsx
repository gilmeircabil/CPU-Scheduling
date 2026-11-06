import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import ProcessManager from './pages/ProcessManager'
import Simulator from './pages/Simulator'
import AlgorithmComparison from './pages/AlgorithmComparison'
import SimulationHistory from './pages/SimulationHistory'
import AlgorithmsGuide from './pages/AlgorithmsGuide'
import AboutProject from './pages/AboutProject'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/processes" element={<ProcessManager />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/comparison" element={<AlgorithmComparison />} />
          <Route path="/history" element={<SimulationHistory />} />
          <Route path="/guide" element={<AlgorithmsGuide />} />
          <Route path="/about" element={<AboutProject />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
