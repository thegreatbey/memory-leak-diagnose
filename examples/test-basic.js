#!/usr/bin/env node

/**
 * Basic Test Script for memory-leak-diagnose
 * 
 * This script tests the basic functionality of the tool
 * by creating a simple memory pattern.
 */

const { MemoryMonitor } = require('../index.js');

console.log('🧪 Testing memory-leak-diagnose basic functionality...\n');

// Create a monitor with low threshold to trigger alerts
const monitor = new MemoryMonitor({
  interval: 500,  // Check every 500ms
  threshold: 50,  // 50MB threshold
  logFile: 'test-basic.log'
});

// Start monitoring
monitor.start();

// Create some memory usage patterns
let testData = [];

function createTestData() {
  // Add some data
  for (let i = 0; i < 1000; i++) {
    testData.push({
      id: i,
      data: new Array(100).fill('test-data-' + Date.now()),
      timestamp: Date.now()
    });
  }
  console.log(`📊 Added ${testData.length} objects (${testData.length * 100} total items)`);
}

function clearTestData() {
  testData = [];
  console.log('🗑️  Cleared test data');
}

// Test sequence
setTimeout(() => {
  console.log('\n📈 Phase 1: Creating memory usage...');
  createTestData();
}, 1000);

setTimeout(() => {
  console.log('\n📈 Phase 2: Adding more data...');
  createTestData();
  createTestData();
}, 3000);

setTimeout(() => {
  console.log('\n📈 Phase 3: Adding even more data...');
  createTestData();
  createTestData();
  createTestData();
}, 5000);

setTimeout(() => {
  console.log('\n🧹 Phase 4: Clearing data...');
  clearTestData();
}, 7000);

setTimeout(() => {
  console.log('\n📸 Phase 5: Capturing snapshot...');
  monitor.captureSnapshot();
}, 8000);

setTimeout(() => {
  console.log('\n✅ Test completed!');
  monitor.stop();
  process.exit(0);
}, 10000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  monitor.stop();
  process.exit(0);
}); 