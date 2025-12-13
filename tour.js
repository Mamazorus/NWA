// ============================================
// N.W.A TOUR PAGE - SCRIPTS
// ============================================

// ============================================
// DONNÉES DE LA TOURNÉE
// ============================================
const tourData = {
  cities: {
    // Europe
    'paris': {
      name: 'Paris',
      venue: 'Stade de France',
      dates: ['26 Mars 2026', '29 Mars 2026'],
      prices: { standard: 89, golden: 149, vip: 299 }
    },
    'londres': {
      name: 'Londres',
      venue: 'Wembley Stadium',
      dates: ['02 Avril 2026', '05 Avril 2026'],
      prices: { standard: 95, golden: 165, vip: 320 }
    },
    'berlin': {
      name: 'Berlin',
      venue: 'Olympiastadion',
      dates: ['09 Avril 2026', '11 Avril 2026'],
      prices: { standard: 85, golden: 145, vip: 280 }
    },
    'amsterdam': {
      name: 'Amsterdam',
      venue: 'Johan Cruijff Arena',
      dates: ['17 Avril 2026', '19 Avril 2026'],
      prices: { standard: 90, golden: 155, vip: 295 }
    },
    'madrid': {
      name: 'Madrid',
      venue: 'Santiago Bernabéu',
      dates: ['24 Avril 2026', '26 Avril 2026'],
      prices: { standard: 85, golden: 145, vip: 285 }
    },
    // Amérique du Nord
    'new-york': {
      name: 'New York',
      venue: 'Madison Square Garden',
      dates: ['01 Juin 2026', '03 Juin 2026'],
      prices: { standard: 120, golden: 199, vip: 399 }
    },
    'boston': {
      name: 'Boston',
      venue: 'TD Garden',
      dates: ['06 Juin 2026', '08 Juin 2026'],
      prices: { standard: 99, golden: 175, vip: 350 }
    },
    'toronto': {
      name: 'Toronto',
      venue: 'Scotiabank Arena',
      dates: ['12 Juin 2026', '14 Juin 2026'],
      prices: { standard: 95, golden: 165, vip: 330 }
    },
    'chicago': {
      name: 'Chicago',
      venue: 'United Center',
      dates: ['18 Juin 2026', '20 Juin 2026'],
      prices: { standard: 99, golden: 175, vip: 345 }
    },
    'atlanta': {
      name: 'Atlanta',
      venue: 'State Farm Arena',
      dates: ['24 Juin 2026', '26 Juin 2026'],
      prices: { standard: 95, golden: 165, vip: 335 }
    },
    'los-angeles': {
      name: 'Los Angeles',
      venue: 'SoFi Stadium',
      dates: ['24 Décembre 2026', '26 Décembre 2026'],
      prices: { standard: 150, golden: 250, vip: 500 },
      final: true
    },
    // Amérique du Sud
    'sao-paulo': {
      name: 'São Paulo',
      venue: 'Allianz Parque',
      dates: ['10 Juillet 2026', '12 Juillet 2026'],
      prices: { standard: 75, golden: 135, vip: 265 }
    },
    'buenos-aires': {
      name: 'Buenos Aires',
      venue: 'Estadio River Plate',
      dates: ['15 Juillet 2026', '17 Juillet 2026'],
      prices: { standard: 70, golden: 125, vip: 250 }
    },
    'santiago': {
      name: 'Santiago',
      venue: 'Estadio Nacional',
      dates: ['21 Juillet 2026', '23 Juillet 2026'],
      prices: { standard: 70, golden: 125, vip: 245 }
    },
    // Asie
    'tokyo': {
      name: 'Tokyo',
      venue: 'Tokyo Dome',
      dates: ['01 Septembre 2026', '03 Septembre 2026'],
      prices: { standard: 110, golden: 185, vip: 375 }
    },
    'seoul': {
      name: 'Séoul',
      venue: 'Seoul Olympic Stadium',
      dates: ['06 Septembre 2026', '08 Septembre 2026'],
      prices: { standard: 105, golden: 180, vip: 365 }
    },
    // Moyen-Orient & Afrique
    'dubai': {
      name: 'Dubai',
      venue: 'Coca-Cola Arena',
      dates: ['05 Novembre 2026', '07 Novembre 2026'],
      prices: { standard: 130, golden: 220, vip: 450 }
    },
    'le-caire': {
      name: 'Le Caire',
      venue: 'Cairo Stadium',
      dates: ['12 Novembre 2026', '14 Novembre 2026'],
      prices: { standard: 65, golden: 115, vip: 230 }
    },
    'johannesburg': {
      name: 'Johannesburg',
      venue: 'FNB Stadium',
      dates: ['20 Novembre 2026', '22 Novembre 2026'],
      prices: { standard: 70, golden: 125, vip: 250 }
    }
  },

  ticketTypes: {
    standard: {
      name: 'Standard',
      features: [
        'Place assise catégorie 3',
        'Accès au concert',
        'Programme officiel numérique'
      ]
    },
    golden: {
      name: 'Golden Circle',
      features: [
        'Fosse debout proche scène',
        'Accès au concert',
        'Programme officiel imprimé',
        'Poster exclusif',
        'Entrée prioritaire'
      ]
    },
    vip: {
      name: 'VIP Experience',
      features: [
        'Fosse debout premier rang',
        'Meet & Greet avec les artistes',
        'Photo souvenir signée',
        'Goodies exclusifs',
        'Open bar avant le concert',
        'Accès backstage',
        'Certificat numéroté'
      ],
      isVip: true
    }
  }
};

// ============================================
// PANIER
// ============================================
class Cart {
  constructor() {
    this.items = [];
    this.loadFromStorage();
    this.updateUI();
  }

  loadFromStorage() {
    const saved = localStorage.getItem('nwa-tour-cart');
    if (saved) {
      this.items = JSON.parse(saved);
    }
  }

  saveToStorage() {
    localStorage.setItem('nwa-tour-cart', JSON.stringify(this.items));
  }

  addItem(item) {
    // Vérifier si l'item existe déjà
    const existingIndex = this.items.findIndex(i => 
      i.id === item.id && 
      i.date === item.date && 
      i.size === item.size
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += item.quantity || 1;
    } else {
      this.items.push({
        ...item,
        quantity: item.quantity || 1,
        addedAt: Date.now()
      });
    }

    this.saveToStorage();
    this.updateUI();
    this.showNotification(`${item.name} ajouté au panier`);
  }

  removeItem(index) {
    this.items.splice(index, 1);
    this.saveToStorage();
    this.updateUI();
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  updateUI() {
    const countElement = document.getElementById('cartCount');
    const itemsContainer = document.getElementById('cartItems');
    const totalElement = document.getElementById('cartTotal');
    const footerElement = document.getElementById('cartFooter');

    // Update count
    const count = this.getCount();
    if (countElement) {
      countElement.textContent = count;
      countElement.classList.toggle('visible', count > 0);
    }

    // Update items
    if (itemsContainer) {
      if (this.items.length === 0) {
        itemsContainer.innerHTML = '<p class="cart-empty">Votre panier est vide</p>';
      } else {
        itemsContainer.innerHTML = this.items.map((item, index) => `
          <div class="cart-item">
            <div class="cart-item-image">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                ${item.type === 'ticket' 
                  ? '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M13 5v2"></path><path d="M13 17v2"></path><path d="M13 11v2"></path>'
                  : '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path>'
                }
              </svg>
            </div>
            <div class="cart-item-details">
              <h4 class="cart-item-name">${item.name}</h4>
              <p class="cart-item-meta">
                ${item.date ? item.date : ''}
                ${item.size ? ` • Taille ${item.size}` : ''}
                ${item.quantity > 1 ? ` • x${item.quantity}` : ''}
              </p>
              <span class="cart-item-price">${item.price * item.quantity}€</span>
            </div>
            <button class="cart-item-remove" data-index="${index}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        `).join('');

        // Add remove listeners
        itemsContainer.querySelectorAll('.cart-item-remove').forEach(btn => {
          btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            this.removeItem(index);
          });
        });
      }
    }

    // Update total
    if (totalElement) {
      totalElement.textContent = `${this.getTotal()}€`;
    }

    // Show/hide footer
    if (footerElement) {
      footerElement.classList.toggle('visible', this.items.length > 0);
    }
  }

  showNotification(message) {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;
    
    // Styles inline pour la notification
    Object.assign(notification.style, {
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%) translateY(100px)',
      background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.95) 0%, rgba(39, 174, 96, 0.95) 100%)',
      color: '#fff',
      padding: '15px 25px',
      borderRadius: '50px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontFamily: 'mongoose, sans-serif',
      fontSize: '16px',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      zIndex: '9999',
      boxShadow: '0 10px 40px rgba(46, 204, 113, 0.4)',
      transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    });

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(-50%) translateY(100px)';
      setTimeout(() => notification.remove(), 400);
    }, 2500);
  }
}

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const cart = new Cart();

  // ============================================
  // NAVIGATION SCROLL
  // ============================================
  const nav = document.querySelector('.tour-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  // ============================================
  // CART SIDEBAR
  // ============================================
  const cartButton = document.getElementById('cartButton');
  const cartSidebar = document.getElementById('cartSidebar');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartClose = document.getElementById('cartClose');

  function openCart() {
    cartSidebar.classList.add('visible');
    cartOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartSidebar.classList.remove('visible');
    cartOverlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  cartButton?.addEventListener('click', openCart);
  cartClose?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  // ============================================
  // SÉLECTEUR DE VILLE - BILLETS
  // ============================================
  const citySelect = document.getElementById('citySelect');
  const ticketsTypes = document.getElementById('ticketsTypes');

  function renderTickets(cityId) {
    const city = tourData.cities[cityId];
    if (!city) {
      ticketsTypes.innerHTML = '<p class="select-city-prompt">Sélectionnez une ville pour voir les billets disponibles</p>';
      return;
    }

    ticketsTypes.innerHTML = Object.entries(tourData.ticketTypes).map(([key, ticket]) => `
      <div class="ticket-card ${ticket.isVip ? 'vip' : ''}" data-type="${key}">
        <h3 class="ticket-type">${ticket.name}</h3>
        <ul class="ticket-features">
          ${ticket.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
        <div class="ticket-price">${city.prices[key]}€ <span>/ personne</span></div>
        <select class="ticket-date-select" data-type="${key}">
          <option value="">Choisir une date</option>
          ${city.dates.map(d => `<option value="${d}">${d}</option>`).join('')}
        </select>
        <div class="ticket-quantity">
          <span>Quantité:</span>
          <div class="quantity-selector">
            <button class="quantity-btn minus" data-type="${key}">−</button>
            <span class="quantity-value" data-type="${key}">1</span>
            <button class="quantity-btn plus" data-type="${key}">+</button>
          </div>
        </div>
        <button class="ticket-add" data-type="${key}" data-city="${cityId}">
          Ajouter au panier
        </button>
      </div>
    `).join('');

    // Quantity buttons
    ticketsTypes.querySelectorAll('.quantity-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const valueEl = ticketsTypes.querySelector(`.quantity-value[data-type="${type}"]`);
        let value = parseInt(valueEl.textContent);
        
        if (btn.classList.contains('minus') && value > 1) {
          value--;
        } else if (btn.classList.contains('plus') && value < 10) {
          value++;
        }
        
        valueEl.textContent = value;
      });
    });

    // Add to cart buttons
    ticketsTypes.querySelectorAll('.ticket-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const cityId = btn.dataset.city;
        const city = tourData.cities[cityId];
        const ticket = tourData.ticketTypes[type];
        const dateSelect = ticketsTypes.querySelector(`.ticket-date-select[data-type="${type}"]`);
        const quantityEl = ticketsTypes.querySelector(`.quantity-value[data-type="${type}"]`);

        if (!dateSelect.value) {
          dateSelect.style.borderColor = '#EC1D31';
          dateSelect.focus();
          return;
        }

        cart.addItem({
          id: `ticket-${cityId}-${type}`,
          type: 'ticket',
          name: `${ticket.name} - ${city.name}`,
          date: dateSelect.value,
          price: city.prices[type],
          quantity: parseInt(quantityEl.textContent)
        });

        // Reset
        dateSelect.value = '';
        quantityEl.textContent = '1';
        dateSelect.style.borderColor = '';
      });
    });
  }

  citySelect?.addEventListener('change', (e) => {
    renderTickets(e.target.value);
  });

  // ============================================
  // DATE CARDS - RÉSERVATION RAPIDE
  // ============================================
  document.querySelectorAll('.date-cta').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cityId = btn.dataset.city;
      
      // Scroll to tickets section
      document.getElementById('tickets').scrollIntoView({ behavior: 'smooth' });
      
      // Select city
      setTimeout(() => {
        citySelect.value = cityId;
        renderTickets(cityId);
      }, 500);
    });
  });

  // ============================================
  // MERCH - AJOUT AU PANIER
  // ============================================
  document.querySelectorAll('.merch-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = btn.dataset.product;
      const name = btn.dataset.name;
      const price = parseInt(btn.dataset.price);
      const card = btn.closest('.merch-card');
      const sizeSelect = card.querySelector('.size-select');

      // Vérifier si une taille est requise
      if (sizeSelect && !sizeSelect.value) {
        sizeSelect.style.borderColor = '#EC1D31';
        sizeSelect.focus();
        return;
      }

      cart.addItem({
        id: `merch-${product}`,
        type: 'merch',
        name: name,
        size: sizeSelect?.value || null,
        price: price,
        quantity: 1
      });

      // Feedback visuel
      btn.textContent = 'Ajouté !';
      btn.classList.add('added');
      
      setTimeout(() => {
        btn.textContent = 'Ajouter au panier';
        btn.classList.remove('added');
        if (sizeSelect) {
          sizeSelect.value = '';
          sizeSelect.style.borderColor = '';
        }
      }, 1500);
    });
  });

  // ============================================
  // CHECKOUT
  // ============================================
  const checkoutBtn = document.getElementById('checkoutBtn');
  checkoutBtn?.addEventListener('click', () => {
    if (cart.items.length === 0) return;
    
    // Simulation de checkout
    alert(`Merci pour votre commande !\n\nTotal: ${cart.getTotal()}€\n\n(Ceci est un site fictif - aucun paiement ne sera effectué)`);
  });

  // ============================================
  // SMOOTH SCROLL
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ============================================
  // ANIMATIONS ON SCROLL
  // ============================================
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.continent-group, .merch-card, .ticket-card').forEach(el => {
    observer.observe(el);
  });
});
