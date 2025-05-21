# Stock CLI Tool

A command-line interface tool for stock buy/sell signals analysis.

## Description

This CLI application helps traders and investors analyze stock data, providing buy and sell signals based on technical indicators. It fetches real-time stock data and applies various technical analysis methods to generate actionable trading insights.

## Features

- Real-time stock data fetching using Yahoo Finance API
- Technical analysis with various indicators
- Buy/sell signal generation
- Command-line interface for easy interaction
- Email notifications for important signals
- Scheduled analysis with cron jobs

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd stock

# Install dependencies
npm install
```

## Usage

```bash
# Start the application
npm start

# Or run directly
node src/index.js
```

You can also use the provided scripts:

```bash
# Using the run script
./scripts/run.sh

# Build and run
./scripts/buildAndRun.sh
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# API Keys (if required)
API_KEY=your_api_key

# Email configuration (for notifications)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_TO=recipient@example.com
```

## Dependencies

- axios - HTTP client for API requests
- chalk - Terminal string styling
- cli-table - Pretty unicode tables for the console
- dotenv - Environment variable management
- figlet - ASCII art from text
- inquirer - Interactive command line interface
- node-cron - Task scheduler
- nodemailer - Send emails
- ora - Elegant terminal spinners
- technicalindicators - Technical analysis library
- yahoo-finance2 - Yahoo Finance API wrapper

## License

ISC
