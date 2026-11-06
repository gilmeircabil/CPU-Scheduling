import React from 'react'
import { BookOpen } from 'lucide-react'

const AlgorithmsGuide = () => {
  const algorithms = [
    {
      name: 'First Come First Served (FCFS)',
      type: 'Non-preemptive',
      description: 'Processes are executed in the order they arrive in the ready queue.',
      howItWorks: 'Schedule available processes in arrival-time order. Once started, runs until completion.',
      advantages: ['Simple to understand and implement', 'Fair in terms of arrival order'],
      disadvantages: ['Convoy effect', 'Poor average waiting time', 'Not suitable for interactive systems'],
      starvation: 'No starvation possible as all processes eventually get CPU'
    },
    {
      name: 'Shortest Job First (SJF)',
      type: 'Non-preemptive',
      description: 'Selects the process with smallest burst time among those in ready queue.',
      howItWorks: 'At each decision, choose arrived process with smallest burst time. Runs to completion.',
      advantages: ['Minimum average waiting time among non-preemptive', 'Optimal for given set of processes'],
      disadvantages: ['Requires knowledge of burst times', 'Can cause starvation for long processes'],
      starvation: 'Possible for long processes if short processes keep arriving'
    },
    {
      name: 'Shortest Remaining Time First (SRTF)',
      type: 'Preemptive',
      description: 'Preemptive version of SJF, selects process with shortest remaining time.',
      howItWorks: 'Always execute process with shortest remaining execution time. Preempt if shorter arrives.',
      advantages: ['Optimal among all scheduling algorithms', 'Minimizes average waiting time'],
      disadvantages: ['High overhead due to context switching', 'Requires burst time estimation'],
      starvation: 'Possible for long processes'
    },
    {
      name: 'Priority Scheduling',
      type: 'Non-preemptive',
      description: 'Each process assigned priority; CPU allocated to highest priority process.',
      howItWorks: 'Smaller numerical priority means higher priority. Select highest priority arrived process.',
      advantages: ['Important tasks get preference', 'Flexible'],
      disadvantages: ['Priority inversion', 'Starvation of low priority processes'],
      starvation: 'Possible for low priority processes'
    },
    {
      name: 'Round Robin (RR)',
      type: 'Preemptive',
      description: 'Each process gets fixed time quantum in circular order.',
      howItWorks: 'Use ready queue, execute for quantum or remaining time, move unfinished to end.',
      advantages: ['Fair allocation', 'Good for time-sharing systems', 'No starvation'],
      disadvantages: ['High context switching overhead', 'Performance depends on quantum size'],
      starvation: 'No starvation as every process gets CPU time'
    },
    {
      name: 'Multilevel Queue (MLQ)',
      type: 'Queue-based',
      description: 'Processes divided into queues based on priority/type, each with its own scheduling.',
      howItWorks: 'Queue 0 (high priority, RR) has strict priority over Queue 1 (low priority, FCFS).',
      advantages: ['Fast response for high priority', 'Different scheduling for different process types'],
      disadvantages: ['Inflexible - processes cannot move between queues', 'Can starve lower queues'],
      starvation: 'Possible in lower priority queues'
    },
    {
      name: 'Multilevel Feedback Queue (MLFQ)',
      type: 'Feedback Queue',
      description: 'Allows processes to move between queues based on behavior/age.',
      howItWorks: 'New processes in Queue 0 (RR q=2). Demoted if use full quantum. Queue 2 is FCFS.',
      advantages: ['Most flexible', 'Good for various process types', 'Prevents starvation with aging'],
      disadvantages: ['Complex to implement', 'Many parameters to tune'],
      starvation: 'Minimized through feedback mechanism'
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Algorithms Guide</h1>
        <p className="mt-1 text-sm text-gray-600">Educational explanations of CPU scheduling algorithms</p>
      </div>

      <div className="space-y-6">
        {algorithms.map((algo, idx) => (
          <div key={idx} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-indigo-600" />
                  {algo.name}
                </h3>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  algo.type === 'Preemptive' ? 'bg-orange-100 text-orange-800' :
                  algo.type === 'Non-preemptive' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {algo.type}
                </span>
              </div>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Description</h4>
                <p className="mt-1 text-sm text-gray-600">{algo.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">How It Works</h4>
                <p className="mt-1 text-sm text-gray-600">{algo.howItWorks}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-green-700">Advantages</h4>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {algo.advantages.map((adv, i) => (
                      <li key={i} className="text-sm text-gray-600">{adv}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-700">Disadvantages</h4>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {algo.disadvantages.map((dis, i) => (
                      <li key={i} className="text-sm text-gray-600">{dis}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Starvation</h4>
                <p className="mt-1 text-sm text-gray-600">{algo.starvation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AlgorithmsGuide
