import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA_42fCrT7k3e3_0XcB2QrYejYJMVztqjo",
    authDomain: "shelter-menu.firebaseapp.com",
    projectId: "shelter-menu",
    storageBucket: "shelter-menu.firebasestorage.app",
    messagingSenderId: "645160363953",
    appId: "1:645160363953:web:63b4d25b6128b5badb3f90"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  // ========================================
  // 1. Navbar Scroll Effect
  // ========================================
  const navbar = document.getElementById('navbar');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (navbar) {
          navbar.classList.toggle('scrolled', window.scrollY > 50);
        }
        if (scrollIndicator) {
          const hidden = window.scrollY > 200;
          scrollIndicator.style.opacity = hidden ? '0' : '1';
          scrollIndicator.style.pointerEvents = hidden ? 'none' : 'auto';
        }
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  // ========================================
  // 2. Smooth Scroll for Anchor Links
  // ========================================
  const NAVBAR_HEIGHT = 70;

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href');
    if (targetId === '#') return;

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      e.preventDefault();
      const top = targetElement.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
      window.scrollTo({ top, behavior: 'smooth' });
      closeMobileMenu();
    }
  });

  // ========================================
  // 3. Mobile Menu Toggle
  // ========================================
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const menuOverlay = document.querySelector('.menu-overlay');

  const closeMobileMenu = () => {
    hamburger?.classList.remove('active');
    mobileMenu?.classList.remove('active');
    menuOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  };

  const toggleMobileMenu = () => {
    hamburger?.classList.toggle('active');
    mobileMenu?.classList.toggle('active');
    menuOverlay?.classList.toggle('active');
    document.body.style.overflow = mobileMenu?.classList.contains('active') ? 'hidden' : '';
  };

  hamburger?.addEventListener('click', toggleMobileMenu);
  menuOverlay?.addEventListener('click', closeMobileMenu);

  // ========================================
  // 4. Scroll Reveal Animations Setup
  // ========================================
  let revealObserver;
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
  }

  // ========================================
  // 5. Active Nav Link Highlight
  // ========================================
  const sections = document.querySelectorAll('section[id]');
  const navLinksDesktop = document.querySelectorAll('.nav-links a');

  if (sections.length > 0 && navLinksDesktop.length > 0 && 'IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const currentId = entry.target.getAttribute('id');
            navLinksDesktop.forEach((link) => {
              link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
            });
          }
        });
      },
      { threshold: 0.2, rootMargin: `-${NAVBAR_HEIGHT}px 0px -40% 0px` }
    );
    sections.forEach((section) => navObserver.observe(section));
  }

  // ========================================
  // 6. Year in Footer & Happy Hour
  // ========================================
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const happyHourStatus = document.querySelector('.happy-hour-status');
  const updateHappyHour = () => {
    if (!happyHourStatus) return;
    const hour = new Date().getHours();
    if (hour < 20) {
      happyHourStatus.textContent = 'ACTIVO 🍺';
      happyHourStatus.style.color = '#000';
      happyHourStatus.style.backgroundColor = 'rgba(0,0,0,0.15)';
      happyHourStatus.style.padding = '4px 14px';
      happyHourStatus.style.borderRadius = '999px';
      happyHourStatus.style.fontFamily = "'Caveat', cursive";
      happyHourStatus.style.fontSize = '1rem';
    } else {
      happyHourStatus.textContent = '¡La birra sigue! 🍻';
      happyHourStatus.style.color = 'rgba(0,0,0,0.7)';
      happyHourStatus.style.backgroundColor = 'rgba(0,0,0,0.1)';
      happyHourStatus.style.padding = '4px 14px';
      happyHourStatus.style.borderRadius = '999px';
      happyHourStatus.style.fontFamily = "'Caveat', cursive";
      happyHourStatus.style.fontSize = '1rem';
    }
  };
  updateHappyHour();
  setInterval(updateHappyHour, 60000);

  // ========================================
  // 7. Dynamic Rendering from Firebase
  // ========================================
  async function loadMenu() {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const products = [];
      querySnapshot.forEach(doc => {
        if(doc.data().active) products.push({ id: doc.id, ...doc.data() });
      });
      
      products.sort((a, b) => (a.order || 99) - (b.order || 99));

      const containers = {
        entradas: document.getElementById('entradas-grid'),
        burgas: document.getElementById('burgas-container'),
        combos: document.getElementById('combos-grid'),
        papas: document.getElementById('papas-grid'),
        pizzas: document.getElementById('pizzas-grid'),
        cervezas: document.getElementById('cervezas-grid'),
        tragos: document.getElementById('tragos-list')
      };

      Object.values(containers).forEach(c => { if(c) c.innerHTML = ''; });

      const getEmoji = (name) => {
          const map = {
              "Tequeños (8 u.)": "🧀", "Nachos Cargados": "🌮", "Empanadas Salteñas": "🥟", "Empanadas J&Q": "🥟",
              "Papas Solas": "🍟", "Papas Cheddar": "🧀", "Papas Completas": "🤤",
              "Muzzarella": "🍕", "Napolitana": "🍅", "Panceta & Verdeo": "🥓"
          };
          return map[name] || "🍽️";
      };

      const renderCardWithEmoji = (p) => `
          <div class="card fade-in">
            <div class="card-img" style="display: flex; justify-content: center; align-items: center; background: var(--bg-tertiary); height: 140px; font-size: 3rem; border-bottom: 1px solid rgba(255,140,0,0.1);">
              ${p.img ? `<img src="${p.img}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;">` : getEmoji(p.name)}
            </div>
            <div class="card-body">
              <h3 class="card-title">${p.name}</h3>
              <p class="card-desc">${p.desc}</p>
              <span class="card-price">$${p.price}</span>
            </div>
          </div>
      `;

      // Entradas
      products.filter(p => p.cat === 'entradas').forEach(p => {
          if(containers.entradas) containers.entradas.innerHTML += renderCardWithEmoji(p);
      });

      // Burgas
      const burgersContainer = containers.burgas;
      if (burgersContainer) {
          const starBurgers = products.filter(p => p.cat === 'burgas' && p.isStar);
          const normalBurgers = products.filter(p => p.cat === 'burgas' && !p.isStar);
          
          starBurgers.forEach(p => {
              burgersContainer.innerHTML += `
                <div class="star-card fade-in">
                  <span class="star-badge">La Más Pedida</span>
                  <div class="card-img">
                    <img src="${p.img || 'img/hero-burger.png'}" alt="${p.name}" loading="lazy">
                  </div>
                  <div class="card-body">
                    <h3 class="card-title">${p.name}</h3>
                    <p class="card-desc">${p.desc}</p>
                    <span class="card-price">$${p.price}</span>
                  </div>
                </div>
              `;
          });
          
          if (normalBurgers.length > 0) {
              let gridHtml = '<div class="burger-grid">';
              normalBurgers.forEach(p => {
                  gridHtml += `
                    <div class="burger-card fade-in">
                      <img class="card-img" src="${p.img || 'img/hero-burger.png'}" alt="${p.name}" loading="lazy">
                      <div class="card-body">
                        <h3 class="card-title">${p.name}</h3>
                        <p class="card-desc">${p.desc}</p>
                        <span class="card-price">$${p.price}</span>
                      </div>
                    </div>
                  `;
              });
              gridHtml += '</div>';
              burgersContainer.innerHTML += gridHtml;
          }
      }

      // Combos
      products.filter(p => p.cat === 'combos').forEach(p => {
          if(containers.combos) {
              containers.combos.innerHTML += `
                  <div class="combo-item">
                    <span class="combo-item-name">${p.name}</span>
                    <span class="combo-item-price">+$${p.price}</span>
                  </div>
              `;
          }
      });

      // Papas & Pizzas
      products.filter(p => p.cat === 'papas').forEach(p => {
          if(containers.papas) containers.papas.innerHTML += renderCardWithEmoji(p);
      });
      products.filter(p => p.cat === 'pizzas').forEach(p => {
          if(containers.pizzas) containers.pizzas.innerHTML += renderCardWithEmoji(p);
      });

      // Cervezas & Tragos
      products.filter(p => p.cat === 'cervezas').forEach(p => {
          if(containers.cervezas) {
              containers.cervezas.innerHTML += `
                  <div class="beer-pill fade-in">
                    <span class="beer-name">${p.name}</span>
                    <span class="beer-desc">${p.desc}</span>
                  </div>
              `;
          }
      });
      products.filter(p => p.cat === 'tragos').forEach(p => {
          if(containers.tragos) {
              containers.tragos.innerHTML += `
                  <div class="trago-item fade-in">
                    <span class="trago-name">${p.name}</span>
                    <span class="trago-price">$${p.price}</span>
                  </div>
              `;
          }
      });

      // Re-apply fade-in observers to new elements
      if (revealObserver) {
        document.querySelectorAll('.fade-in').forEach(el => revealObserver.observe(el));
      } else {
        document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
      }
    } catch (e) {
      console.error("Error loading menu:", e);
    }
  }

  await loadMenu();
  onScroll();
});
