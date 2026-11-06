import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Upload, Download } from 'lucide-react'

const ProcessManager = () => {
  const [processes, setProcesses] = useState([
    { id: 1, processId: 'P1', arrivalTime: 0, burstTime: 5, priority: 2, queueLevel: 1 },
    { id: 2, processId: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, queueLevel: 0 },
    { id: 3, processId: 'P3', arrivalTime: 2, burstTime: 4, priority: 3, queueLevel: 1 },
    { id: 4, processId: 'P4', arrivalTime: 4, burstTime: 2, priority: 2, queueLevel: 0 },
  ])
  const [showModal, setShowModal] = useState(false)
  const [editingProcess, setEditingProcess] = useState(null)
  const [formData, setFormData] = useState({
    processId: '',
    arrivalTime: '',
    burstTime: '',
    priority: '',
    queueLevel: ''
  })

  const handleAdd = () => {
    setEditingProcess(null)
    setFormData({ processId: '', arrivalTime: '', burstTime: '', priority: '', queueLevel: '' })
    setShowModal(true)
  }

  const handleEdit = (process) => {
    setEditingProcess(process)
    setFormData({
      processId: process.processId,
      arrivalTime: process.arrivalTime,
      burstTime: process.burstTime,
      priority: process.priority,
      queueLevel: process.queueLevel
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this process?')) {
      setProcesses(processes.filter(p => p.id !== id))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingProcess) {
      setProcesses(processes.map(p => 
        p.id === editingProcess.id ? { ...p, ...formData, arrivalTime: Number(formData.arrivalTime), burstTime: Number(formData.burstTime), priority: formData.priority === '' ? undefined : Number(formData.priority), queueLevel: formData.queueLevel === '' ? undefined : Number(formData.queueLevel) } : p
      ))
    } else {
      const newProcess = {
        id: Date.now(),
        processId: formData.processId,
        arrivalTime: Number(formData.arrivalTime),
        burstTime: Number(formData.burstTime),
        priority: formData.priority === '' ? undefined : Number(formData.priority),
        queueLevel: formData.queueLevel === '' ? undefined : Number(formData.queueLevel)
      }
      setProcesses([...processes, newProcess])
    }
    setShowModal(false)
  }

  const loadSampleData = () => {
    setProcesses([
      { id: 1, processId: 'P1', arrivalTime: 0, burstTime: 5, priority: 2, queueLevel: 1 },
      { id: 2, processId: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, queueLevel: 0 },
      { id: 3, processId: 'P3', arrivalTime: 2, burstTime: 4, priority: 3, queueLevel: 1 },
      { id: 4, processId: 'P4', arrivalTime: 4, burstTime: 2, priority: 2, queueLevel: 0 },
    ])
  }

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all processes?')) {
      setProcesses([])
    }
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Process Manager</h1>
          <p className="mt-1 text-sm text-gray-600">Manage process inputs for simulation</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={loadSampleData} className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100">
            Load Sample Data
          </button>
          <button onClick={clearAll} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100">
            Clear All
          </button>
          <button onClick={handleAdd} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Process
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrival Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Burst Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queue Level</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processes.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No processes added. Click "Add Process" or "Load Sample Data".
                </td>
              </tr>
            ) : (
              processes.map((process) => (
                <tr key={process.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{process.processId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{process.arrivalTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{process.burstTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{process.priority !== undefined ? process.priority : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{process.queueLevel !== undefined ? process.queueLevel : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(process)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(process.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingProcess ? 'Edit Process' : 'Add Process'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Process ID</label>
                  <input
                    type="text"
                    required
                    value={formData.processId}
                    onChange={(e) => setFormData({...formData, processId: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="P1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Arrival Time</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Burst Time</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.burstTime}
                    onChange={(e) => setFormData({...formData, burstTime: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority (optional)</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Lower number = higher priority"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Queue Level (optional)</label>
                  <input
                    type="number"
                    value={formData.queueLevel}
                    onChange={(e) => setFormData({...formData, queueLevel: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0 or 1 for MLQ"
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {editingProcess ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProcessManager
