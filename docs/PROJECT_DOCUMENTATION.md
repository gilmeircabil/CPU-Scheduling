# CPU Scheduling Algorithm Simulator - Project Documentation

## Cover Page

**Project Title:** CPU Scheduling Algorithm Simulator  
**Subject:** PT101 – Platform Technology  
**Institution:** Ramon Magsaysay Memorial College  
**Academic Year:** First Semester, AY 2026–2027  
**Project Type:** Full-stack web application (MERN Stack)  

## Table of Contents

1. [Introduction](#introduction)
2. [Background of CPU Scheduling](#background)
3. [Project Objectives](#objectives)
4. [Technologies Used](#technologies)
5. [System Requirements](#requirements)
6. [System Architecture](#architecture)
7. [System Features](#features)
8. [CPU Scheduling Algorithms](#algorithms)
9. [Scheduling Formulas](#formulas)
10. [Database Design](#database)
11. [API Overview](#api)
12. [Testing](#testing)
13. [Conclusion](#conclusion)

## 1. Introduction

The CPU Scheduling Algorithm Simulator is an educational web-based application designed to help students understand and visualize how different CPU scheduling algorithms work in operating systems. It provides an interactive platform to input processes, simulate execution, and analyze performance metrics.

## 2. Background of CPU Scheduling

CPU scheduling is the process of determining which process in the ready queue will be allocated the CPU for execution. The goal is to maximize CPU utilization, throughput, and minimize waiting time, turnaround time, and response time.

## 3. Project Objectives

- Explain how CPU scheduling works in an operating system
- Implement all 7 major CPU scheduling algorithms
- Generate accurate Gantt charts
- Calculate all scheduling metrics
- Provide algorithm comparison functionality
- Save simulation history
- Create an educational, user-friendly interface

## 4. Technologies Used

- **MongoDB** - NoSQL database for persistence
- **Express.js** - Web application framework
- **React** - Frontend library
- **Node.js** - JavaScript runtime
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Charting library
- **Vite** - Build tool
- **Lucide React** - Icon library

## 5. System Requirements

**Hardware:**
- Minimum 4GB RAM
- Any modern processor

**Software:**
- Node.js v16+
- MongoDB v4.4+
- Modern web browser

## 6. System Architecture

The application follows a 3-tier architecture:
- **Presentation Layer**: React frontend
- **Application Layer**: Express.js backend with REST API
- **Data Layer**: MongoDB database

## 7. System Features

- Process Management
- Algorithm Simulation
- Gantt Chart Visualization
- Performance Metrics Calculation
- Algorithm Comparison
- Simulation History
- Educational Guide
- Responsive Design

## 8. CPU Scheduling Algorithms

All 7 algorithms are implemented as specified with correct preemption/non-preemption behavior.

## 9. Scheduling Formulas

- **Turnaround Time (TAT)** = Completion Time (CT) - Arrival Time (AT)
- **Waiting Time (WT)** = Turnaround Time (TAT) - Burst Time (BT)
- **Response Time (RT)** = First CPU Start Time - Arrival Time (AT)
- **CPU Utilization** = (Total Busy Time / Total Elapsed Time) × 100

## 10. Database Design

Two main collections: ProcessDataset and Simulation (see models in server/src/models/)

## 11. API Overview

RESTful API with endpoints for health, simulations (run, compare), and history.

## 12. Testing

Automated unit tests using Vitest covering all algorithms and edge cases.

## 13. Conclusion

This simulator provides a comprehensive educational platform for understanding CPU scheduling concepts with accurate implementations and visualizations.
