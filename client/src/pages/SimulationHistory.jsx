import React, { useState, useEffect } from 'react'
import { History, Eye, Trash2 } from 'lucide-react'
import axios from 'axios'

const SimulationHistory = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/simulations/history')
      if (response.data.success) {
        setHistory(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteHistory = async (id) => {
    if (confirm('Are you sure you want to delete this simulation?')) {
      try {
        await axios.delete(`/api/simulations/history/${id}`)
        setHistory(history.filter(h => h._id !== id))
      } catch (error) {
        console.error('Error deleting:', error)
      }
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Simulation History</h1>
        <p className="mt-1 text-sm text-gray-600">View and manage saved simulations</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {history.length === 0 ? (
          <div className="text-center py-8">
            <History className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No simulations saved</h3>
            <p className="mt-1 text-sm text-gray-500">Run a simulation and save it to see history here.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Algorithm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg WT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((sim) => (
                <tr key={sim._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sim.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sim.algorithm}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sim.inputProcesses?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sim.metrics?.averageWaitingTime || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sim.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteHistory(sim._id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default SimulationHistory
