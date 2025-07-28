# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release with core memory monitoring features
- Child process monitoring support
- Real-time CLI output with colored status indicators
- JSON output for CI/CD integration
- Logging support with file output
- Heap snapshot capture functionality
- Graceful shutdown handling
- Comprehensive CLI argument parsing
- Cross-platform support (Windows, macOS, Linux)

### Features
- **Self-monitoring**: Monitor the tool's own memory usage
- **Child process monitoring**: Spawn and monitor any command
- **Customizable thresholds**: Set memory limits in megabytes
- **Real-time alerts**: Visual indicators for threshold breaches
- **Process identification**: Display PID for child processes
- **Snapshot labeling**: Custom labels for heap snapshots
- **Signal handling**: Manual snapshot capture via SIGUSR2

### Technical
- Zero dependencies for core functionality
- Minimal dependency footprint (only pidusage for child process monitoring)
- Efficient memory monitoring using Node.js built-ins
- Stream-based logging for large datasets
- Professional CLI output similar to pnpm/eslint

## [1.0.0] - 2024-01-15

### Added
- Initial release of memory-leak-diagnose CLI tool
- Core memory monitoring functionality
- Child process spawning and monitoring
- Real-time CLI output with ANSI colors
- JSON output format for automation
- File logging capabilities
- Heap snapshot capture
- Comprehensive help system
- Cross-platform compatibility
- Example scripts for testing

### Dependencies
- pidusage@^4.0.1 for child process monitoring 