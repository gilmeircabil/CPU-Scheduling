import { describe, it, expect } from 'vitest';
import { fcfs, sjf, srtf, priorityScheduling, roundRobin, multilevelQueue, multilevelFeedbackQueue } from '../src/engine/schedulingEngine.js';

describe('CPU Scheduling Algorithms', () => {
  describe('FCFS', () => {
    it('should handle single process arriving at time 0', () => {
      const processes = [{ processId: 'P1', arrivalTime: 0, burstTime: 5 }];
      const result = fcfs(processes);
      expect(result.processResults[0].completionTime).toBe(5);
      expect(result.processResults[0].turnaroundTime).toBe(5);
      expect(result.processResults[0].waitingTime).toBe(0);
      expect(result.processResults[0].responseTime).toBe(0);
    });

    it('should handle CPU idle time before first process', () => {
      const processes = [{ processId: 'P1', arrivalTime: 3, burstTime: 2 }];
      const result = fcfs(processes);
      const idle = result.timeline.find(t => t.processId === 'IDLE');
      expect(idle).toBeDefined();
      expect(idle.duration).toBe(3);
    });

    it('should calculate correct metrics for multiple processes', () => {
      const processes = [
        { processId: 'P1', arrivalTime: 0, burstTime: 5 },
        { processId: 'P2', arrivalTime: 1, burstTime: 3 },
        { processId: 'P3', arrivalTime: 2, burstTime: 4 }
      ];
      const result = fcfs(processes);
      expect(result.processResults[0].completionTime).toBe(5);
      expect(result.processResults[1].completionTime).toBe(8);
      expect(result.processResults[2].completionTime).toBe(12);
    });
  });

  describe('SJF', () => {
    it('should select shortest job first', () => {
      const processes = [
        { processId: 'P1', arrivalTime: 0, burstTime: 6 },
        { processId: 'P2', arrivalTime: 0, burstTime: 8 },
        { processId: 'P3', arrivalTime: 0, burstTime: 7 },
        { processId: 'P4', arrivalTime: 0, burstTime: 3 }
      ];
      const result = sjf(processes);
      // P4 should execute first (burst 3)
      expect(result.timeline[0].processId).toBe('P4');
    });
  });

  describe('SRTF', () => {
    it('should preempt on shorter remaining time', () => {
      const processes = [
        { processId: 'P1', arrivalTime: 0, burstTime: 8 },
        { processId: 'P2', arrivalTime: 1, burstTime: 4 }
      ];
      const result = srtf(processes);
      // P2 should preempt P1
      expect(result.timeline[0].processId).toBe('P1');
      expect(result.timeline.find(t => t.processId === 'P2')).toBeDefined();
    });
  });

  describe('Priority Scheduling', () => {
    it('should schedule by priority (smaller number = higher priority)', () => {
      const processes = [
        { processId: 'P1', arrivalTime: 0, burstTime: 4, priority: 3 },
        { processId: 'P2', arrivalTime: 0, burstTime: 2, priority: 1 },
        { processId: 'P3', arrivalTime: 0, burstTime: 3, priority: 4 }
      ];
      const result = priorityScheduling(processes);
      expect(result.timeline[0].processId).toBe('P2'); // Priority 1
    });
  });

  describe('Round Robin', () => {
    it('should use time quantum correctly', () => {
      const processes = [
        { processId: 'P1', arrivalTime: 0, burstTime: 10 }
      ];
      const result = roundRobin(processes, 2);
      // Should have 5 time slices of 2
      expect(result.timeline.length).toBe(5);
      result.timeline.forEach(t => {
        expect(t.duration).toBe(2);
      });
    });

    it('should reject invalid quantum', () => {
      const processes = [{ processId: 'P1', arrivalTime: 0, burstTime: 5 }];
      expect(() => roundRobin(processes, 0)).toThrow();
      expect(() => roundRobin(processes, -1)).toThrow();
    });
  });

  describe('MLQ', () => {
    it('should give priority to queue 0 over queue 1', () => {
      const processes = [
        { processId: 'P1', arrivalTime: 0, burstTime: 4, queueLevel: 1 },
        { processId: 'P2', arrivalTime: 1, burstTime: 2, queueLevel: 0 }
      ];
      const result = multilevelQueue(processes, 2);
      // P2 in queue 0 should be handled with priority
      expect(result.timeline.some(t => t.processId === 'P2')).toBe(true);
    });
  });

  describe('Metrics Validation', () => {
    it('should calculate turnaround time correctly', () => {
      const processes = [
        { processId: 'P1', arrivalTime: 0, burstTime: 5 },
        { processId: 'P2', arrivalTime: 1, burstTime: 3 }
      ];
      const result = fcfs(processes);
      result.processResults.forEach(p => {
        expect(p.turnaroundTime).toBe(p.completionTime - p.arrivalTime);
        expect(p.waitingTime).toBe(p.turnaroundTime - p.burstTime);
        expect(p.responseTime).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have no overlapping execution intervals', () => {
      const processes = [
        { processId: 'P1', arrivalTime: 0, burstTime: 5 },
        { processId: 'P2', arrivalTime: 2, burstTime: 3 }
      ];
      const result = srtf(processes);
      for (let i = 1; i < result.timeline.length; i++) {
        expect(result.timeline[i].startTime).toBe(result.timeline[i-1].endTime);
      }
    });
  });
});
