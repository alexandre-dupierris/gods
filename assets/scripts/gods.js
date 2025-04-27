// Variables de jeu en pause
let jeuEnPause = false;
const pauseOverlay = document.getElementById("pauseOverlay");
const resumeButton = document.getElementById("resumeButton");

// Variables de reset du jeu
const resetButton = document.getElementById("resetButton");
const confirmResetOverlay = document.getElementById("confirmResetOverlay");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

// Dictionnaires pour compression/décompression des types de blocs
const blocTypes = {
    th: "terre_herbeuse",
    ts: "terre",
    sa: "sable",
    r: "roche",
    e: "eau",
    c: "ciel",
    v: "vide",
    d: "diamant",
    o: "or",
    cu: "cuivre",
    f: "fer",
    ch: "charbon",
    a: "arbre",
    m: "mur",
    rs: "roche_sombre",
    b: "bois",
    lt: "lait",
    ln: "laine",
    g: "graine",
    tl: "terre_labouree",
    lg: "legume"
};

// Dictionnaire des images
const tailleBloc = 40;
const imagesBlocs = {};
const typesDeBloc = Object.values(blocTypes);
typesDeBloc.forEach(type => {
    const img = new Image();
    img.src = `./assets/images/blocs/${type}.webp`;
    imagesBlocs[type] = img;
});
const blocTypesInverse = {};
    for (const [code, nom] of Object.entries(blocTypes)) {
        blocTypesInverse[nom] = code;
}
const imagesMobs = {
    mouton: new Image()
};
imagesMobs.mouton.src = "./assets/images/mobs/mouton.webp";

// Initialisation au lancement du monde
let scores;
let actions;
let monMonde;
let playerLocalisation;
let mesMobs;
let physique;
let dernierSaut = 0;
let travaux = false;
let monInventaire;
let canvas;
let pointer;
let objetPorte;
let positionsMoutons = [];
let ancienneCouleurHaut = "#000000";
let ancienneCouleurBas = "#000000";
let dernierTickHerbe = 0;
const largeur = 401; // x = -200 à 200
const hauteur = 21;   // y = 0 à -20
const xMin = -200;
const xMax = 200;
const yMax = 0;

// Données du joueur
let joueur = {
    vie: 100,
    air: 100,
    nourriture: 100,
    vieMax: 100,
    airMax: 100,
    nourritureMax: 100,
    sousEauDepuis: null
};

// Variables de contrôle du temps et de la vitesse
const FPS = 60; // Fréquence d'images par seconde souhaitée
const STEP = 1000 / FPS; // Intervalle entre chaque mise à jour en ms
let lastTime = 0; // Horodatage de la dernière mise à jour
let accumulator = 0; // Accumulateur de temps

// Correspondance temps réel / temps de jeu et variables de gestion du temps
const dayDurationRealSeconds = 600;
const maxGameTime = 24000;
const tickPerSecond = maxGameTime / dayDurationRealSeconds;
let tempsJeu = 0;

// Configuration de la physique
physique = {
    gravite: 1,
    forceJump: 1,
    vitesseMax: 0.1,
    velocite: { x: 0, y: 0 },
    estAuSol: false,
    blocSolides: ["terre_herbeuse", "terre", "sable", "roche", "mur", "diamant", "or", "cuivre", "fer", "charbon", "bois", "laine", "terre_labouree"],
    blocTraversables: ["ciel", "eau", "vide", "arbre", "lait", "graine", "legume"]
};

// Variables pour le tooltip (affichage au survol des blocs)
let tooltipElement;
let isHovering = false;
let tooltipTimer = null;
let lastHoveredBlock = null;

// Gestion des touches du clavier
const touches = {
    z: false,
    q: false,
    s: false,
    d: false,
    espace: false
};

// Quand on clique sur Reset
resetButton.addEventListener("click", () => {
    confirmResetOverlay.style.display = "flex"; // Affiche la fenêtre de confirmation
});

// Si l'utilisateur confirme
confirmYes.addEventListener("click", () => {
    localStorage.clear();  // Efface la sauvegarde
    location.reload();     // Recharge la page
});

// Si l'utilisateur annule
confirmNo.addEventListener("click", () => {
    confirmResetOverlay.style.display = "none"; // Cache la fenêtre
});

// Ecoute du bouton pause
document.getElementById("pauseButton").addEventListener("click", () => {
    jeuEnPause = true;
    pauseOverlay.style.display = "flex";
});

// Ecoute du bouton pour sortir de pause
// Quand on clique sur le bouton plein écran
resumeButton.addEventListener("click", () => {
    jeuEnPause = false;
    lastTime = performance.now();
    pauseOverlay.style.display = "none";
});

// Mise en pause quand fenêtre masquée
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        // Pause le jeu
        jeuEnPause = true;
        pauseOverlay.style.display = "flex";
    }
});

// Définition du curseur
const curseur = document.getElementById("curseur-personnalise");
curseur.style.pointerEvents = "none";
curseur.style.position = "absolute";
curseur.style.zIndex = "1000";
let itemSelectionne = null;
let indexSelectionne = null;
objetPorte = {
    id: null,
    quantite: null
};

// Créer l'interface de l'inventaire
initialiserInventaire();

// Vérifier si une sauvegarde existe dans le localStorage
const sauvegarde = localStorage.getItem("sauvegarde");
if (sauvegarde) {
    const data = JSON.parse(sauvegarde);
    scores = data.scores;
    actions = data.actions;
    monMonde = decompresserMonde(data.monMonde);
    playerLocalisation = data.playerLocalisation;
    mesMobs = data.mesMobs;
    if (data.physique) {
        physique.velocite = data.physique.velocite;
        physique.estAuSol = data.physique.estAuSol;
    }
    if (data.monInventaire) {
        monInventaire = data.monInventaire;
        // Mettre à jour l'affichage une fois le DOM chargé
        if (document.readyState === 'complete') {
            majAffichageInventaire();
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                majAffichageInventaire();
            });
        }
    }
    tempsJeu = data.tempsJeu;
    joueur = data.joueur;
    console.log("🧠 Sauvegarde restaurée depuis le navigateur !");
} else {
    scores = {
        "Maître du Temps": 0,
        "Protecteur de la Vie": 0,
        "Gardien des Enfers": 0,
        "Porteur de la Connaissance": 0,
        "Sauveur des Souvenirs": 0,
        "Détenteur de la Vérité": 0,
        "Profondeur de l'Oubli": 0
    };
    actions = [{
        id: "a1",
        nom: "Naître",
        dieu: "Protecteur de la Vie",
        valeur: +1,
        tour: 1
    }];
    monMonde = genererMonde();
    playerLocalisation = [0, 0];
    mesMobs = genererMobs();
    physique = physique;
    monInventaire = Array(20).fill().map(() => ({id: null, quantite: 0}));
    tempsJeu = 0;
    joueur = joueur;
    console.log("🆕 Nouvelle partie initialisée !");

    // Sauvegarde immédiate
    const sauvegardeInitiale = {
        scores,
        actions,
        monMonde: compresserMonde(monMonde),
        playerLocalisation,
        mesMobs,
        physique,
        monInventaire,
        tempsJeu,
        joueur
    };
    localStorage.setItem("sauvegarde", JSON.stringify(sauvegardeInitiale));
}

// Indexation du monde
const indexMonde = {};
for (const bloc of monMonde) {
    indexMonde[`${bloc.x},${bloc.y}`] = bloc;
}

// Gestionnaire d'événements pour les touches enfoncées
window.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case 'z': touches.z = true; break;
        case 'q': touches.q = true; break;
        case 's': touches.s = true; break;
        case 'd': touches.d = true; break;
        case ' ': touches.espace = true; break;
    }
});

// Ecouteur d'événements pour les clics sur les moutons
document.addEventListener('click', function(e) {
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // Vérifier si un mouton a été cliqué
    for (const position of positionsMoutons) {
        const distanceSquared = Math.pow(position.x + 20 - clickX, 2) + Math.pow(position.y + 20 - clickY, 2);
        if (distanceSquared < 1200 && !travaux && !objetPorte.id) { // 40px de rayon au carré
            ouvrirModaleMobs(position.mob);
            break;
        }
    }
});

// Gestionnaire d'événements pour les touches relâchées
window.addEventListener('keyup', (e) => {
    switch(e.key.toLowerCase()) {
        case 'z': touches.z = false; break;
        case 'q': touches.q = false; break;
        case 's': touches.s = false; break;
        case 'd': touches.d = false; break;
        case ' ': touches.espace = false; break;
    }
});

// Fermeture de la modale
document.getElementById("fermer-modale").addEventListener("click", () => {
    fermerModale();
});

// Sauvegarde de la partie
document.getElementById("boutonSauvegarder").addEventListener("click", sauvegarderPartie);

// commencer le jeu
document.addEventListener("DOMContentLoaded", () => {
    // Commencer le jeu
    startGame();
});

// Taux de mémoire/karma par Dieu
const decayRates = {
    "Maître du Temps": 0.02,
    "Protecteur de la Vie": 0.04,
    "Gardien des Enfers": 0.02,
    "Porteur de la Connaissance": 0.04,
    "Sauveur des Souvenirs": 0.01,
    "Détenteur de la Vérité": 0.5,
    "Profondeur de l'Oubli": 0.1,
};

// Simulation d’un jugement au tour 150
// const currentTurn = 150;
// mettreAJourScores(actions, currentTurn);
// afficherScores(scores);
// const verdict = calculerJugement(scores);
// console.log("\nJugement Final :", verdict.message);
// exporterJSON(scores, verdict);