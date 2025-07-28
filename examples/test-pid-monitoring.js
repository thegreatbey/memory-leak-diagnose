#!/usr/bin/env node

/**
 * Test Script for PID Monitoring
 * 
 * This script demonstrates how to monitor an existing process by PID.
 * 
 * Usage: 
 * 1. Start this script: node examples/test-pid-monitoring.js
 * 2. In another terminal: memory-leak-diagnose --pid <PID>
 */

console.log('🧪 PID Monitoring Test Starting...');
console.log('This script will create memory usage patterns for testing PID monitoring.');
console.log('PID:', process.pid);
console.log('');

let testData = [];
let counter = 0;

// Create memory usage patterns
function createMemoryUsage() {
  // Add some data every second
  for (let i = 0; i < 50; i++) {
    testData.push({
      id: counter++,
      data: new Array(25).fill('test-data-' + Date.now()),
      timestamp: Date.now()
    });
  }
  
  const memory = process.memoryUsage();
  console.log(`📊 Memory usage: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB | Objects: ${testData.length}`);
}

// Create initial memory usage
createMemoryUsage();

// Continue adding memory every 3 seconds
const interval = setInterval(() => {
  createMemoryUsage();
  
  // Stop after 60 seconds or if memory gets too high
  if (counter > 500 || testData.length > 250) {
    console.log('🛑 Test completed - cleaning up...');
    clearInterval(interval);
    testData = [];
    process.exit(0);
  }
}, 3000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  clearInterval(interval);
  testData = [];
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  clearInterval(interval);
  testData = [];
  process.exit(0);
});

console.log('💡 This script will run for 60 seconds or until memory threshold is reached.');
console.log('Use this PID to test: memory-leak-diagnose --pid', process.pid);
console.log('Press Ctrl+C to stop early.');
console.log(''); 