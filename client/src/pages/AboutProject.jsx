import React from 'react'
import { Info, Code, Database } from 'lucide-react'

const AboutProject = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">About Project</h1>
        <p className="mt-1 text-sm text-gray-600">Project information and details</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Info className="h-5 w-5 mr-2 text-indigo-600" />
            Project Information
          </h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Project Title</dt>
              <dd className="mt-1 text-sm text-gray-900">CPU Scheduling Algorithm Simulator</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Subject</dt>
              <dd className="mt-1 text-sm text-gray-900">PT101 – Platform Technology</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Institution</dt>
              <dd className="mt-1 text-sm text-gray-900">Ramon Magsaysay Memorial College</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Academic Year</dt>
              <dd className="mt-1 text-sm text-gray-900">First Semester, AY 2026–2027</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Purpose</dt>
              <dd className="mt-1 text-sm text-gray-900">
                An educational tool to simulate and visualize various CPU scheduling algorithms, 
                helping students understand process scheduling concepts in Operating Systems.
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Code className="h-5 w-5 mr-2 text-indigo-600" />
            Technology Stack
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-green-600">MongoDB</p>
              <p className="text-xs text-gray-500">Database</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-600">Express.js</p>
              <p className="text-xs text-gray-500">Backend</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-blue-600">React</p>
              <p className="text-xs text-gray-500">Frontend</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-green-700">Node.js</p>
              <p className="text-xs text-gray-500">Runtime</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-cyan-600">Tailwind CSS</p>
              <p className="text-xs text-gray-500">Styling</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-purple-600">Vite</p>
              <p className="text-xs text-gray-500">Build Tool</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-orange-600">Recharts</p>
              <p className="text-xs text-gray-500">Charts</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-pink-600">Lucide React</p>
              <p className="text-xs text-gray-500">Icons</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Implemented Algorithms</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <li className="text-sm text-gray-700">• First Come First Served (FCFS) - Non-preemptive</li>
            <li className="text-sm text-gray-700">• Shortest Job First (SJF) - Non-preemptive</li>
            <li className="text-sm text-gray-700">• Shortest Remaining Time First (SRTF) - Preemptive</li>
            <li className="text-sm text-gray-700">• Priority Scheduling - Non-preemptive</li>
            <li className="text-sm text-gray-700">• Round Robin (RR) - Preemptive</li>
            <li className="text-sm text-gray-700">• Multilevel Queue (MLQ) - Queue-based</li>
            <li className="text-sm text-gray-700">• Multilevel Feedback Queue (MLFQ) - Feedback Queue</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AboutProject
