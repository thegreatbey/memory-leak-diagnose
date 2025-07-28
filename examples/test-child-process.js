#!/usr/bin/env node

/**
 * Test Script for Child Process Monitoring
 * 
 * This script creates memory usage patterns to test
 * the child process monitoring functionality.
 * 
 * Usage: memory-leak-diagnose node examples/test-child-process.js
 */

console.log('🧪 Child Process Memory Test Starting...');
console.log('This script will create memory usage patterns for testing.');
console.log('');

let testData = [];
let counter = 0;

// Create memory usage patterns
function createMemoryUsage() {
  // Add some data every second
  for (let i = 0; i < 100; i++) {
    testData.push({
      id: counter++,
      data: new Array(50).fill('test-data-' + Date.now()),
      timestamp: Date.now()
    });
  }
  
  const memory = process.memoryUsage();
  console.log(`📊 Memory usage: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB | Objects: ${testData.length}`);
}

// Create initial memory usage
createMemoryUsage();

// Continue adding memory every 2 seconds
const interval = setInterval(() => {
  createMemoryUsage();
  
  // Stop after 30 seconds or if memory gets too high
  if (counter > 1000 || testData.length > 500) {
    console.log('🛑 Test completed - cleaning up...');
    clearInterval(interval);
    testData = [];
    process.exit(0);
  }
}, 2000);

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

console.log('💡 This script will run for 30 seconds or until memory threshold is reached.');
console.log('Press Ctrl+C to stop early.');
console.log(''); 