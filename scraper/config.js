/**
 * Scraper Configuration
 * Konfigurasi untuk Instagram scraper
 */

require('dotenv').config();

module.exports = {
  // Target Instagram account
  target: {
    username: 'takkasteelofficial',
    url: 'https://www.instagram.com/takkasteelofficial/',
  },

  // Login credentials (dari environment variables untuk keamanan)
  // Buat file .env di root project dan isi:
  // IG_USERNAME=your_dummy_username
  // IG_PASSWORD=your_dummy_password
  credentials: {
    username: process.env.IG_USERNAME || '',
    password: process.env.IG_PASSWORD || '',
  },

  // Scraper settings
  settings: {
    maxPosts: 12,              // Jumlah postingan yang diambil
    headless: false,           // false = menampilkan browser (membantu menghindari deteksi bot)
    slowMo: 1000,              // Delay antar aksi (ms) - untuk menghindari deteksi bot
    timeout: 60000,            // Timeout per operasi (ms)
    downloadImages: true,      // Download gambar ke lokal
  },

  // Output paths
  paths: {
    dataDir: './data',
    imagesDir: './data/images',
    outputFile: './data/instagram_data.json',
  },
};
