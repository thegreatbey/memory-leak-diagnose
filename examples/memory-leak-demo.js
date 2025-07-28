#!/usr/bin/env node

/**
 * Memory Leak Demo Script
 * 
 * This script demonstrates various types of memory leaks
 * to test the memory-leak-diagnose tool.
 * 
 * Usage: node examples/memory-leak-demo.js
 */

console.log('🚀 Starting Memory Leak Demo...');
console.log('This script will create various memory leaks to test the monitoring tool.');
console.log('Run this in one terminal and memory-leak-diagnose in another.');
console.log('');

// Simulate different types of memory leaks
const leaks = {
  // Growing array that's never cleared
  growingArray: [],
  
  // Objects stored in a Map that grows indefinitely
  objectMap: new Map(),
  
  // Event listeners that are never removed
  eventListeners: [],
  
  // Timers that are never cleared
  timers: [],
  
  // Closures that capture large objects
  closures: []
};

let counter = 0;

// Function to create a memory leak by adding to arrays
function createArrayLeak() {
  const largeObject = {
    id: counter++,
    data: new Array(1000).fill('leak-data-' + Date.now()),
    timestamp: Date.now()
  };
  
  leaks.growingArray.push(largeObject);
  
  if (counter % 100 === 0) {
    console.log(`📈 Array leak: ${leaks.growingArray.length} objects added`);
  }
}

// Function to create a memory leak with Map
function createMapLeak() {
  const key = `key-${counter++}`;
  const value = {
    id: counter,
    buffer: Buffer.alloc(1024), // 1KB buffer
    timestamp: Date.now()
  };
  
  leaks.objectMap.set(key, value);
  
  if (counter % 50 === 0) {
    console.log(`🗺️  Map leak: ${leaks.objectMap.size} entries added`);
  }
}

// Function to create event listener leaks
function createEventListenerLeak() {
  const listener = () => {
    // This function captures the entire 'leaks' object
    console.log('Event fired, but listener is never removed');
  };
  
  leaks.eventListeners.push(listener);
  
  if (counter % 25 === 0) {
    console.log(`🎧 Event listener leak: ${leaks.eventListeners.length} listeners added`);
  }
}

// Function to create timer leaks
function createTimerLeak() {
  const timer = setInterval(() => {
    // This timer runs forever and captures variables
    const data = new Array(100).fill('timer-data');
  }, 1000);
  
  leaks.timers.push(timer);
  
  if (counter % 10 === 0) {
    console.log(`⏰ Timer leak: ${leaks.timers.length} timers created`);
  }
}

// Function to create closure leaks
function createClosureLeak() {
  const largeData = new Array(500).fill('closure-data-' + Date.now());
  
  const closure = () => {
    // This closure captures largeData, preventing garbage collection
    return largeData.length;
  };
  
  leaks.closures.push(closure);
  
  if (counter % 75 === 0) {
    console.log(`🔒 Closure leak: ${leaks.closures.length} closures created`);
  }
}

// Main leak creation loop
function createLeaks() {
  // Create different types of leaks at different intervals
  createArrayLeak();
  
  if (counter % 2 === 0) {
    createMapLeak();
  }
  
  if (counter % 3 === 0) {
    createEventListenerLeak();
  }
  
  if (counter % 5 === 0) {
    createTimerLeak();
  }
  
  if (counter % 4 === 0) {
    createClosureLeak();
  }
}

// Start the leak creation
const leakInterval = setInterval(createLeaks, 100);

// Provide cleanup function (but don't call it automatically)
function cleanup() {
  console.log('\n🧹 Cleaning up memory leaks...');
  
  clearInterval(leakInterval);
  
  // Clear all timers
  leaks.timers.forEach(timer => clearInterval(timer));
  leaks.timers.length = 0;
  
  // Clear arrays and maps
  leaks.growingArray.length = 0;
  leaks.objectMap.clear();
  leaks.eventListeners.length = 0;
  leaks.closures.length = 0;
  
  console.log('✅ Memory leaks cleaned up');
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  cleanup();
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  cleanup();
});

// Show instructions
console.log('💡 Instructions:');
console.log('1. Run this script: node examples/memory-leak-demo.js');
console.log('2. In another terminal, run: memory-leak-diagnose');
console.log('3. Watch the memory usage grow!');
console.log('4. Press Ctrl+C to stop and clean up');
console.log('');

console.log('🎯 Memory leak demo is running...');
console.log('The script will create various types of memory leaks:');
console.log('  • Growing arrays with large objects');
console.log('  • Maps with never-cleared entries');
console.log('  • Event listeners that are never removed');
console.log('  • Timers that run indefinitely');
console.log('  • Closures that capture large data');
console.log(''); 