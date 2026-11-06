import React, { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import axios from 'axios'

const ALGORITHMS = [
  { value: 'FCFS', label: 'FCFS' },
  { value: 'SJF', label: 'SJF' },
  { value: 'SRTF', label: 'SRTF' },
  { value: 'Priority', label: 'Priority' },
  { value: 'RoundRobin', label: 'Round Robin' },
  { value: 'MLQ', label: 'MLQ' },
  { value: 'MLFQ', label: 'MLFQ' },
]

const AlgorithmComparison = () => {
  const [selectedAlgos, setSelectedAlgos] = useState(['FCFS', 'SJF', 'RoundRobin'])
  const [quantum, setQuantum] = useState(2)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')

  const processes = [
    { processId: 'P1', arrivalTime: 0, burstTime: 5, priority: 2, queueLevel: 1 },
    { processId: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, queueLevel: 0 },
    { processId: 'P3', arrivalTime: 2, burstTime: 4, priority: 3, queueLevel: 1 },
    { processId: 'P4', arrivalTime: 4, burstTime: 2, priority: 2, queueLevel: 0 },
  ]

  const toggleAlgorithm = (algo) => {
    if (selectedAlgos.includes(algo)) {
      setSelectedAlgos(selectedAlgos.filter(a => a !== algo))
    } else {
      setSelectedAlgos([...selectedAlgos, algo])
    }
  }

  const compareAlgorithms = async () => {
    if (selectedAlgos.length < 2) {
      setError('Select at least two algorithms')
      return
    }
    setLoading(true)
    setError('')
    try {
      const configurations = {
        RoundRobin: { quantum },
        MLQ: { quantum0: quantum }
      }

      const response = await axios.post('/api/simulations/compare', {
        processes,
        algorithms: selectedAlgos,
        configurations
      })

      if (response.data.success) {
        setResults(response.data.data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error comparing algorithms')
    } finally {
      setLoading(false)
    }
  }

  const chartData = results.map(r => ({
    name: r.algorithm,
    avgWT: r.metrics?.averageWaitingTime || 0,
    avgTAT: r.metrics?.averageTurnaroundTime || 0,
    avgRT: r.metrics?.averageResponseTime || 0,
    cpuUtil: r.metrics?.cpuUtilization || 0
  }))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Algorithm Comparison</h1>
        <p className="mt-1 text-sm text-gray-600">Compare different scheduling algorithms with the same process input</p>
      </div>

      {/* Configuration */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Algorithms to Compare</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {ALGORITHMS.map((algo) => (
            <button
              key={algo.value}
              onClick={() => toggleAlgorithm(algo.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                selectedAlgos.includes(algo.value)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {algo.label}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Quantum (for RR/MLQ)</label>
          <input
            type="number"
            min="1"
            value={quantum}
            onChange={(e) => setQuantum(Number(e.target.value))}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={compareAlgorithms}
          disabled={loading || selectedAlgos.length < 2}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {loading ? 'Comparing...' : 'Compare Algorithms'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <>
          {/* Comparison Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Comparison Results</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Algorithm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Waiting Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Turnaround Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Response Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPU Utilization</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.algorithm}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.metrics?.averageWaitingTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.metrics?.averageTurnaroundTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.metrics?.averageResponseTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.metrics?.cpuUtilization}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Average Waiting Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgWT" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Average Turnaround Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgTAT" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AlgorithmComparison
