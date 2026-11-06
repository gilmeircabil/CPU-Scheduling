import React, { useState } from 'react'
import { Play, BarChart3 } from 'lucide-react'
import axios from 'axios'

const ALGORITHMS = [
  { value: 'FCFS', label: 'First Come First Served (FCFS)', type: 'Non-preemptive' },
  { value: 'SJF', label: 'Shortest Job First (SJF)', type: 'Non-preemptive' },
  { value: 'SRTF', label: 'Shortest Remaining Time First (SRTF)', type: 'Preemptive' },
  { value: 'Priority', label: 'Priority Scheduling', type: 'Non-preemptive' },
  { value: 'RoundRobin', label: 'Round Robin (RR)', type: 'Preemptive' },
  { value: 'MLQ', label: 'Multilevel Queue (MLQ)', type: 'Queue-based' },
  { value: 'MLFQ', label: 'Multilevel Feedback Queue (MLFQ)', type: 'Feedback Queue' },
]

const Simulator = () => {
  const [algorithm, setAlgorithm] = useState('FCFS')
  const [quantum, setQuantum] = useState(2)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Sample processes
  const [processes] = useState([
    { processId: 'P1', arrivalTime: 0, burstTime: 5, priority: 2, queueLevel: 1 },
    { processId: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, queueLevel: 0 },
    { processId: 'P3', arrivalTime: 2, burstTime: 4, priority: 3, queueLevel: 1 },
    { processId: 'P4', arrivalTime: 4, burstTime: 2, priority: 2, queueLevel: 0 },
  ])

  const runSimulation = async () => {
    setLoading(true)
    setError('')
    try {
      const config = {}
      if (algorithm === 'RoundRobin' || algorithm === 'RR') {
        config.quantum = quantum
      } else if (algorithm === 'MLQ') {
        config.quantum0 = quantum
      }

      const response = await axios.post('/api/simulations/run', {
        processes,
        algorithm,
        configuration: config
      })

      if (response.data.success) {
        setResult(response.data.data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error running simulation')
    } finally {
      setLoading(false)
    }
  }

  const getAlgorithmInfo = () => {
    return ALGORITHMS.find(a => a.value === algorithm)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Simulator</h1>
        <p className="mt-1 text-sm text-gray-600">Run CPU scheduling algorithms and visualize results</p>
      </div>

      {/* Configuration */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {ALGORITHMS.map((algo) => (
                <option key={algo.value} value={algo.value}>
                  {algo.label} - {algo.type}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">{getAlgorithmInfo()?.type}</p>
          </div>

          {(algorithm === 'RoundRobin' || algorithm === 'MLQ') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Quantum {algorithm === 'MLQ' ? '(for Queue 0)' : ''}
              </label>
              <input
                type="number"
                min="1"
                value={quantum}
                onChange={(e) => setQuantum(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        <div className="mt-4">
          <button
            onClick={runSimulation}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4 mr-2" />
            {loading ? 'Running...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {/* Process Summary */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Input Processes (Sample Data)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">AT</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">BT</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Queue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processes.map((p) => (
                <tr key={p.processId}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{p.processId}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{p.arrivalTime}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{p.burstTime}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{p.priority}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{p.queueLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {result && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white shadow rounded-lg p-4">
              <p className="text-sm text-gray-500">Avg. Waiting Time</p>
              <p className="text-2xl font-bold text-gray-900">{result.metrics.averageWaitingTime}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <p className="text-sm text-gray-500">Avg. Turnaround Time</p>
              <p className="text-2xl font-bold text-gray-900">{result.metrics.averageTurnaroundTime}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <p className="text-sm text-gray-500">Avg. Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{result.metrics.averageResponseTime}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <p className="text-sm text-gray-500">CPU Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{result.metrics.cpuUtilization}%</p>
            </div>
          </div>

          {/* Gantt Chart */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gantt Chart - {result.algorithm}</h3>
            <div className="overflow-x-auto">
              <div className="flex mb-2" style={{ minWidth: '600px' }}>
                {result.timeline.map((item, idx) => {
                  const totalTime = result.timeline.length > 0 ? result.timeline[result.timeline.length - 1].endTime : 100
                  const width = (item.duration / totalTime) * 100
                  const isIdle = item.processId === 'IDLE'
                  return (
                    <div
                      key={idx}
                      className={`border border-gray-400 text-center py-3 ${isIdle ? 'bg-gray-300' : 'bg-blue-500'}`}
                      style={{ width: `${width}%`, minWidth: '40px' }}
                      title={`${item.processId}: ${item.startTime} - ${item.endTime}`}
                    >
                      <div className="text-xs font-semibold text-white truncate">{item.processId}</div>
                    </div>
                  )
                })}
              </div>
              <div className="flex" style={{ minWidth: '600px' }}>
                {result.timeline.map((item, idx) => (
                  <div key={idx} style={{ width: `${(item.duration / (result.timeline[result.timeline.length-1]?.endTime || 1)) * 100}%`, minWidth: '40px' }} className="text-xs text-gray-600">
                    {item.startTime}
                    {idx === result.timeline.length - 1 && <span className="float-right">{item.endTime}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Process Results Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Process Metrics</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">BT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TAT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">WT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RT</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {result.processResults.map((p) => (
                  <tr key={p.processId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.processId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.arrivalTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.burstTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.completionTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.turnaroundTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.waitingTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.responseTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default Simulator
