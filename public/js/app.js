/**
 * App.js - Frontend logic for Takka Steel Company Profile
 * Fetches scraped data and renders it dynamically
 */
(function () {
  'use strict';

  const DATA_PATH = '/data/instagram_data.json';
  let siteData = null;

  // ============ DATA LOADING ============
  async function loadData() {
    try {
      const res = await fetch(DATA_PATH);
      if (!res.ok) throw new Error('Data not found');
      siteData = await res.json();
      renderProfile();
      renderProducts();
      renderGallery();
      renderLastUpdated();
    } catch (err) {
      console.warn('Data not loaded:', err.message);
      showFallbackState();
    }
  }

  // ============ RENDER FUNCTIONS ============
  function renderProfile() {
    if (!siteData?.profile) return;
    const p = siteData.profile;

    setTextIfExists('hero-bio', p.bio || p.tagline || '');
    setTextIfExists('about-bio', [p.bio, p.tagline].filter(Boolean).join('. '));

    const imgEl = document.getElementById('profile-image');
    if (imgEl && p.profile_pic_local) {
      imgEl.src = '/data/' + p.profile_pic_local;
      imgEl.alt = p.full_name;
    }

    if (p.stats) {
      setTextIfExists('stat-posts', p.stats.posts || '67');
      setTextIfExists('stat-followers', p.stats.followers || '32');
    }
  }

  function renderProducts() {
    const grid = document.getElementById('products-grid');
    const loading = document.getElementById('products-loading');
    if (!grid) return;

    const products = siteData?.products || [];
    if (products.length === 0) {
      if (loading) loading.innerHTML = '<p>Belum ada data produk. Jalankan <code>npm run scrape</code></p>';
      return;
    }

    if (loading) loading.remove();

    products.forEach((product, i) => {
      const imgSrc = product.image_local ? '/data/' + product.image_local : product.image_url;
      const hasImage = imgSrc && imgSrc !== '/data/';
      const placeholderSvg = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect fill="#1a2332" width="400" height="400"/><text fill="#64748b" x="50%" y="45%" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="14">' + escapeHtml(product.name || 'Produk').substring(0, 30) + '</text><text fill="#3b82f6" x="50%" y="55%" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="12">' + escapeHtml(product.price || '') + '</text></svg>')}`;

      const card = document.createElement('div');
      card.className = 'product-card reveal';
      card.innerHTML = `
        <div class="product-card-image">
          <img src="${hasImage ? escapeHtml(imgSrc) : placeholderSvg}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='${placeholderSvg}'">
          ${product.category ? `<div class="product-badge">${escapeHtml(product.category)}</div>` : ''}
          <div class="product-card-overlay"><span>Lihat Detail</span></div>
        </div>
        <div class="product-card-body">
          <h3 class="product-name">${escapeHtml(product.name)}</h3>
          ${product.price ? `<p class="product-price">${escapeHtml(product.price)}</p>` : ''}
          ${product.description ? `<p class="product-desc">${escapeHtml(truncate(product.description, 100))}</p>` : ''}
        </div>
        ${product.link ? `<div class="product-card-meta"><a href="${escapeHtml(product.link)}" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i> Lihat di Tokopedia</a></div>` : ''}
      `;

      if (hasImage) {
        card.addEventListener('click', (e) => {
          if (!e.target.closest('a')) openLightbox(imgSrc, product.name);
        });
      }
      grid.appendChild(card);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    const loading = document.getElementById('gallery-loading');
    if (!grid) return;

    const posts = (siteData?.posts || []).filter(p => p.image_local || p.image_url);
    if (posts.length === 0) {
      if (loading) loading.innerHTML = '<p>Belum ada data galeri.</p>';
      return;
    }

    if (loading) loading.remove();

    posts.forEach((post, i) => {
      const imgSrc = post.image_local ? '/data/' + post.image_local : post.image_url;
      if (!imgSrc || imgSrc === '/data/') return;

      const caption = post.caption || post.title || `Foto ${i + 1}`;
      const item = document.createElement('div');
      item.className = 'gallery-item reveal';
      item.innerHTML = `
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(caption)}" loading="lazy" onerror="this.parentElement.style.display='none'">
        <div class="gallery-item-overlay"><i data-lucide="zoom-in"></i></div>
      `;
      item.addEventListener('click', () => openLightbox(imgSrc, caption));
      grid.appendChild(item);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderLastUpdated() {
    const el = document.getElementById('last-updated');
    if (el && siteData?.scraped_at) {
      el.textContent = new Date(siteData.scraped_at).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }
  }

  function showFallbackState() {
    const pLoading = document.getElementById('products-loading');
    if (pLoading) pLoading.innerHTML = '<p>Data belum tersedia. Jalankan <code>npm run scrape</code> terlebih dahulu.</p>';
    const gLoading = document.getElementById('gallery-loading');
    if (gLoading) gLoading.innerHTML = '<p>Data belum tersedia.</p>';
  }

  // ============ LIGHTBOX ============
  function openLightbox(src, caption) {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');
    if (!lb || !img) return;
    img.src = src;
    if (cap) cap.textContent = caption;
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) lb.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ============ NAVBAR ============
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');

    window.addEventListener('scroll', () => {
      navbar?.classList.toggle('scrolled', window.scrollY > 50);
    });

    toggle?.addEventListener('click', () => {
      links?.classList.toggle('open');
      toggle.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        links?.classList.remove('open');
        toggle?.classList.remove('active');
      });
    });

    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY + 120;
      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[data-section="${id}"]`);
        if (navLink) navLink.classList.toggle('active', scrollY >= top && scrollY < top + height);
      });
    });
  }

  // ============ SCROLL REVEAL ============
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal, .about-card, .feature-card, .contact-card, .ig-cta-card').forEach(el => {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  // ============ UTILITIES ============
  function setTextIfExists(id, value) {
    const el = document.getElementById(id);
    if (el && value) el.textContent = value;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function truncate(str, len) {
    if (!str || str.length <= len) return str || '';
    return str.substring(0, len) + '...';
  }

  // ============ INIT ============
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTextIfExists('footer-year', new Date().getFullYear());

    initNavbar();
    loadData();

    document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
    document.getElementById('lightbox')?.addEventListener('click', (e) => {
      if (e.target.id === 'lightbox') closeLightbox();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

    setTimeout(initScrollReveal, 500);
  });
})();
