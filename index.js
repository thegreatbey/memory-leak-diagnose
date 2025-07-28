#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const pidusage = require('pidusage');

// ANSI color codes for clean CLI output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Utility functions
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (date) => {
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

function checkDiskUsage(callback) {
  const platform = process.platform;

  if (platform === 'darwin' || platform === 'linux') {
    // Use df -k to get disk statistics for the root filesystem
    exec('df -k /', (err, stdout) => {
      if (err) return callback(err);
      const lines = stdout.trim().split('\n');
      const parts = lines[lines.length - 1].split(/\s+/);
      // df returns blocks of 1K, convert to bytes
      const total = parseInt(parts[1], 10) * 1024;
      const used = parseInt(parts[2], 10) * 1024;
      const free = parseInt(parts[3], 10) * 1024;
      callback(null, { drive: '/', total, used, free });
    });
  } else if (platform === 'win32') {
    // WMIC gives FreeSpace and Size in bytes already
    exec('wmic logicaldisk get size,freespace,caption', (err, stdout) => {
      if (err) return callback(err);
      // Find the line for the system drive (usually C:) first, else take first line
      const lines = stdout.trim().split('\n').slice(1).filter(Boolean);
      // Normalize spacing then split
      const parsed = lines.map(l => l.trim().split(/\s+/));
      const target = parsed.find(arr => /c:/i.test(arr[0])) || parsed[0];
      if (!target || target.length < 3) return callback(new Error('Unable to parse WMIC output'));
      const drive = target[0].toUpperCase();
      const free = parseInt(target[1], 10);
      const total = parseInt(target[2], 10);
      const used = total - free;
      callback(null, { drive, total, used, free });
    });
  } else {
    callback(new Error(`Unsupported platform: ${platform}`));
  }
}

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    interval: 1000,
    threshold: 100,
    logFile: null,
    json: false,
    captureSnapshot: false,
    snapshotLabel: null,
    help: false,
    command: null,
    commandArgs: [],
    pid: null,
    chart: false
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--interval':
      case '-i':
        options.interval = parseInt(args[++i]) || 1000;
        break;
      case '--threshold':
      case '-t':
        options.threshold = parseInt(args[++i]) || 100;
        break;
      case '--log-file':
      case '-l':
        options.logFile = args[++i];
        break;
      case '--json':
      case '-j':
        options.json = true;
        break;
      case '--capture-snapshot':
      case '-s':
        options.captureSnapshot = true;
        break;
      case '--label':
        options.snapshotLabel = args[++i];
        break;
      case '--pid':
        options.pid = parseInt(args[++i]);
        if (isNaN(options.pid)) {
          console.error(`${colors.red}Error: Invalid PID provided${colors.reset}`);
          process.exit(1);
        }
        break;
      case '--chart':
      case '-c':
        options.chart = true;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`${colors.red}Error: Unknown option ${arg}${colors.reset}`);
          process.exit(1);
        } else {
          // First non-flag argument is the command
          if (!options.command) {
            options.command = arg;
          } else {
            // Remaining arguments are command args
            options.commandArgs = args.slice(i);
            break;
          }
        }
    }
    i++;
  }

  return options;
};

// Display help information
const showHelp = () => {
  console.log(`
${colors.bright}memory-leak-diagnose${colors.reset} - A lightweight CLI tool to monitor Node.js memory usage

${colors.cyan}Usage:${colors.reset}
  memory-leak-diagnose [options] [command]
  memory-leak-diagnose [options] -- [command args...]

${colors.cyan}Options:${colors.reset}
  -h, --help                    Show this help message
  -i, --interval <ms>           Monitoring interval in milliseconds (default: 1000)
  -t, --threshold <mb>          Memory threshold in megabytes (default: 100)
  -l, --log-file <path>         Optional file path to write logs
  -j, --json                    Output structured JSON (for CI/devops)
  -s, --capture-snapshot        Capture heap snapshot for analysis
  --label <text>                Label for snapshot (use with --capture-snapshot)
  --pid <number>                Monitor existing process by PID
  -c, --chart                   Show ASCII live chart of memory usage

${colors.cyan}Examples:${colors.reset}
  memory-leak-diagnose                                    # Monitor this tool's memory
  memory-leak-diagnose node index.js                      # Monitor a Node.js app
  memory-leak-diagnose npm run dev                        # Monitor npm script
  memory-leak-diagnose --pid 12345                        # Monitor existing process by PID
  memory-leak-diagnose --chart --interval 500 node server.js  # Show live chart
  memory-leak-diagnose --interval 500 --threshold 200 node server.js
  memory-leak-diagnose --json --log-file memory.log npm start
  memory-leak-diagnose --capture-snapshot --label "before-test" node test.js

${colors.cyan}Use Cases:${colors.reset}
  • CI memory regression checks: Alert if memory exceeds 300MB after recent commits
  • Electron apps: Monitor heapUsed when opening/closing windows
  • Long-running scripts: Detect slow memory creep over hours
  • Library debugging: Find if your npm package is leaking memory
  • Development servers: Monitor memory usage during development
`);
};

// Memory monitoring class
class MemoryMonitor {
  constructor(options) {
    this.options = options;
    this.thresholdBytes = options.threshold * 1024 * 1024;
    this.breachCount = 0;
    this.startTime = new Date();
    this.isRunning = false;
    this.intervalId = null;
    this.logStream = null;
    this.childProcess = null;
    this.monitoringChild = false;
    this.monitoringPid = false;
    this.chartData = [];
    this.maxChartPoints = 50; // Keep last 50 data points for chart
    
    if (options.logFile) {
      this.logStream = fs.createWriteStream(options.logFile, { flags: 'a' });
    }
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    if (this.options.pid) {
      await this.validatePid();
    } else if (this.options.command) {
      await this.spawnChildProcess();
    }
    
    this.log('info', `Memory monitoring started at ${formatTime(this.startTime)}`);
    this.log('info', `Threshold: ${formatBytes(this.thresholdBytes)}`);
    this.log('info', `Interval: ${this.options.interval}ms`);
    if (this.monitoringPid) {
      this.log('info', `Monitoring existing process PID: ${this.options.pid}`);
    } else if (this.monitoringChild) {
      this.log('info', `Monitoring child process: ${this.options.command} ${this.options.commandArgs.join(' ')}`);
    } else {
      this.log('info', 'Monitoring self (no command provided)');
    }
    
    this.intervalId = setInterval(() => {
      this.checkMemory();
    }, this.options.interval);
  }

  async validatePid() {
    try {
      // Check if the process exists by trying to get its stats
      await pidusage(this.options.pid);
      this.monitoringPid = true;
    } catch (error) {
      this.log('error', `Process with PID ${this.options.pid} not found: ${error.message}`);
      console.error(`${colors.red}Process with PID ${this.options.pid} not found: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }

  async spawnChildProcess() {
    try {
      this.childProcess = spawn(this.options.command, this.options.commandArgs, {
        stdio: 'inherit',
        shell: true
      });
      
      this.monitoringChild = true;
      
      // Handle child process events
      this.childProcess.on('error', (error) => {
        this.log('error', `Child process error: ${error.message}`);
        console.error(`${colors.red}Child process error: ${error.message}${colors.reset}`);
        this.stop();
      });
      
      this.childProcess.on('exit', (code, signal) => {
        const exitInfo = signal ? `signal ${signal}` : `code ${code}`;
        this.log('info', `Child process exited with ${exitInfo}`);
        console.log(`\n${colors.yellow}Child process exited with ${exitInfo}${colors.reset}`);
        this.stop();
      });
      
      // Wait a moment for the process to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      this.log('error', `Failed to spawn child process: ${error.message}`);
      console.error(`${colors.red}Failed to spawn child process: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.childProcess && !this.childProcess.killed) {
      this.childProcess.kill('SIGTERM');
    }
    
    const endTime = new Date();
    const duration = Math.round((endTime - this.startTime) / 1000);
    this.log('info', `Monitoring stopped after ${duration}s`);
    
    if (this.logStream) {
      this.logStream.end();
    }
  }

  async checkMemory() {
    try {
      let memory;
      let pid = process.pid;
      let cpuPercent = 0;

      if (this.monitoringPid) {
        // Monitor existing external PID via pidusage
        const stats = await pidusage(this.options.pid);
        memory = {
          heapUsed: stats.memory || 0,
          heapTotal: stats.memory || 0,
          rss: stats.memory || 0,
          external: 0,
          arrayBuffers: 0
        };
        cpuPercent = stats.cpu || 0;
        pid = this.options.pid;
      } else if (this.monitoringChild && this.childProcess && !this.childProcess.killed) {
        // Monitor child process via pidusage
        const stats = await pidusage(this.childProcess.pid);
        memory = {
          heapUsed: stats.memory || 0,
          heapTotal: stats.memory || 0,
          rss: stats.memory || 0,
          external: 0,
          arrayBuffers: 0
        };
        cpuPercent = stats.cpu || 0;
        pid = this.childProcess.pid;
      } else {
        // Monitor self – use process.memoryUsage for detailed heap metrics + pidusage for CPU
        memory = process.memoryUsage();
        const stats = await pidusage(process.pid);
        cpuPercent = stats.cpu || 0;
      }

      const timestamp = new Date();

      const data = {
        timestamp: timestamp.toISOString(),
        pid: pid,
        memory: {
          heapUsed: memory.heapUsed,
          heapTotal: memory.heapTotal,
          rss: memory.rss,
          external: memory.external,
          arrayBuffers: memory.arrayBuffers
        },
        cpu: {
          percent: parseFloat(cpuPercent.toFixed(2))
        }
      };

      const isBreach = memory.heapUsed > this.thresholdBytes;
      if (isBreach) {
        this.breachCount++;
      }

      // Add to chart data if chart is enabled
      if (this.options.chart) {
        this.chartData.push({
          time: Date.now(),
          heapUsed: memory.heapUsed,
          rss: memory.rss
        });
        
        // Keep only the last maxChartPoints
        if (this.chartData.length > this.maxChartPoints) {
          this.chartData.shift();
        }
      }

      // Check disk usage
      checkDiskUsage((err, disk) => {
        if (err) {
          this.log('error', `Disk check failed: ${err.message}`);
          // Continue without disk data
          this.log('data', data);
          this.display(data, isBreach);
          return;
        }
        
        // Add disk data to the data object
        data.disk = disk;
        
        this.log('data', data);
        this.display(data, isBreach);
      });
      
    } catch (error) {
      this.log('error', `Error checking memory: ${error.message}`);
      console.error(`${colors.red}Error checking memory: ${error.message}${colors.reset}`);
    }
  }

  renderChart() {
    if (!this.options.chart || this.chartData.length < 2) return '';
    
    const chartHeight = 8;
    const chartWidth = 50;
    const thresholdMB = this.thresholdBytes / (1024 * 1024);
    
    // Find min/max values for scaling
    const heapValues = this.chartData.map(d => d.heapUsed / (1024 * 1024));
    const rssValues = this.chartData.map(d => d.rss / (1024 * 1024));
    const maxHeap = Math.max(...heapValues, thresholdMB);
    const maxRss = Math.max(...rssValues, thresholdMB);
    const maxValue = Math.max(maxHeap, maxRss);
    
    let chart = '\n';
    chart += `${colors.cyan}Memory Chart (${chartWidth}s window)${colors.reset}\n`;
    
    // Render chart lines
    for (let i = chartHeight - 1; i >= 0; i--) {
      const level = (maxValue * i) / chartHeight;
      const thresholdLevel = (thresholdMB * chartHeight) / maxValue;
      
      let line = `${level.toFixed(0).padStart(3)}MB `;
      
      for (let j = 0; j < this.chartData.length; j++) {
        const heapLevel = (heapValues[j] * chartHeight) / maxValue;
        const rssLevel = (rssValues[j] * chartHeight) / maxValue;
        
        if (i === Math.floor(thresholdLevel)) {
          line += colors.yellow + '─' + colors.reset; // Threshold line
        } else if (i <= Math.floor(heapLevel) && i <= Math.floor(rssLevel)) {
          line += colors.red + '█' + colors.reset; // Both heap and RSS
        } else if (i <= Math.floor(heapLevel)) {
          line += colors.green + '█' + colors.reset; // Heap only
        } else if (i <= Math.floor(rssLevel)) {
          line += colors.blue + '█' + colors.reset; // RSS only
        } else {
          line += ' '; // Empty
        }
      }
      
      chart += line + '\n';
    }
    
    // Add legend
    chart += `${colors.gray}     ${colors.green}█${colors.reset} Heap  ${colors.blue}█${colors.reset} RSS  ${colors.red}█${colors.reset} Both  ${colors.yellow}─${colors.reset} Threshold\n`;
    
    return chart;
  }

  display(data, isBreach) {
    if (this.options.json) {
      const jsonOutput = {
        timestamp: data.timestamp,
        memory: data.memory,
        cpu: data.cpu,
        disk: data.disk,
        threshold: this.thresholdBytes,
        breachCount: this.breachCount,
        isBreach,
        monitoringChild: this.monitoringChild,
        monitoringPid: this.monitoringPid,
        formatted: {
          heapUsed: formatBytes(data.memory.heapUsed),
          heapTotal: formatBytes(data.memory.heapTotal),
          rss: formatBytes(data.memory.rss),
          threshold: formatBytes(this.thresholdBytes)
        }
      };
      console.log(JSON.stringify(jsonOutput));
      return;
    }

    // Compute how many lines we printed last time to clear them (3 status lines + optional chart lines)
    const baseLines = 3;
    const chartLines = this.options.chart ? 11 : 0; // renderChart() always prints 11 lines when chart enabled
    const clearLines = '\r\x1b[K' + '\x1b[1A'.repeat(baseLines + chartLines);
    process.stdout.write(clearLines);

    // Prepare formatted strings
    const heapUsedColor = isBreach ? colors.red : colors.green;
    const status = isBreach ? '⚠️  THRESHOLD BREACH' : '✅ Normal';
    const statusColor = isBreach ? colors.red : colors.green;

    let processInfo = 'Self';
    if (this.monitoringPid) {
      processInfo = `PID:${data.pid}`;
    } else if (this.monitoringChild) {
      processInfo = `PID:${data.pid}`;
    }

    // Disk formatting (might be undefined)
    let diskLine = `${colors.gray}Disk:${colors.reset} N/A`;
    if (data.disk) {
      const driveLabel = data.disk.drive || '/';
      const freeGB = (data.disk.free / (1024 ** 3)).toFixed(1);
      const totalGB = (data.disk.total / (1024 ** 3)).toFixed(1);
      const usagePercent = ((data.disk.used / data.disk.total) * 100).toFixed(1);
      diskLine = `${colors.gray}Disk:${colors.reset} Free: ${colors.cyan}${freeGB} GB${colors.reset} / ${totalGB} GB (${usagePercent}%) | Drive: ${driveLabel}`;
    }

    // Compose lines
    const memoryLine = `${colors.cyan}Memory:${colors.reset} HeapUsed: ${heapUsedColor}${formatBytes(data.memory.heapUsed)}${colors.reset} | RSS: ${colors.magenta}${formatBytes(data.memory.rss)}${colors.reset} | ${colors.gray}Process:${colors.reset} ${colors.magenta}${processInfo}${colors.reset} | ${colors.gray}Threshold:${colors.reset} ${colors.yellow}${formatBytes(this.thresholdBytes)}${colors.reset} | ${colors.gray}Breaches:${colors.reset} ${colors.cyan}${this.breachCount}${colors.reset} | ${colors.gray}Status:${colors.reset} ${statusColor}${status}${colors.reset}`;
    const cpuLine = `${colors.gray}CPU:${colors.reset} ${colors.yellow}${data.cpu.percent.toFixed(2)}%${colors.reset}`;

    process.stdout.write(`${memoryLine}\n${cpuLine}\n${diskLine}`);

    // Add chart if enabled
    if (this.options.chart) {
      process.stdout.write(this.renderChart());
    }
  }

  log(level, message) {
    const timestamp = formatTime(new Date());
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${typeof message === 'object' ? JSON.stringify(message) : message}\n`;
    
    if (this.logStream) {
      this.logStream.write(logEntry);
    }
    
    if (level === 'error') {
      console.error(`${colors.red}${logEntry.trim()}${colors.reset}`);
    }
  }

  captureSnapshot() {
    if (!this.options.captureSnapshot) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const label = this.options.snapshotLabel ? `-${this.options.snapshotLabel}` : '';
    const filename = `heap-snapshot-${timestamp}${label}.json`;
    
    // Always capture the monitoring tool's memory for snapshots
    const memory = process.memoryUsage();
    const snapshot = {
      timestamp: new Date().toISOString(),
      label: this.options.snapshotLabel || 'manual-capture',
      memory: memory,
      formatted: {
        heapUsed: formatBytes(memory.heapUsed),
        heapTotal: formatBytes(memory.heapTotal),
        rss: formatBytes(memory.rss),
        external: formatBytes(memory.external),
        arrayBuffers: formatBytes(memory.arrayBuffers)
      },
      session: {
        startTime: this.startTime.toISOString(),
        breachCount: this.breachCount,
        threshold: this.thresholdBytes,
        monitoringChild: this.monitoringChild,
        monitoringPid: this.monitoringPid,
        childCommand: this.options.command,
        targetPid: this.options.pid
      }
    };
    
    try {
      fs.writeFileSync(filename, JSON.stringify(snapshot, null, 2));
      this.log('info', `Heap snapshot saved to ${filename}`);
      console.log(`${colors.green}✓ Heap snapshot saved to ${filename}${colors.reset}`);
    } catch (error) {
      this.log('error', `Failed to save snapshot: ${error.message}`);
      console.error(`${colors.red}✗ Failed to save snapshot: ${error.message}${colors.reset}`);
    }
  }
}

// Main execution
const main = async () => {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }

  // Handle snapshot capture without monitoring
  if (options.captureSnapshot && !options.interval) {
    const monitor = new MemoryMonitor(options);
    monitor.captureSnapshot();
    return;
  }

  const monitor = new MemoryMonitor(options);
  
  // Handle graceful shutdown
  const cleanup = () => {
    console.log('\n'); // New line after the status display
    monitor.stop();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('SIGUSR2', () => {
    // Allow manual snapshot capture via SIGUSR2
    monitor.captureSnapshot();
  });

  // Start monitoring
  await monitor.start();
  
  // If snapshot capture is requested, do it after a short delay
  if (options.captureSnapshot) {
    setTimeout(() => {
      monitor.captureSnapshot();
    }, 2000);
  }
};

// Run the tool
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { MemoryMonitor, formatBytes, formatTime }; 