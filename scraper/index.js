/**
 * Takka Steel - Company Profile Data Scraper
 * 
 * Menggunakan Playwright untuk scraping data dari berbagai sumber publik:
 * - Google Search (untuk caption/postingan Instagram yang terindeks)
 * - Tokopedia (untuk katalog produk + harga)
 * - Instagram profil (untuk bio, stats, dan foto profil)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const config = require('./config');

// ============================================================
// Utility Functions
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function log(message, type = 'INFO') {
  const timestamp = new Date().toLocaleTimeString('id-ID');
  const icons = { INFO: 'ℹ️', SUCCESS: '✅', WARN: '⚠️', ERROR: '❌', STEP: '🔄' };
  console.log(`[${timestamp}] ${icons[type] || '•'} ${message}`);
}

// ============================================================
// Main Scraper
// ============================================================

class TakkaSteelScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.data = {
      scraped_at: null,
      profile: {
        username: 'takkasteelofficial',
        full_name: 'Takka Steel Bogor',
        bio: 'Pusat Baja dan Bahan Bangunan Bogor. Menyediakan beragam jenis besi, baja, atap, dll.',
        tagline: 'WE ARE HERE! TAKKA STEEL – PUSAT BAJA & BAHAN BANGUNAN',
        stats: { posts: 67, followers: 32, following: 2 },
        profile_pic_url: '',
        profile_pic_local: '',
        external_url: '',
        contact: {
          phone: '0895-1861-1616',
          whatsapp: '62895186116116',
        },
        locations: [
          {
            name: 'Takka Steel 1',
            address: 'Jl. Lkr. Laladon, Ciherang, Kec. Dramaga, Kabupaten Bogor, Jawa Barat',
          },
          {
            name: 'Takka Steel 2',
            address: 'Jalan Lingkar Luar Laladon No. 51, RT.1/RW.7, Ciherang, Ciomas, Kabupaten Bogor',
          },
        ],
      },
      products: [],
      posts: [],
    };
  }

  async init() {
    log('Membuka browser Chromium...', 'STEP');
    this.browser = await chromium.launch({
      headless: config.settings.headless,
      slowMo: 300,
    });
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      locale: 'id-ID',
    });
    this.page = await context.newPage();
    this.page.setDefaultTimeout(30000);
    log('Browser siap!', 'SUCCESS');
  }

  // ---- Scrape Instagram Profile (tanpa login) ----
  async scrapeInstagramProfile() {
    log('Mengambil data profil Instagram...', 'STEP');
    try {
      await this.page.goto(config.target.url, { waitUntil: 'domcontentloaded' });
      await sleep(4000);

      // Tutup popup login
      try {
        const closeBtn = await this.page.$('[aria-label="Close"]');
        if (closeBtn) { await closeBtn.click(); await sleep(1000); }
      } catch (e) { /* skip */ }

      // Meta description (biasanya berisi bio)
      try {
        const metaDesc = await this.page.$eval('meta[property="og:description"]', el => el.content);
        if (metaDesc) {
          log(`Meta description: ${metaDesc}`, 'INFO');
          // Parse stats dari meta: "32 Followers, 2 Following, 67 Posts..."
          const followersMatch = metaDesc.match(/([\d,.]+)\s*Followers/i);
          const followingMatch = metaDesc.match(/([\d,.]+)\s*Following/i);
          const postsMatch = metaDesc.match(/([\d,.]+)\s*Posts/i);
          if (followersMatch) this.data.profile.stats.followers = parseInt(followersMatch[1].replace(/,/g, ''));
          if (followingMatch) this.data.profile.stats.following = parseInt(followingMatch[1].replace(/,/g, ''));
          if (postsMatch) this.data.profile.stats.posts = parseInt(postsMatch[1].replace(/,/g, ''));

          // Bio biasanya setelah dash
          const bioPart = metaDesc.split(' - ').slice(1).join(' - ');
          if (bioPart && bioPart.length > 5) this.data.profile.bio = bioPart.trim().replace(/^"/, '').replace(/"$/, '');
        }
      } catch (e) { /* skip */ }

      // Profile picture
      try {
        const ogImage = await this.page.$eval('meta[property="og:image"]', el => el.content);
        if (ogImage) {
          this.data.profile.profile_pic_url = ogImage;
          ensureDir(config.paths.imagesDir);
          const destPath = path.join(config.paths.imagesDir, 'profile.jpg');
          await downloadFile(ogImage, destPath);
          this.data.profile.profile_pic_local = 'images/profile.jpg';
          log('Foto profil didownload', 'SUCCESS');
        }
      } catch (e) { /* skip */ }

      log(`Profil: ${this.data.profile.full_name}`, 'SUCCESS');
      log(`Bio: ${this.data.profile.bio}`, 'INFO');
      log(`Stats: ${this.data.profile.stats.posts} posts, ${this.data.profile.stats.followers} followers`, 'INFO');
    } catch (err) {
      log(`Error scraping Instagram profil: ${err.message}`, 'WARN');
    }
  }

  // ---- Scrape Products from Tokopedia ----
  async scrapeProducts() {
    log('Mengambil katalog produk dari Tokopedia...', 'STEP');
    try {
      await this.page.goto('https://www.tokopedia.com/search?q=takka+steel+bogor', { waitUntil: 'domcontentloaded' });
      await sleep(5000);

      // Coba cari produk
      const products = await this.page.$$eval('[data-testid="master-product-card"], .css-1sn1xa2, div[data-testid="divSRPContentProducts"] > div', (cards) => {
        return cards.slice(0, 20).map(card => {
          const title = card.querySelector('[data-testid="linkProductName"], [data-testid="spnSRPProdName"], .css-3um8ox, a span')?.textContent?.trim() || '';
          const price = card.querySelector('[data-testid="linkProductPrice"], [data-testid="spnSRPProdPrice"], .css-o5uqvq, .css-1ksb19c')?.textContent?.trim() || '';
          const img = card.querySelector('img')?.src || '';
          const link = card.querySelector('a')?.href || '';
          return { title, price, img, link };
        }).filter(p => p.title);
      });

      if (products.length > 0) {
        log(`Ditemukan ${products.length} produk dari Tokopedia`, 'SUCCESS');
        ensureDir(config.paths.imagesDir);

        for (let i = 0; i < products.length; i++) {
          const p = products[i];
          let localImg = '';
          if (p.img) {
            try {
              const destPath = path.join(config.paths.imagesDir, `product_${i + 1}.jpg`);
              await downloadFile(p.img, destPath);
              localImg = `images/product_${i + 1}.jpg`;
            } catch (e) { /* skip */ }
          }
          this.data.products.push({
            index: i + 1,
            name: p.title,
            price: p.price,
            image_url: p.img,
            image_local: localImg,
            link: p.link,
            source: 'tokopedia',
          });
          log(`  ${i + 1}. ${p.title} - ${p.price}`, 'INFO');
        }
      } else {
        log('Tidak ditemukan produk di Tokopedia, menggunakan data manual...', 'WARN');
        this.addManualProducts();
      }
    } catch (err) {
      log(`Error scraping Tokopedia: ${err.message}`, 'WARN');
      this.addManualProducts();
    }
  }

  // ---- Scrape Google untuk postingan Instagram ----
  async scrapeGooglePosts() {
    log('Mengambil data postingan dari Google Search...', 'STEP');
    try {
      await this.page.goto('https://www.google.com/search?q=site:instagram.com+takkasteelofficial&num=20', { waitUntil: 'domcontentloaded' });
      await sleep(3000);

      // Ambil hasil search
      const results = await this.page.$$eval('#search .g, #rso .g, [data-sokoban-container]', (items) => {
        return items.slice(0, 15).map(item => {
          const titleEl = item.querySelector('h3');
          const linkEl = item.querySelector('a');
          const snippetEl = item.querySelector('[data-sncf], .VwiC3b, [style*="-webkit-line-clamp"]');
          return {
            title: titleEl?.textContent?.trim() || '',
            link: linkEl?.href || '',
            snippet: snippetEl?.textContent?.trim() || '',
          };
        }).filter(r => r.title && r.link.includes('instagram.com'));
      });

      log(`Ditemukan ${results.length} postingan terindeks di Google`, 'INFO');

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        // Hanya ambil postingan (bukan profil)
        if (r.link.includes('/p/') || r.link.includes('/reel/')) {
          this.data.posts.push({
            index: this.data.posts.length + 1,
            title: r.title,
            caption: r.snippet,
            link: r.link,
            image_url: '',
            image_local: '',
            source: 'google_indexed',
          });
          log(`  Post: ${r.title.substring(0, 60)}...`, 'INFO');
        }
      }
    } catch (err) {
      log(`Error scraping Google: ${err.message}`, 'WARN');
    }
  }

  // ---- Scrape Google Images untuk foto produk ----
  async scrapeGoogleImages() {
    log('Mengambil gambar produk dari Google Images...', 'STEP');
    try {
      await this.page.goto('https://www.google.com/search?q=takka+steel+bogor+produk&tbm=isch', { waitUntil: 'domcontentloaded' });
      await sleep(3000);

      const images = await this.page.$$eval('img[data-src], img[src*="encrypted"]', (imgs) => {
        return imgs.slice(0, 12).map(img => ({
          src: img.getAttribute('data-src') || img.src,
          alt: img.alt || '',
        })).filter(i => i.src && !i.src.includes('data:image') && i.src.startsWith('http'));
      });

      log(`Ditemukan ${images.length} gambar dari Google Images`, 'INFO');
      ensureDir(config.paths.imagesDir);

      for (let i = 0; i < images.length; i++) {
        try {
          const destPath = path.join(config.paths.imagesDir, `gallery_${i + 1}.jpg`);
          await downloadFile(images[i].src, destPath);
          this.data.posts.push({
            index: this.data.posts.length + 1,
            caption: images[i].alt || `Takka Steel - Foto ${i + 1}`,
            image_url: images[i].src,
            image_local: `images/gallery_${i + 1}.jpg`,
            source: 'google_images',
          });
        } catch (e) { /* skip */ }
      }
    } catch (err) {
      log(`Error scraping Google Images: ${err.message}`, 'WARN');
    }
  }

  // ---- Tambah produk manual berdasarkan riset ----
  addManualProducts() {
    log('Menambahkan data produk dari riset...', 'STEP');
    const products = [
      { name: 'Besi H Beam', price: 'Rp3.015.000', category: 'Besi Struktural', desc: 'Besi H Beam untuk konstruksi bangunan dan struktur berat' },
      { name: 'Besi WF (Wide Flange)', price: 'Rp1.890.000', category: 'Besi Struktural', desc: 'Besi WF untuk rangka bangunan, jembatan, dan konstruksi baja' },
      { name: 'Besi UNP (Kanal U)', price: 'Rp220.000', category: 'Besi Struktural', desc: 'Besi UNP / Kanal U untuk struktur rangka dan penopang' },
      { name: 'Bondeck / Floordeck', price: 'Rp297.000 - Rp312.000', category: 'Atap & Lantai', desc: 'Bondeck / Floordeck untuk dak lantai beton bertulang' },
      { name: 'Atap Spandek Pasir', price: 'Rp126.000 - Rp144.000', category: 'Atap & Lantai', desc: 'Atap Spandek berlapis pasir, tersedia warna Blue, Black, Green, Brown' },
      { name: 'Atap Metal Pasir', price: 'Rp25.000', category: 'Atap & Lantai', desc: 'Atap metal dengan lapisan pasir untuk tampilan estetik' },
      { name: 'Nok Spandek / Talang Jurai', price: 'Rp18.000', category: 'Atap & Lantai', desc: 'Nok spandek dan talang jurai untuk penutup atap' },
      { name: 'Acrylic Board 4mm-5mm', price: 'Rp700.000', category: 'Material Bangunan', desc: 'Papan acrylic tebal 4-5mm untuk partisi dan dekorasi' },
      { name: 'Hollow Partisi / Plafond', price: 'Rp11.000', category: 'Material Bangunan', desc: 'Hollow untuk rangka partisi dinding dan plafond' },
      { name: 'Reng Baja Ringan Galvalume', price: 'Rp23.000', category: 'Baja Ringan', desc: 'Reng baja ringan galvalume anti karat untuk rangka atap' },
      { name: 'Besi Beton', price: 'Hubungi Kami', category: 'Besi Struktural', desc: 'Besi beton berbagai ukuran untuk pondasi dan konstruksi' },
      { name: 'Baja Ringan', price: 'Hubungi Kami', category: 'Baja Ringan', desc: 'Baja ringan untuk rangka atap rumah dan bangunan' },
    ];

    products.forEach((p, i) => {
      this.data.products.push({
        index: i + 1,
        name: p.name,
        price: p.price,
        category: p.category,
        description: p.desc,
        image_url: '',
        image_local: '',
        source: 'research',
      });
      log(`  ${i + 1}. ${p.name} - ${p.price}`, 'INFO');
    });
    log(`${products.length} produk ditambahkan`, 'SUCCESS');
  }

  saveData() {
    ensureDir(config.paths.dataDir);
    this.data.scraped_at = new Date().toISOString();
    const outputPath = path.resolve(config.paths.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(this.data, null, 2), 'utf-8');
    log(`Data tersimpan di: ${outputPath}`, 'SUCCESS');
    log(`Total: ${this.data.products.length} produk, ${this.data.posts.length} postingan`, 'INFO');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      log('Browser ditutup', 'INFO');
    }
  }

  async run() {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   Takka Steel - Data Scraper v2          ║');
    console.log('║   Multi-Source Company Profile Extractor  ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    try {
      await this.init();
      await this.scrapeInstagramProfile();
      await this.scrapeProducts();
      await this.scrapeGooglePosts();
      await this.scrapeGoogleImages();

      // Jika produk masih kosong setelah Tokopedia, tambahkan manual
      if (this.data.products.length === 0) {
        this.addManualProducts();
      }

      this.saveData();
      console.log('');
      log('🎉 Scraping selesai! Data siap digunakan.', 'SUCCESS');
      console.log('');
    } catch (err) {
      log(`Fatal error: ${err.message}`, 'ERROR');
      console.error(err);
    } finally {
      await this.close();
    }
  }
}

const scraper = new TakkaSteelScraper();
scraper.run();
