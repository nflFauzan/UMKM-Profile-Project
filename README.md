# 🏗️ Takka Steel - Company Profile & Data Scraper

A modern, professional company profile website for **Takka Steel**, integrated with an automated data scraper to dynamically pull content from social media and marketplace platforms.

![Takka Steel Logo](https://raw.githubusercontent.com/nflFauzan/UMKM-Profile-Project/main/public/assets/logo.png) <!-- Replace with actual logo link if available -->

## 🌟 Features

- **Automated Data Scraper**: Pulls the latest business data from multiple sources:
  - **Instagram**: Bio, follower stats, and recent posts/captions.
  - **Tokopedia**: Product catalog, descriptions, and pricing.
  - **Google Images**: High-quality product visuals.
- **Dynamic Frontend**: A sleek, responsive company profile that renders scraped data in real-time.
- **Local Persistence**: Stores scraped data in JSON format and downloads images locally for better performance and reliability.
- **Modern UI/UX**: Designed with a focus on professional aesthetics and smooth user interactions.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **Scraper**: Playwright (Headless Browser Automation)
- **Data Management**: JSON-based flat-file storage

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.x or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nflFauzan/UMKM-Profile-Project.git
   cd UMKM-Profile-Project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your credentials (used for Instagram scraping):
   ```env
   IG_USERNAME=your_dummy_username
   IG_PASSWORD=your_dummy_password
   ```

### Running the Project

#### 1. Scrape Data
To update the website content with the latest data from social media and marketplaces:
```bash
npm run scrape
```

#### 2. Start the Web Server
To launch the company profile website locally:
```bash
npm run dev
```
The website will be available at `http://localhost:3000`.

## 📁 Project Structure

```text
UMKM-Profile-Project/
├── data/               # Scraped JSON data and downloaded images
├── public/             # Frontend assets (HTML, CSS, JS, Logos)
├── scraper/            # Playwright scraping logic
│   ├── index.js        # Main scraper execution
│   └── config.js       # Scraper targets and settings
├── server.js           # Express server configuration
├── .env                # Environment variables (private)
├── package.json        # Project dependencies and scripts
└── README.md           # Project documentation
```

## 📝 License

This project is licensed under the [ISC License](LICENSE).

---
*Built with ❤️ for Takka Steel.*