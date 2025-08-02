# memory-leak-diagnose

![Logo](MLD_w_tagline.png)

> **Clarity. Fast.**
✅ Monitor Memory + Disk + CPU
✅ JSON output for CI/CD
✅ Works with child processes
✅ Lightweight (~200KB)

[![npm version](https://badge.fury.io/js/memory-leak-diagnose.svg)](https://badge.fury.io/js/memory-leak-diagnose)
[![npm downloads](https://img.shields.io/npm/dm/memory-leak-diagnose.svg)](https://www.npmjs.com/package/memory-leak-diagnose)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/thegreatbey/memory-leak-diagnose/actions/workflows/node-ci.yml/badge.svg)](https://github.com/thegreatbey/memory-leak-diagnose/actions)
[![Code Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://standardjs.com/)
[![npm install](https://img.shields.io/badge/npm%20install--g%20memory--leak--diagnose-blue.svg)](https://www.npmjs.com/package/memory-leak-diagnose)

A fast, lightweight CLI to monitor Node.js memory and disk usage in real time. Track leaks, set alerts, and integrate with CI — all with zero setup.

**Perfect for Node.js devs, CI/CD, Electron apps, and long-running scripts.**

## ✨ Why This Tool?

Unlike heavy profilers or outdated packages, this tool is fast, zero-dependency (except pidusage), and CI-ready. Get instant memory and disk insights without the complexity. Monitor both system resources in one lightweight tool.

✅ Again, Why memory-leak-diagnose?
Tired of bloated profilers or guessing why your app eats RAM?
memory-leak-diagnose gives you real-time Memory, Disk, and CPU stats in a tiny CLI tool.
Perfect for:

Debugging Node.js memory leaks

Electron app monitoring

CI/CD resource checks

Long-running scripts

## 🚀 Key Features

- ✅ **CPU usage monitoring** (NEW)
- ✅ **Monitor memory live** with alerts & thresholds
- ✅ **Disk usage monitoring** across all platforms (Windows, macOS, Linux)
- ✅ **Child process support** (node app.js, npm run dev)
- ✅ **CI-friendly** with JSON output & logs

## 📦 Quick Install

```bash
npm install -g memory-leak-diagnose
```

## 🎯 Quick Start

```bash
# Monitor your app (includes memory + disk)
memory-leak-diagnose node app.js

# Monitor with alerts
memory-leak-diagnose --threshold 200 --interval 500 npm run dev

# Monitor disk usage during large operations
memory-leak-diagnose --interval 2000 npm run build
```

![CLI Demo](cli-screenshot.png)

*Real-time monitoring with memory and disk usage tracking*

## 📖 Usage Examples

### Self-Monitoring (Default)
```bash
memory-leak-diagnose
```
Monitors the tool's own memory usage every second with a 100MB threshold.

### Child Process Monitoring
```bash
# Monitor a Node.js app
memory-leak-diagnose node index.js

# Monitor npm scripts
memory-leak-diagnose npm run dev
memory-leak-diagnose npm start

# Monitor other processes
memory-leak-diagnose python script.py
memory-leak-diagnose java -jar app.jar

# Monitor existing process by PID
memory-leak-diagnose --pid 12345

# Show live chart
memory-leak-diagnose --chart --interval 500 node server.js

# Monitor with disk usage (included by default)
memory-leak-diagnose --interval 2000 npm run build
```

### Advanced Configuration
```bash
# Custom interval and threshold
memory-leak-diagnose --interval 500 --threshold 200 node server.js

# JSON output for CI/CD
memory-leak-diagnose --json --threshold 300 npm test

# With logging
memory-leak-diagnose --log-file memory.log --interval 2000 node app.js

# Capture heap snapshot
memory-leak-diagnose --capture-snapshot --label "before-test" node test.js
```

### Package.json Integration
```json
{
  "scripts": {
    "dev": "memory-leak-diagnose npm run dev-server",
    "test:mem": "memory-leak-diagnose --json --threshold 200 npm test",
    "build:mem": "memory-leak-diagnose --log-file build-memory.log npm run build",
    "monitor": "memory-leak-diagnose --interval 1000 --threshold 150 npm start",
    "build:watch": "memory-leak-diagnose --interval 2000 --json npm run build"
  }
}
```

## 🎯 Real-World Use Cases

| Use Case | Command | Description |
|----------|---------|-------------|
| **CI Memory Regression** | `memory-leak-diagnose --json --threshold 300 npm test` | Alert if memory exceeds 300MB after commits |
| **Development Server** | `memory-leak-diagnose --threshold 150 npm run dev` | Monitor memory during development |
| **Electron Apps** | `memory-leak-diagnose --log-file electron.log npm run electron` | Track memory during window lifecycle |
| **Long-running Scripts** | `memory-leak-diagnose --threshold 500 --interval 10000 node worker.js` | Detect gradual memory leaks |
| **Library Debugging** | `memory-leak-diagnose --capture-snapshot --label "before" node test.js` | Compare before/after memory usage |
| **Existing Process** | `memory-leak-diagnose --pid 12345` | Monitor already running process |
| **Disk Space Monitoring** | `memory-leak-diagnose --json --interval 5000 npm run build` | Track disk usage during large builds |
| **System Health Check** | `memory-leak-diagnose --chart --interval 1000` | Monitor both memory and disk in real-time |

## 📋 Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--help` | `-h` | Show help message | - |
| `--interval` | `-i` | Monitoring interval in milliseconds | 1000 |
| `--threshold` | `-t` | Memory threshold in megabytes | 100 |
| `--log-file` | `-l` | File path to write logs | - |
| `--json` | `-j` | Output structured JSON | false |
| `--capture-snapshot` | `-s` | Capture heap snapshot | false |
| `--label` | - | Label for snapshot | - |
| `--pid` | - | Monitor existing process by PID | - |
| `--chart` | `-c` | Show ASCII live chart of memory usage | false |

## 📊 Output Examples

## CLI Example Output
```
Memory: HeapUsed: 120 MB | RSS: 310 MB
CPU:    8.3%
Disk:   Free: 72 GB / 256 GB (28%)
```

## JSON Output Example
```
"cpu": {
  "percent": 8.3
}
```

### Standard CLI Output (Self-Monitoring)
```
Memory Usage: | Process: Self | Heap Used: 45.2 MB | Heap Total: 67.8 MB | RSS: 89.1 MB | Threshold: 100 MB | Breaches: 0 | Status: ✅ Normal | Disk: 721.0 GB free / 913.0 GB (21.0%)
```

### Standard CLI Output (Child Process)
```
Memory Usage: | Process: PID:12345 | Heap Used: 156.7 MB | Heap Total: 189.2 MB | RSS: 234.5 MB | Threshold: 100 MB | Breaches: 3 | Status: ⚠️  THRESHOLD BREACH | Disk: 721.0 GB free / 913.0 GB (21.0%)
```

### JSON Output
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "pid": 12345,
  "heapUsed": 47382528,
  "heapTotal": 71065600,
  "rss": 93450240,
  "external": 1234567,
  "arrayBuffers": 0,
  "disk": {
    "total": 980356689920,
    "used": 206137708544,
    "free": 774218981376
  },
  "threshold": 104857600,
  "breachCount": 0,
  "isBreach": false,
  "monitoringChild": true,
  "formatted": {
    "heapUsed": "45.2 MB",
    "heapTotal": "67.8 MB",
    "rss": "89.1 MB",
    "threshold": "100 MB"
  }
}
```

## 🔧 Advanced Features

### Manual Snapshot Capture
While monitoring is running, capture snapshots using signals:
```bash
# In another terminal
kill -USR2 <process_id>
```

### Programmatic Usage
```javascript
const { MemoryMonitor } = require('memory-leak-diagnose');

const monitor = new MemoryMonitor({
  interval: 1000,
  threshold: 100,
  logFile: 'app-memory.log',
  command: 'node',
  commandArgs: ['server.js']
});

monitor.start();

// Stop monitoring when done
monitor.stop();
```

## 📚 Memory Metrics Explained

- **heapUsed**: Memory actually used by JavaScript objects
- **heapTotal**: Total size of the V8 heap
- **RSS (Resident Set Size)**: Total memory allocated to the process
- **external**: Memory used by C++ objects bound to JavaScript objects
- **arrayBuffers**: Memory allocated for ArrayBuffers and SharedArrayBuffers

**Note**: When monitoring child processes, only RSS memory is available via `pidusage`. Heap metrics are not available for non-Node.js processes.

## 🗂️ Disk Monitoring

The tool now includes cross-platform disk usage monitoring:

- **Windows**: Uses `wmic logicaldisk` to get C: drive information
- **macOS/Linux**: Uses `df -k /` to get root filesystem information
- **Automatic fallback**: Continues monitoring even if disk check fails
- **JSON integration**: Disk data included in structured output

### Disk Metrics
- **total**: Total disk space in bytes
- **used**: Used disk space in bytes  
- **free**: Available disk space in bytes

## 🗺️ Roadmap

### Upcoming Features
- 🔄 **Advanced disk monitoring**: Per-partition monitoring, disk I/O metrics
- 📊 **Network monitoring**: Bandwidth usage, connection tracking
- 🎯 **Custom thresholds**: Disk space alerts, network bandwidth limits
- 📈 **Historical data**: Trend analysis, memory/disk usage patterns
- 🔌 **Plugin system**: Extensible monitoring capabilities
- 🌐 **Web dashboard**: Real-time monitoring interface

### Future Enhancements
- **CPU monitoring**: Process CPU usage and system load
- **Process tree**: Monitor parent-child process relationships
- **Resource profiling**: Detailed resource usage breakdown
- **Alert integrations**: Slack, Discord, email notifications
- **Export formats**: CSV, Prometheus metrics, Grafana dashboards

## 🛠️ Installation & Development

### Global Installation
```bash
npm install -g memory-leak-diagnose
```

### Local Development
```bash
git clone https://github.com/thegreatbey/memory-leak-diagnose.git
cd memory-leak-diagnose
npm install
npm link  # Makes the command available globally
```

### Testing
```bash
# Test self-monitoring
memory-leak-diagnose

# Test child process monitoring
memory-leak-diagnose node examples/test-child-process.js

# Test with memory leak demo
memory-leak-diagnose node examples/memory-leak-demo.js
```

## 🔍 Troubleshooting

### Permission Issues (Windows)
```bash
# Run PowerShell as Administrator
Set-ExecutionPolicy RemoteSigned
```

### Child Process Issues
```bash
# Check if the command exists
which node
which npm

# Try with explicit path
memory-leak-diagnose /usr/bin/node index.js
```

### Large Log Files
```bash
# Use logrotate or similar tools
memory-leak-diagnose --log-file memory-$(date +%Y%m%d).log node app.js
```

### Disk Monitoring Issues
```bash
# Check disk permissions (Windows)
# Run as Administrator if needed

# Check disk space manually
df -h /  # Linux/macOS
wmic logicaldisk get size,freespace,caption  # Windows
```

## 🤝 Contributing

**Pull requests are welcome!** We love contributions from the community.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🙏 Acknowledgments

- Built with ❤️ for the Node.js community
- Inspired by the need for simple, effective memory monitoring tools
- Uses [pidusage](https://github.com/soyuka/pidusage) for cross-platform process monitoring

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/thegreatbey/memory-leak-diagnose/issues)
- **Discussions**: [GitHub Discussions](https://github.com/thegreatbey/memory-leak-diagnose/discussions)
- **Documentation**: Check this README and inline code comments
- **Examples**: See the `examples/` directory for more use cases

---

**Made with ❤️ by the Node.js community**

[![npm](https://img.shields.io/npm/v/memory-leak-diagnose.svg)](https://www.npmjs.com/package/memory-leak-diagnose)
[![npm](https://img.shields.io/npm/dt/memory-leak-diagnose.svg)](https://www.npmjs.com/package/memory-leak-diagnose)
[![GitHub stars](https://img.shields.io/github/stars/thegreatbey/memory-leak-diagnose.svg)](https://github.com/thegreatbey/memory-leak-diagnose/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/thegreatbey/memory-leak-diagnose.svg)](https://github.com/thegreatbey/memory-leak-diagnose/network) 