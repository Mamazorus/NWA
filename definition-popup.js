// ============================================
// SYSTÈME DE DÉFINITIONS - POPUPS
// ============================================

const DefinitionManager = {
  container: null,
  activeNotifications: new Map(), // Map: element -> notification
  
  // Dictionnaire des définitions
  definitions: {
    'eazy-e': {
      term: 'Eazy-E',
      definition: 'Eric Wright, dit Eazy-E, né le 7 septembre 1964 à Compton (Californie), est un rappeur et producteur américain, membre et fondateur du groupe N.W.A (Niggaz Wit Attitudes). Il est considéré comme l\'un des pères fondateurs du gangsta rap, ayant créé Ruthless Records, le premier label spécialisé dans ce genre musical.'
    },
    'compton': {
      term: 'Compton',
      definition: 'Compton est une ville située dans le comté de Los Angeles, dans l\'État de Californie, aux États-Unis. Elle est située au sud de Willowbrook, entre West Compton et East Rancho Dominguez.'
    },
    'dr-dre': {
      term: 'Dr. Dre',
      definition: 'Andre Romelle Young, dit Dr. Dre, né le 18 février 1965 à Compton (Californie), est un rappeur, producteur, compositeur, acteur, réalisateur, entrepreneur, homme d\'affaires et ancien disc jockey américain. Il est le fondateur et actuel CEO d\'Aftermath Entertainment et de Beats Electronics. Dre est également l\'ancien codétenteur et membre de Death Row Records.'
    },
    'ruthless-records': {
      term: 'Ruthless Records',
      definition: 'Ruthless Records est un label discographique américain, situé à Los Angeles, en Californie. Il est fondé en 1987 à Los Angeles par Eazy-E et Jerry Heller. La création du gangsta rap lui est attribuée par la presse spécialisée. Il fait la promotion d\'artistes locaux qui sont par la suite devenus des stars, comme Dr. Dre, Ice Cube ou DJ Yella.'
    },
    'ice-cube': {
      term: 'Ice Cube',
      definition: 'O\'Shea Jackson, dit Ice Cube, est un rappeur, acteur, scénariste, réalisateur et producteur de cinéma américain, né le 15 juin 1969 à Crenshaw (quartier de South Central, en Californie). Il est membre du groupe de hip-hop N.W.A (Niggaz Wit Attitudes) de 1987 à 1989, puis de la Westside Connection de 1995 à 2005, avant de poursuivre une carrière solo dans la musique.'
    },
    'rap': {
      term: 'Rap',
      definition: 'Style de musique, apparu dans les ghettos afro-américains dans les années 1970, fondé sur la récitation chantée de textes souvent révoltés et radicaux, scandés sur un rythme répétitif et sur une trame musicale composite.'
    },
    'rnb': {
      term: 'R\'n\'B',
      definition: 'Genre musical afro-américain né dans les années 1990, influencé par le hip-hop, le funk, le rap et la soul.'
    },
    'dj-yella': {
      term: 'DJ Yella',
      definition: 'DJ Yella, de son vrai nom Antoine Carraby, né le 11 décembre 1967 à Compton, en Californie, est un disc jockey, producteur et réalisateur américain. Avec Dr. Dre, il fut membre du World Class Wreckin\' Cru, puis, par la suite, l\'un des principaux fondateurs du groupe pionnier du gangsta rap, N.W.A.'
    },
    'mc-ren': {
      term: 'MC Ren',
      definition: 'Lorenzo Jerald Patterson, dit MC Ren, est un rappeur américain, né le 14 juin 1969 à Compton (Californie). Il est membre des N.W.A.'
    },
    'priority-records': {
      term: 'Priority Records',
      definition: 'Priority Records est un label musical américain créé en 1985. Il est principalement connu pour avoir produit N.W.A, Ice Cube, MC Ren, Eazy-E…'
    },
    'parental-advisory': {
      term: 'Parental Advisory',
      definition: 'Le Parental Advisory (en français : Avertissement parental) est écrit au-dessus d\'Explicit Content (précédemment Explicit Lyrics). Cet avertissement est créé en 1985 aux États-Unis par la Recording Industry Association of America à la suite des pressions du Parents Music Resource Center. Ce logo se trouve en bas de certains CD d\'artistes chanteurs.'
    },
    'the-bomb-squad': {
      term: 'The Bomb Squad',
      definition: 'The Bomb Squad était une équipe de production hip hop américaine connue pour son travail avec le groupe hip hop Public Enemy.'
    },
    'public-enemy': {
      term: 'Public Enemy',
      definition: 'Public Enemy est un groupe de hip-hop américain, originaire de Long Island, New York. Composé de Chuck D, Flavor Flav, DJ Lord, le groupe S1W, Khari Wynn et Professor Griff, et formé en 1982.'
    },
    'suge-knight': {
      term: 'Suge Knight',
      definition: 'Suge Knight, de son vrai nom Marion Knight Jr., né le 19 avril 1965 (60 ans) à Compton, en Californie, est un réalisateur et producteur américain, l\'une des plus importantes figures fondatrices du gangsta rap.'
    },
    'death-row-records': {
      term: 'Death Row Records',
      definition: 'Death Row Records est un label discographique américain, situé à Los Angeles, en Californie. Il est fondé en 1991 par Dr. Dre et Suge Knight, sous la tutelle de la maison de disques Interscope de Jimmy Iovine. Death Row devient le label phare du gangsta rap des années 1990. Il comptait notamment trois artistes de renom : 2Pac, Snoop Doggy Dogg et Dr. Dre.'
    },
    'aftermath-entertainment': {
      term: 'Aftermath Entertainment',
      definition: 'Aftermath Entertainment est un label discographique américain, fondé par Dr. Dre en 1996 à la suite de son départ de Death Row Records, situé à Santa Monica, en Californie. Aftermath appartient au label Interscope Records, elle-même filiale d\'Universal Music Group.'
    },
    'sida': {
      term: 'SIDA',
      definition: 'Maladie très grave d\'origine virale, caractérisée par une chute brutale des défenses immunitaires de l\'organisme.'
    }
  },
  
  init() {
    // Créer le conteneur des notifications
    this.createContainer();
    
    // Initialiser tous les liens de définition
    this.initDefinitionLinks();
  },
  
  createContainer() {
    // Vérifier si le conteneur existe déjà
    if (document.querySelector('.definition-notifications')) {
      this.container = document.querySelector('.definition-notifications');
      return;
    }
    
    // Créer le conteneur
    this.container = document.createElement('div');
    this.container.className = 'definition-notifications';
    document.body.appendChild(this.container);
  },
  
  initDefinitionLinks() {
    const links = document.querySelectorAll('a.definition');
    
    links.forEach(link => {
      // Récupérer l'identifiant de la définition
      const defId = link.getAttribute('data-definition') || 
                    link.getAttribute('href')?.replace('#', '') ||
                    link.textContent.toLowerCase().replace(/\s+/g, '-');
      
      link.setAttribute('data-definition-id', defId);
      
      // Empêcher le comportement par défaut du lien
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleDefinition(link, defId);
      });
    });
  },
  
  toggleDefinition(element, defId) {
    // Si une notification existe déjà pour cet élément, la fermer
    if (this.activeNotifications.has(element)) {
      this.closeNotification(element);
      return;
    }
    
    // Sinon, ouvrir une nouvelle notification
    this.openNotification(element, defId);
  },
  
  openNotification(element, defId) {
    // Récupérer la définition
    const defData = this.definitions[defId];
    
    // Si pas de définition dans le dictionnaire, utiliser le texte du lien
    const term = defData?.term || element.textContent;
    const definition = defData?.definition || 
                       element.getAttribute('data-definition-text') || 
                       element.getAttribute('title') ||
                       'Définition non disponible.';
    
    // Marquer l'élément comme actif
    element.classList.add('active');
    
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = 'definition-notification';
    notification.innerHTML = `
      <button class="definition-close" aria-label="Fermer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <h4 class="definition-term">${term}</h4>
      <p class="definition-text">${definition}</p>
    `;
    
    // Ajouter au conteneur
    this.container.appendChild(notification);
    
    // Stocker la référence
    this.activeNotifications.set(element, notification);
    
    // Event listener pour le bouton fermer
    const closeBtn = notification.querySelector('.definition-close');
    closeBtn.addEventListener('click', () => {
      this.closeNotification(element);
    });
    
    // Déclencher l'animation d'entrée
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        notification.classList.add('visible');
      });
    });
  },
  
  closeNotification(element) {
    const notification = this.activeNotifications.get(element);
    if (!notification) return;
    
    // Retirer la classe active de l'élément
    element.classList.remove('active');
    
    // Animation de sortie
    notification.classList.remove('visible');
    notification.classList.add('closing');
    
    // Supprimer après l'animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.activeNotifications.delete(element);
    }, 400);
  },
  
  // Méthode pour ajouter dynamiquement des définitions
  addDefinition(id, term, definition) {
    this.definitions[id] = { term, definition };
  },
  
  // Fermer toutes les notifications
  closeAll() {
    this.activeNotifications.forEach((notification, element) => {
      this.closeNotification(element);
    });
  }
};

// Initialiser au chargement du DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    DefinitionManager.init();
  });
} else {
  DefinitionManager.init();
}