import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, PlayCircle, BarChart3, Clock, Activity } from 'lucide-react'
import axios from 'axios'

const Dashboard = () => {
  const [processCount, setProcessCount] = useState(0)
  const [recentSim, setRecentSim] = useState(null)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">CPU Scheduling Algorithm Simulator Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Processes in Dataset</dt>
                  <dd className="text-lg font-medium text-gray-900">{processCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Algorithms Available</dt>
                  <dd className="text-lg font-medium text-gray-900">7</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Recent Simulation</dt>
                  <dd className="text-lg font-medium text-gray-900">{recentSim ? recentSim.algorithm : 'None'}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. Waiting Time</dt>
                  <dd className="text-lg font-medium text-gray-900">{recentSim ? recentSim.metrics?.averageWaitingTime : 'N/A'}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              to="/processes"
              className="relative block w-full rounded-lg border-2 border-gray-300 p-4 hover:border-indigo-400 focus:outline-none"
            >
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-indigo-600" />
                <span className="ml-3 block text-sm font-medium text-gray-900">Add Processes</span>
              </div>
            </Link>
            <Link
              to="/simulator"
              className="relative block w-full rounded-lg border-2 border-gray-300 p-4 hover:border-indigo-400 focus:outline-none"
            >
              <div className="flex items-center">
                <PlayCircle className="h-6 w-6 text-indigo-600" />
                <span className="ml-3 block text-sm font-medium text-gray-900">Run Simulation</span>
              </div>
            </Link>
            <Link
              to="/comparison"
              className="relative block w-full rounded-lg border-2 border-gray-300 p-4 hover:border-indigo-400 focus:outline-none"
            >
              <div className="flex items-center">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
                <span className="ml-3 block text-sm font-medium text-gray-900">Compare Algorithms</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">About This Project</h3>
          <p className="text-sm text-gray-600">
            CPU Scheduling Algorithm Simulator built for PT101 - Platform Technology at Ramon Magsaysay Memorial College.
            This educational tool implements FCFS, SJF, SRTF, Priority Scheduling, Round Robin, Multilevel Queue, and Multilevel Feedback Queue algorithms.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
