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
    ln: "laine"
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

// Variables de contrôle du temps et de la vitesse
const FPS = 60; // Fréquence d'images par seconde souhaitée
const STEP = 1000 / FPS; // Intervalle entre chaque mise à jour en ms
let lastTime = 0; // Horodatage de la dernière mise à jour
let accumulator = 0; // Accumulateur de temps

// Configuration de la physique
physique = {
    gravite: 1,
    forceJump: 1,
    vitesseMax: 0.1,
    velocite: { x: 0, y: 0 },
    estAuSol: false,
    blocSolides: ["terre_herbeuse", "terre", "sable", "roche", "mur", "diamant", "or", "cuivre", "fer", "charbon", "bois", "laine"],
    blocTraversables: ["ciel", "eau", "vide", "arbre", "lait"]
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
    monInventaire = Array(16).fill().map(() => ({id: null, quantite: 0}));
    console.log("🆕 Nouvelle partie initialisée !");

    // Sauvegarde immédiate
    const sauvegardeInitiale = {
        scores,
        actions,
        monMonde: compresserMonde(monMonde),
        playerLocalisation,
        mesMobs,
        physique,
        monInventaire
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

//
// Ecouteur d'événements pour les clics sur les moutons
document.addEventListener('click', function(e) {
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // Vérifier si un mouton a été cliqué
    for (const position of positionsMoutons) {
        const distanceSquared = Math.pow(position.x + 20 - clickX, 2) + Math.pow(position.y + 20 - clickY, 2);
        if (distanceSquared < 1200) { // 40px de rayon au carré
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

// Fonction pour compresser le monde
function compresserMonde(monde) {
    return monde.map(bloc => ({
        x: bloc.x,
        y: bloc.y,
        t: blocTypesInverse[bloc.type] || bloc.type
    }));
}

// Fonction pour décompresser le monde
function decompresserMonde(mondeCompresse) {
    return mondeCompresse.map(bloc => ({
        x: bloc.x,
        y: bloc.y,
        type: blocTypes[bloc.t] || bloc.t
    }));
}

// Fonction pour initialiser inventaire
function initialiserInventaire() {
    const inventaire = document.getElementById("inventaire");
    
    // Si l'inventaire est déjà rempli d'éléments, le vider d'abord
    inventaire.innerHTML = "";
    
    // Si monInventaire n'est pas défini, initialiser avec un tableau vide
    if (!monInventaire) {
        monInventaire = [];
        for (let i = 0; i < 16; i++) {
            monInventaire.push({
                id: null,
                quantite: 0
            });
        }
    }

    // Créer les cases d'inventaire dans le DOM
    for (let i = 0; i < 16; i++) {
        const caseDiv = document.createElement("div");
        caseDiv.classList.add("case-inventaire");
        caseDiv.dataset.index = i;
        caseDiv.textContent = `Objet ${i + 1}`;
        inventaire.appendChild(caseDiv);
    }
    // Ajouter l’événement de clic et gestion du curseur
    inventaire.addEventListener("click", function(e) {
            // Trouver l'élément .case-inventaire le plus proche, même si on clique sur un élément enfant
        const caseInventaire = e.target.closest('.case-inventaire');
        if (caseInventaire) {
            const index = parseInt(caseInventaire.dataset.index);
            const item = monInventaire[index];
            if (indexSelectionne === index) {
                // Si on clique à nouveau sur la même case, on désélectionne
                itemSelectionne = null;
                indexSelectionne = null;
                document.body.style.cursor = "default";
                curseur.style.display = "none";
                objetPorte = {
                    id: null,
                    quantite: null
                };
            } else if (item.id) { // Vérifier que la case contient un objet
                // On sélectionne le nouveau contenu
                itemSelectionne = item;
                indexSelectionne = index;
                
                // Mettre à jour l'affichage du curseur
                document.body.style.cursor = "none";
                curseur.innerHTML = ""; // Vider le curseur
                
                const img = document.createElement("img");
                img.src = `./assets/images/objets/${item.id}.webp`;
                img.alt = item.id;
                img.style.width = "32px";
                img.style.height = "32px";
                img.style.position = "absolute";
                img.style.top = 0;
                img.style.left = 0;
                img.style.pointerEvents = "none";
                curseur.appendChild(img);
                
                objetPorte = {
                    id: item.id,
                    quantite: item.quantite
                };

                curseur.style.position = "absolute";
                curseur.style.display = "block";

                // Mise à jour de la position du curseur
                curseur.style.left = (e.pageX - 16) + "px";
                curseur.style.top = (e.pageY - 16) + "px";
            }
        }
    });

    // Suivre la souris
    document.addEventListener("mousemove", function(e) {
        if (curseur.style.display === "block") {
            curseur.style.left = (e.pageX - 16) + "px";
            curseur.style.top = (e.pageY - 16) + "px";
        }
    });

    // Mettre à jour l'affichage avec les données existantes
    majAffichageInventaire();
}

// Fonction d'affichage de l'inventaire
function majAffichageInventaire() {
    const cases = document.querySelectorAll(".case-inventaire");
    cases.forEach((caseDiv, i) => {
        const objet = monInventaire[i];
        caseDiv.innerHTML = "";

        if (objet.id) {
            const img = document.createElement("img");
            img.src = `./assets/images/objets/${objet.id}.webp`;
            img.alt = objet.id;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "contain";
            img.style.pointerEvents = "none";
            caseDiv.appendChild(img);

            if (objet.quantite > 1) {
                const quantiteSpan = document.createElement("span");
                quantiteSpan.textContent = objet.quantite;
                quantiteSpan.style.position = "absolute";
                quantiteSpan.style.bottom = "2px";
                quantiteSpan.style.right = "4px";
                quantiteSpan.style.fontSize = "12px";
                quantiteSpan.style.backgroundColor = "rgba(0,0,0,0.6)";
                quantiteSpan.style.color = "white";
                quantiteSpan.style.padding = "0 2px";
                quantiteSpan.style.borderRadius = "3px";
                quantiteSpan.style.pointerEvents = "none";
                caseDiv.appendChild(quantiteSpan);
                caseDiv.style.position = "relative";
            }
        }
    });
}

// Ajout d'un objet dans l'inventaire
function ajouterObjetDansInventaire(idObjet, quantite) {
    // Tente de stacker dans une case existante
    for (let i = 0; i < monInventaire.length; i++) {
        const obj = monInventaire[i];
        if (obj.id === idObjet) {
            obj.quantite += quantite;
            majAffichageInventaire();
            return true;
        }
    }
    // Sinon, cherche une case vide
    for (let i = 0; i < monInventaire.length; i++) {
        const obj = monInventaire[i];
        if (!obj.id) {
            obj.id = idObjet;
            obj.quantite = quantite;
            majAffichageInventaire();
            return true;
        }
    }
    console.warn("Inventaire plein !");
    return false;
}

// Fonction pour initialiser le tooltip dynamiquement
function initialiserTooltip() {
    if (!document.getElementById("bloc-tooltip")) {
        tooltipElement = document.createElement("div");
        tooltipElement.id = "bloc-tooltip";
        tooltipElement.style.display = "none";
        tooltipElement.style.position = "absolute";
        tooltipElement.style.backgroundColor = "rgba(0,0,0,0.7)";
        tooltipElement.style.color = "white";
        tooltipElement.style.padding = "5px";
        tooltipElement.style.borderRadius = "3px";
        tooltipElement.style.fontSize = "14px";
        tooltipElement.style.zIndex = "100";
        tooltipElement.style.pointerEvents = "none";
        tooltipElement.style.maxWidth = "200px";
        document.body.appendChild(tooltipElement);
    } else {
        tooltipElement = document.getElementById("bloc-tooltip");
    }
}

// Fonction pour obtenir la description du bloc en fonction de son type
function getDescriptionBloc(type) {
    return type;
}

// Fonction pour afficher le tooltip après le délai
function showTooltip(bloc, mouseX, mouseY) {
    const visible = estExpose(bloc);
    const typeAffiche = visible ? bloc.type : "roche_sombre";
    const description = visible ? getDescriptionBloc(bloc.type) : getDescriptionBloc("roche_sombre");
    
    // Afficher le tooltip
    tooltipElement.textContent = `${typeAffiche.charAt(0).toUpperCase() + typeAffiche.slice(1)}`;
    tooltipElement.style.display = "block";
    tooltipElement.style.left = (mouseX + 10) + "px";
    tooltipElement.style.top = (mouseY + 10) + "px";
    isHovering = true;
}

// Fonction pour détecter le bloc survolé
function handleMouseMove(event) {
    if (travaux) {
        // Si travaux en cours, on cache le tooltip et on annule le timer
        if (tooltipTimer) {
            clearTimeout(tooltipTimer);
            tooltipTimer = null;
        }
        tooltipElement.style.display = "none";
        isHovering = false;
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left - 10;
    const mouseY = event.clientY - rect.top - 10;

    // Calcul similaire à handleCanvasClick pour trouver les coordonnées du bloc
    const [playerX, playerY] = playerLocalisation;
    const cameraX = Math.round(playerX);
    const cameraY = Math.round(playerY);
    
    const demiLargeur = Math.floor(canvas.width / (2 * tailleBloc));
    const demiHauteur = Math.floor(canvas.height / (2 * tailleBloc));
    
    const xDebut = cameraX - demiLargeur;
    const yDebut = cameraY + demiHauteur;
    
    const xOffset = (playerX - cameraX) * tailleBloc;
    const yOffset = (cameraY - playerY) * tailleBloc;

    const blocX = Math.floor((mouseX + xOffset) / tailleBloc) + xDebut;
    const blocY = yDebut - Math.floor((mouseY + yOffset) / tailleBloc);
    
    const bloc = getBlocAt(blocX, blocY);
    
    // Vérifier si on est toujours sur le même bloc
    const currentBlockId = bloc ? `${bloc.x},${bloc.y}` : null;
    const lastBlockId = lastHoveredBlock ? `${lastHoveredBlock.x},${lastHoveredBlock.y}` : null;
    
    if (currentBlockId !== lastBlockId) {
        // On a changé de bloc, annuler le timer précédent
        if (tooltipTimer) {
            clearTimeout(tooltipTimer);
            tooltipTimer = null;
        }
        tooltipElement.style.display = "none";
        isHovering = false;
        lastHoveredBlock = bloc;
        
        // Si on est sur un bloc, démarrer un nouveau timer
        if (bloc) {
            tooltipTimer = setTimeout(() => {
                showTooltip(bloc, event.clientX, event.clientY);
            }, 1000); // Délai d'une seconde
        }
    }
}

// Fonction pour cacher le tooltip quand on quitte le canvas
function handleMouseLeave() {
    if (tooltipTimer) {
        clearTimeout(tooltipTimer);
        tooltipTimer = null;
    }
    
    if (tooltipElement) {
        tooltipElement.style.display = "none";
        isHovering = false;
    }
    
    lastHoveredBlock = null;
}

// Fonction pour initialiser le tooltip et les événements
function setupTooltipEvents() {
    initialiserTooltip();
    canvas = document.getElementById("mondeCanvas");
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
}

// Fonction d'indexation du monde pour éviter les lags
function getBlocAt(x, y) {
    return indexMonde[`${x},${y}`];
}

// Fonction de génération des mobs
function genererMobs() {
    const mobs = [];
    for (let i = 0; i < 10; i++) {
        // Positionner autour du joueur
        const x = playerLocalisation[0] + Math.floor(Math.random() * 300 - 150);
        const y = playerLocalisation[1];
        mobs.push({
            type: "mouton",
            x,
            y,
            direction: Math.random() < 0.5 ? "gauche" : "droite",
            actif: Math.random() < 0.5, // commence immobile ou actif
            vitesseX: 0.05,
            velociteY: 0,
            estAuSol: false,
            dernierSaut: 0,
            prochainChangementDirection: Date.now() + 1000 + Math.random() * 4000,
            prochainEtat: Date.now() + 1000 + Math.random() * 3000
        });        
    }
    return mobs;
}

// Fonction d'interaction avec les mobs
function ouvrirModaleMobs(mouton) {
    fermerModale();
    const modale = document.getElementById("modale-mouton");
    const contenu = document.getElementById("contenu-mouton");
    modale.classList.remove("modale-cachee");
    
    // Générer le contenu HTML pour la modale du mouton
    const html = `
        <h2>Mouton</h2>
        <p>Un mouton bien duveteux.</p>
        <button onclick="observer(${mouton.x}, ${mouton.y})">Observer le mouton</button>
        <button onclick="tondreLesMoutons(${mouton.x}, ${mouton.y})">Prélever de la laine</button>
        <button onclick="traireLeMouton(${mouton.x}, ${mouton.y})">Tirer le lait</button>
    `;
    
    contenu.innerHTML = html;
}

// Fonction pour calculer la position à l'écran à partir des coordonnées du monde
function calculerPositionEcran(x, y) {
    const echelleAffichage = 40;
    const offsetX = window.innerWidth / 2;
    const offsetY = window.innerHeight / 2;
    const screenX = -20 + offsetX + (x - playerLocalisation[0]) * echelleAffichage;
    const screenY = -40 + offsetY - (y - playerLocalisation[1]) * echelleAffichage;
    
    return [screenX, screenY];
}

// Fonction pour fermer la modale des mobs
function fermerModaleMobs() {
    const modale = document.getElementById("modale-mouton");
    modale.classList.add("modale-cachee");
}

// Fonction de calculs au sol pour les mobs
function mobEstAuSol(mob) {
    const blocSousGauche = getBlocAt(Math.floor(mob.x), Math.floor(mob.y) - 1);
    const blocSousDroit = getBlocAt(Math.ceil(mob.x), Math.floor(mob.y) - 1);
    const distanceAuSol = mob.y - Math.floor(mob.y);
    
    return (
        distanceAuSol < 0.2 &&
        (
            (blocSousGauche && estBlocSolide(blocSousGauche.type)) ||
            (blocSousDroit && estBlocSolide(blocSousDroit.type))
        )
    );
}


// Fonction d'update des mobs
function updateMobs() {
    const maintenant = Date.now();
    for (const mob of mesMobs) {
        const dansEau = mobEstDansEau(mob);

        // Appliquer la gravité modifiée
        if (!mob.estAuSol) {
            const facteur = dansEau ? 0.1 : 1.0;
            mob.velociteY -= 0.05 * facteur;
            mob.velociteY = Math.max(mob.velociteY, -0.3);
        }
        if (dansEau) {
            mob.velociteY *= 0.9; // amortissement vertical dans l’eau
        }
        if (maintenant > mob.prochainEtat) {
            mob.actif = !mob.actif; // alterne actif/immobile
            mob.prochainEtat = maintenant + 1000 + Math.random() * 3000;
        }

        // Changement de direction toutes les 1 à 4 secondes
        if (maintenant > mob.prochainChangementDirection) {
            mob.direction = mob.direction === "droite" ? "gauche" : "droite";
            mob.prochainChangementDirection = maintenant + 1000 + Math.random() * 3000;
        }

        // Mouvement horizontal
        const directionX = mob.direction === "droite" ? 1 : -1;
        const nouvelX = mob.x + directionX * mob.vitesseX;

        if (mob.actif) {
            const directionX = mob.direction === "droite" ? 1 : -1;
            const nouvelX = mob.x + directionX * mob.vitesseX;
        
            if (!detecterCollision(nouvelX, mob.y, mob.direction)) {
                mob.x = nouvelX;
            } else {
                mob.direction = mob.direction === "droite" ? "gauche" : "droite";
            }
        }

        // Appliquer la gravité
        const nouvelY = mob.y + mob.velociteY;

        if (!detecterCollision(mob.x, nouvelY, mob.velociteY > 0 ? "haut" : "bas")) {
            if (dansEau) {
                // Altitude cible de flottement : garde les mobs proches de la surface
                const targetY = Math.floor(mob.y) + 0.2;
                const difference = targetY - mob.y;
                
                mob.velociteY += difference * 0.1; // force douce vers le haut
            }            
            mob.y = nouvelY;
        } else {
            if (mob.velociteY < 0) {
                mob.y = Math.floor(nouvelY) + 1;
            }
            mob.velociteY = 0;            
        }
        
        // Vérifie s’il est vraiment au sol
        mob.estAuSol = mobEstAuSol(mob);
        

        // Saut aléatoire toutes les 1-2 secondes
        if (mob.estAuSol && maintenant - mob.dernierSaut > 1000 + Math.random() * 1000) {
            mob.velociteY = 0.3 + Math.random() * 0.2;
            mob.estAuSol = false;
            mob.dernierSaut = maintenant;
        }
    }
}

// Fonction de génération d'un monde
function genererMonde() {
    const largeur = 401; // x = -200 à 200
    const hauteur = 16;   // y = 0 à -15
    const xMin = -200;
    const xMax = 200;
    const yMax = 0;
    const monde = [];

    const surfaceTypesBase = ["terre_herbeuse", "terre", "sable", "roche", "eau"];

    const resourceChances = {
        diamant: 0.001,
        or: 0.005,
        cuivre: 0.01,
        fer: 0.01,
        charbon: 0.02,
        vide: 0.05
    };

    const surfaceLigne = [];

    // Étape 1 : Générer la surface
    for (let x = xMin; x <= xMin + largeur - 1; x++) {
        const idx = x - xMin;
    
        // Chercher voisins gauche/droite si existants
        const gauche = surfaceLigne[idx - 1] || null;
    
        const solides = ["terre_herbeuse", "terre", "sable", "roche", "eau"];
        const peutAvoirEau = solides.includes(gauche);
        

        let type;
        if (peutAvoirEau && Math.random() < 0.1) {
            type = "eau";
        } else {
            // Choix classique mais sans "eau" comme option aléatoire ici
            const optionsSansEau = ["terre_herbeuse", "terre", "sable", "roche"];
            type = optionsSansEau[Math.floor(Math.random() * optionsSansEau.length)];
        }
    
        surfaceLigne.push(type);
    }

    // Étape 2 : Génération des profondeurs du ciel lissées
    const skyDepths = [];
    let previousDepth = Math.floor(Math.random() * 4) + 4;

    for (let i = 0; i < largeur; i++) {
        // Limiter la variation à ±1
        const variation = Math.floor(Math.random() * 3) - 1; // -1, 0 ou +1
        let newDepth = previousDepth + variation;

        // Garde les valeurs dans une plage raisonnable
        newDepth = Math.max(4, Math.min(7, newDepth)); // par ex : entre 4 et 7

        skyDepths.push(newDepth);
        previousDepth = newDepth;
    }

    // Étape 3 : Construction du monde avec la surface lissée
    for (let x = xMin; x <= xMin + largeur - 1; x++) {
        const idx = x - xMin;
        const skyDepth = skyDepths[idx];
        const surfaceType = surfaceLigne[idx];
        const surfaceYLocal = yMax - skyDepth;

        for (let y = yMax; y >= yMax - hauteur + 2; y--) {
            let type;
            if (y <= yMax && y > surfaceYLocal) {
                // Blocs "ciel"
                if (y === surfaceYLocal + 1 && (surfaceType === "terre_herbeuse" || surfaceType === "terre")) {
                    type = Math.random() < 0.3 ? "arbre" : "ciel";
                } else {
                    type = "ciel";
                }
            } else if (y === surfaceYLocal) {
                type = surfaceType;
            } else {
                const profondeurRelative = surfaceYLocal - y;
                type = choisirBlocProfondeur(profondeurRelative);
            }
            monde.push({ x, y, type });
        }
    }

    // Étape 4 : Ajouter les murs infranchissables
    const mursX = [xMin - 1, xMax + 1];
    mursX.forEach(x => {
        for (let y = yMax; y >= yMax - hauteur + 1; y--) {
            monde.push({ x, y, type: "mur" });
        }
    });

    // Étape 5 : Propager l'eau
    propagerEau(monde);

    // Étape 6 : Création du fond du monde infranchissable
    for (let x = xMin - 1; x <= xMax + 1; x++) {
        monde.push({ x, y: yMax - hauteur + 1, type: "mur" });
    }

    return monde;

    // Générateur de bloc profond
    function choisirBlocProfondeur(profondeurRelative) {
        const baseRoche = 0.3;
        const baseTerre = 0.65;
    
        // Limite la profondeur entre 0 et 20 pour l’ajustement
        const profondeurNormale = Math.min(profondeurRelative / 20, 1);
    
        // Plus profond = moins de terre, plus de roche
        const probaTerre = baseTerre * (1 - profondeurNormale); // diminue avec la profondeur
        const probaRoche = 1 - probaTerre; // reste de la proba pour la roche
    
        // D'abord, on gère les ressources rares
        const r = Math.random();
        let cumule = 0;
        for (const [type, proba] of Object.entries(resourceChances)) {
            cumule += proba;
            if (r < cumule) return type;
        }
    
        // Puis, on applique les proba terre/roche
        return Math.random() < probaTerre ? "terre" : "roche";
    }

    // Fonction de propagation initiale de l'eau
    function propagerEau(monde) {
        let propagation = true;

        while (propagation) {
            propagation = false;

            // Clone du monde pour éviter de modifier en itérant
            const nouveauxBlocs = [];

            for (const bloc of monde) {
                if (bloc.type !== "eau") continue;

                const voisins = [
                    { x: bloc.x - 1, y: bloc.y }, // gauche
                    { x: bloc.x + 1, y: bloc.y }, // droite
                    { x: bloc.x, y: bloc.y - 1 }  // dessous
                ];

                for (const voisin of voisins) {
                    const blocVoisin = monde.find(b => b.x === voisin.x && b.y === voisin.y);
                    if (blocVoisin && (blocVoisin.type === "vide" || blocVoisin.type === "ciel" || blocVoisin.type === "arbre")) {
                        blocVoisin.type = "eau";
                        propagation = true;
                    }
                }
            }
        }
        return monde;
    }
}

// Fonction pour vérifier si un bloc est solide
function estBlocSolide(type) {
    return physique.blocSolides.includes(type);
}

// Fonction pour obtenir un bloc à une position donnée
function getBlocAt(x, y) {
    return monMonde.find(bloc => bloc.x === x && bloc.y === y);
}

// Fonction pour vérifier si le joueur est dans l'eau
function estDansEau(x, y) {
    const delta = 0; // tolérance verticale vers le bas
    const positions = [
        [Math.floor(x), Math.floor(y)],       // position principale
        [Math.ceil(x), Math.floor(y)],        // coin supérieur droit
        [Math.floor(x), Math.ceil(y)],        // coin inférieur gauche
        [Math.ceil(x), Math.ceil(y)],         // coin inférieur droit
        [Math.floor(x), Math.floor(y - delta)],
        [Math.ceil(x), Math.floor(y - delta)]
    ];
    
    for (const [checkX, checkY] of positions) {
        const bloc = getBlocAt(checkX, checkY);
        if (bloc && bloc.type === "eau") {
            return true;
        }
    }
    
    return false;
}

// Fonction pour vérifier si un mob est dans l'eau
function mobEstDansEau(mob) {
    const bloc = getBlocAt(Math.floor(mob.x), Math.floor(mob.y));
    return bloc && bloc.type === "eau";
}


// Fonction de détection de collision
function detecterCollision(x, y, direction) {
    // direction peut être "haut", "bas", "gauche", "droite" ou undefined pour tous
    
    // Positions à vérifier pour la collision
    const positions = [
        [Math.floor(x), Math.floor(y)],        // position principale
        [Math.ceil(x), Math.floor(y)],         // coin supérieur droit
        [Math.floor(x), Math.ceil(y)],         // coin inférieur gauche
        [Math.ceil(x), Math.ceil(y)]           // coin inférieur droit
    ];
    
    // Si on saute vers le haut, ajouter une petite marge
    if (direction === "haut") {
        // Ajuster les positions pour la tête
        positions[2][1] = Math.ceil(y - 0.2);
        positions[3][1] = Math.ceil(y - 0.2);
    }
    
    for (const [checkX, checkY] of positions) {
        const bloc = getBlocAt(checkX, checkY);
        if (bloc && estBlocSolide(bloc.type)) {
            return true;
        }
    }
    
    return false;
}

// Fonction updatePhysique
function updatePhysique() {

    // Vérifier si des travaux sont en cours
    if (travaux) return;
    let [x, y] = playerLocalisation;
    const oldX = x;
    const oldY = y;
    
    // Vérifier si le joueur est dans l'eau
    const dansEau = estDansEau(x, y);

    // Appliquer la gravité si pas au sol
    if (!physique.estAuSol) {
        // Réduction de l'effet de gravité dans l'eau
        const facteurGravite = dansEau ? 0.1 : 1.0;
        physique.velocite.y -= physique.gravite * 0.1 * facteurGravite;
    }
    
    // Limiter la vitesse de chute
    physique.velocite.y = Math.max(physique.velocite.y, -physique.vitesseMax * 3);
    
    // Contrôles horizontaux
    const acceleration = 0.02;
    const deceleration = 0.04;
    
    // Ralentir le déplacement horizontal dans l'eau
    const facteurVitesse = dansEau ? 0.5 : 1.0;

    if (touches.q) {
        physique.velocite.x = Math.max(physique.velocite.x - acceleration * facteurVitesse, -0.15 * facteurVitesse);
    } else if (touches.d) {
        physique.velocite.x = Math.min(physique.velocite.x + acceleration * facteurVitesse, 0.15 * facteurVitesse);
    } else {
        if (physique.velocite.x > 0) {
            physique.velocite.x = Math.max(0, physique.velocite.x - deceleration);
        } else if (physique.velocite.x < 0) {
            physique.velocite.x = Math.min(0, physique.velocite.x + deceleration);
        }
    }
    const maintenant = Date.now();

    // Vérifier si on peut sauter
    if (touches.z && (physique.estAuSol || dansEau) && (maintenant - dernierSaut > 250)) {
        // Force de saut réduite dans l'eau
        const forceSaut = dansEau ? physique.forceJump * 0.4 : physique.forceJump * 0.6;
        physique.velocite.y = forceSaut;
        physique.estAuSol = false;
        dernierSaut = maintenant;
    }

    // Mouvement horizontal
    const nouvelX = x + physique.velocite.x;
    const directionX = physique.velocite.x > 0 ? "droite" : "gauche";
    if (!detecterCollision(nouvelX, y, directionX)) {
        x = nouvelX;
    } else {
        physique.velocite.x = 0;
    }
    
    // Mouvement vertical
    const nouvelY = y + physique.velocite.y;
    const directionY = physique.velocite.y > 0 ? "haut" : "bas";
    
    if (!detecterCollision(x, nouvelY, directionY)) {
        y = nouvelY;
        physique.estAuSol = false;
    } else {
        // Si collision en descendant
        if (physique.velocite.y < 0) {
            y = Math.floor(nouvelY) + 1; // Placer juste au-dessus du bloc
            physique.estAuSol = true;
        } 
        // Si collision en montant
        else if (physique.velocite.y > 0) {
            y = Math.floor(y); // Arrêter au plafond
        }
        
        physique.velocite.y = 0;
    }
    
    // Vérification explicite du sol
    physique.estAuSol = false; // Réinitialiser d'abord
    
    // Vérifier les deux coins sous le joueur
    const piedsGauche = getBlocAt(Math.floor(x), Math.floor(y) - 1);
    const piedsDroit = getBlocAt(Math.ceil(x), Math.floor(y) - 1);

    const distanceAuSol = y - Math.floor(y);

    if (
        distanceAuSol < 0.2 &&
        (
            (piedsGauche && estBlocSolide(piedsGauche.type)) ||
            (piedsDroit && estBlocSolide(piedsDroit.type))
        )
    ) {
        physique.estAuSol = true;
    }
    
    playerLocalisation = [x, y];

    if (oldX !== x || oldY !== y) {
        fermerModale();
    }
}

// Fonction de boucle de jeu
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    
    // Calculer le temps écoulé depuis la dernière frame
    const frameTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Accumuler le temps
    accumulator += frameTime;
    
    // Mettre à jour la physique à intervalles fixes
    while (accumulator >= STEP) {
        updatePhysique();
        updateMobs();
        accumulator -= STEP;
    }
    // Toujours afficher à chaque frame
    afficherMonde(monMonde);

    // Mettre à jour les positions des moutons à chaque frame
    mettreAJourPositionsMoutons();

    requestAnimationFrame(gameLoop);
}

// Démarre la boucle de jeu
function startGame() {
    lastTime = 0;
    accumulator = 0;
    setupTooltipEvents();
    requestAnimationFrame(gameLoop);
}

// Fonction de mise à jour des positions des moutons
function mettreAJourPositionsMoutons() {
    positionsMoutons = mesMobs
        .filter(mob => mob.type === "mouton")
        .map(mouton => {
            const [screenX, screenY] = calculerPositionEcran(mouton.x, mouton.y);
            return {
                x: screenX,
                y: screenY,
                mob: mouton
            };
        });
}

// Fonction de calcul de l'exposition des blocs
function estExpose(bloc) {
    const voisins = [
        getBlocAt(bloc.x, bloc.y + 1), // haut
        getBlocAt(bloc.x, bloc.y - 1), // bas
        getBlocAt(bloc.x + 1, bloc.y), // droite
        getBlocAt(bloc.x - 1, bloc.y)  // gauche
    ];
    return voisins.some(b => b && ["ciel", "arbre", "eau", "lait"].includes(b.type));
}

// Fonction d'affichage du monde
function afficherMonde(monMonde) {
    canvas = document.getElementById("mondeCanvas");
    canvas.addEventListener("click", handleCanvasClick);
    const ctx = canvas.getContext("2d");

    // Centrer sur le joueur avec arrondi pour éviter les sauts d'image
    const [playerX, playerY] = playerLocalisation;
    
    // Arrondir les positions pour une caméra stable
    const cameraX = Math.round(playerX);
    const cameraY = Math.round(playerY);
    
    const demiLargeurCanvas = Math.floor(canvas.width / (2 * tailleBloc));
    const demiHauteurCanvas = Math.floor(canvas.height / (2 * tailleBloc));

    const xDebut = cameraX - demiLargeurCanvas;
    const xFin = cameraX + demiLargeurCanvas;
    const yDebut = cameraY + demiHauteurCanvas;
    const yFin = cameraY - demiHauteurCanvas * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner tous les blocs visibles avec des coordonnées stables
    for (const bloc of monMonde) {
        if (
            bloc.x >= xDebut -1 && bloc.x <= xFin + 1 &&
            bloc.y <= yDebut && bloc.y >= yFin + 1
        ) {
            const visible = estExpose(bloc);
            const typeAffiche = visible ? bloc.type : "roche_sombre";
            if (visible && bloc.type === "vide"){
                bloc.type = "ciel";
            }
            const img = imagesBlocs[typeAffiche];
    
            if (img && img.complete) {
                const xOffset = (playerX - cameraX) * tailleBloc;
                const yOffset = (cameraY - playerY) * tailleBloc;
    
                const xPixel = (bloc.x - xDebut) * tailleBloc - xOffset;
                const yPixel = (yDebut - bloc.y) * tailleBloc - yOffset;
    
                ctx.drawImage(img, Math.round(xPixel), Math.round(yPixel), tailleBloc, tailleBloc);
            }
        }
    }
    
    // for (const bloc of monMonde) {
    //     if (
    //         bloc.x >= xDebut && bloc.x <= xFin &&
    //         bloc.y <= yDebut && bloc.y >= yFin
    //     ) {
    //         const img = imagesBlocs[bloc.type];
    //         if (img && img.complete) {
    //             // Calcul des positions en pixels avec correction pour le joueur non arrondi
    //             const xOffset = (playerX - cameraX) * tailleBloc;
    //             const yOffset = (cameraY - playerY) * tailleBloc;
                
    //             const xPixel = (bloc.x - xDebut) * tailleBloc - xOffset;
    //             const yPixel = (yDebut - bloc.y) * tailleBloc - yOffset;
                
    //             // Arrondir les positions finales
    //             ctx.drawImage(img, Math.round(xPixel), Math.round(yPixel), tailleBloc, tailleBloc);
    //         }
    //     }
    // }

    // Dessiner le joueur toujours exactement au centre
    ctx.fillStyle = "#A67B5B";
    const xPixelJoueur = demiLargeurCanvas * tailleBloc;
    const yPixelJoueur = demiHauteurCanvas * tailleBloc;
    
    // Vérifier si le joueur est dans l'eau pour un effet visuel
    const dansEau = estDansEau(playerX, playerY);
    
    // Couleur du joueur (teinte bleutée dans l'eau)
    ctx.fillStyle = dansEau ? "#7B93A6" : "#A67B5B";
    ctx.fillRect(xPixelJoueur, yPixelJoueur, tailleBloc, tailleBloc);

    // Ajouter des yeux pour voir la direction
    if (physique.velocite.x > 0) {
        ctx.fillStyle = "white";
        ctx.fillRect(xPixelJoueur + tailleBloc*0.7, yPixelJoueur + tailleBloc*0.3, tailleBloc*0.2, tailleBloc*0.2);
    } else if (physique.velocite.x < 0){
        ctx.fillStyle = "white";
        ctx.fillRect(xPixelJoueur + tailleBloc*0.1, yPixelJoueur + tailleBloc*0.3, tailleBloc*0.2, tailleBloc*0.2);
    }
    else {
        ctx.fillStyle = "white";
        ctx.fillRect(xPixelJoueur + tailleBloc*0.7, yPixelJoueur + tailleBloc*0.3, tailleBloc*0.2, tailleBloc*0.2);
        ctx.fillRect(xPixelJoueur + tailleBloc*0.1, yPixelJoueur + tailleBloc*0.3, tailleBloc*0.2, tailleBloc*0.2);
    }

    // Ajouter des bulles si le joueur est dans l'eau
    if (dansEau && Math.random() < 0.3) { // 30% de chance d'afficher une bulle par frame
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        const bulleX = xPixelJoueur + Math.random() * tailleBloc;
        const bulleY = yPixelJoueur - Math.random() * 10;
        const tailleBulle = Math.random() * 4 + 2;
        ctx.beginPath();
        ctx.arc(bulleX, bulleY, tailleBulle, 0, Math.PI * 2);
        ctx.fill();
    }

    // Afficher les mobs
    for (const mob of mesMobs) {
        const xPixel = (mob.x - xDebut) * tailleBloc - (playerX - cameraX) * tailleBloc;
        const yPixel = (yDebut - mob.y) * tailleBloc - (cameraY - playerY) * tailleBloc;
    
        const img = imagesMobs[mob.type];
        if (img && img.complete) {
            const flip = mob.direction === "droite";
            ctx.save(); // Sauvegarde le contexte

            const isMouton = mob.type === "mouton";
            const size = isMouton ? 50 : tailleBloc;

            // Si flip, on inverse horizontalement
            if (flip) {
                ctx.translate(Math.round(xPixel) + size, Math.round(yPixel));
                ctx.scale(-1, 1);
            } else {
                ctx.translate(Math.round(xPixel), Math.round(yPixel));
            }
            ctx.drawImage(img, 0, 0, size, size);
            ctx.restore(); // Restaure le contexte normal
        } else {
            // fallback si l'image ne se charge pas
            ctx.fillStyle = "white";
            ctx.fillRect(Math.round(xPixel), Math.round(yPixel), tailleBloc, tailleBloc);
        }
    }    
}

// Fonction de sauvegarde
function sauvegarder() {
    const data = {
        scores,
        actions,
        monMonde: compresserMonde(monMonde),
        playerLocalisation,
        mesMobs,
        physique,
        monInventaire
    };
    localStorage.setItem("sauvegarde", JSON.stringify(data));
    console.log("💾 Données sauvegardées !");
}

// Fonction de clic sur le canvas
function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left - 10;
    const clickY = event.clientY - rect.top - 10;

    // Taille d’un bloc
    const blocSize = tailleBloc;

    // Calcul de la position caméra
    const [playerX, playerY] = playerLocalisation;
    const cameraX = Math.round(playerX);
    const cameraY = Math.round(playerY);

    const demiLargeur = Math.floor(canvas.width / (2 * blocSize));
    const demiHauteur = Math.floor(canvas.height / (2 * blocSize));

    const xDebut = cameraX - demiLargeur;
    const yDebut = cameraY + demiHauteur;

    const xOffset = (playerX - cameraX) * blocSize;
    const yOffset = (cameraY - playerY) * blocSize;
    
    const blocX = Math.floor((clickX + xOffset) / blocSize) + xDebut;
    const blocY = yDebut - Math.floor((clickY + yOffset) / blocSize);    

    // Vérifie si ce bloc est adjacent
    const dx = Math.abs(blocX - Math.round(playerX));
    const dy = Math.abs(blocY - Math.round(playerY));
    const estAdjacent = (dx + dy <= 3);

    if (!estAdjacent) return;
    const bloc = getBlocAt(blocX, blocY);
    if (!bloc) return;
    // Vérifie si un des blocs voisins est du ciel ou de l'eau ou un arbre
    const voisins = [
        getBlocAt(blocX - 1, blocY), // gauche
        getBlocAt(blocX + 1, blocY), // droite
        getBlocAt(blocX, blocY - 1), // dessous
        getBlocAt(blocX, blocY + 1)  // dessus
    ];
    const voisinCielOuEau = voisins.some(b => b && (b.type === "ciel" || b.type === "eau" || b.type === "arbre"));

    if (voisinCielOuEau && !travaux) {
        ouvrirModaleBloc(bloc);
    }
}

// Fonction d'interaction avec les blocs
function ouvrirModaleBloc(bloc) {
    if (!objetPorte.id){
        const modale = document.getElementById("modale-bloc");
        const contenu = document.getElementById("contenu-bloc");
        modale.classList.remove("modale-cachee");
        let html = "";
        switch (bloc.type) {
            case "arbre":
                html = `
                    <h2>Arbre</h2>
                    <p>Un arbre majestueux.<br>
                        Tu peux le couper pour récupérer du bois,<br>
                        ou bien casser quelques branches.
                    </p>
                    <button onclick="contempler(${bloc.x}, ${bloc.y})">Contempler l'arbre</button>
                    <button onclick="couperArbre(${bloc.x}, ${bloc.y})">Couper l'arbre</button>
                    <button onclick="casserBranches(${bloc.x}, ${bloc.y})">Casser des branches</button>
                `;
                break;

            case "terre_herbeuse":
                html = `
                    <h2>Terre herbeuse</h2>
                    <p>De la terre... On pourrait creuser...</p>
                    <button onclick="contempler(${bloc.x}, ${bloc.y})">Contempler la terre</button>
                    <button onclick="creuserTerre(${bloc.x}, ${bloc.y})">Creuser</button>
                `;
                break;

            case "terre":
                html = `
                    <h2>Terre</h2>
                    <p>De la terre... On pourrait creuser...</p>
                    <button onclick="contempler(${bloc.x}, ${bloc.y})">Contempler la terre</button>
                    <button onclick="creuserTerre(${bloc.x}, ${bloc.y})">Creuser</button>
                `;
                break;

            case "sable":
                html = `
                    <h2>Sable</h2>
                    <p>Du sable... On pourrait creuser...</p>
                    <button onclick="contempler(${bloc.x}, ${bloc.y})">Contempler le sable</button>
                    <button onclick="creuserSable(${bloc.x}, ${bloc.y})">Creuser</button>
                `;
                break;

            case "roche":
                html = `
                    <h2>Roche</h2>
                    <p>Un rocher solide. Ça sent le coup de pioche !</p>
                    <button onclick="contempler(${bloc.x}, ${bloc.y})">Contempler la roche</button>
                    <button onclick="minerRocher(${bloc.x}, ${bloc.y})">Miner</button>
                `;
                break;

            case "bois":
                html = `
                    <h2>Pile de bois</h2>
                    <p>Du bois bien empilé</p>
                    <button onclick="contempler(${bloc.x}, ${bloc.y})">Contempler la pile de bois</button>
                    <button onclick="ramasserBois(${bloc.x}, ${bloc.y})">Ramasser</button>
                `;
                break;

            case "laine":
                html = `
                    <h2>Laine</h2>
                    <p>Une belle laine</p>
                    <button onclick="contempler(${bloc.x}, ${bloc.y})">Contempler la laine</button>
                    <button onclick="ramasserLaine(${bloc.x}, ${bloc.y})">Ramasser</button>
                `;
                break;

            case "lait":
                html = `
                    <h2>Lait</h2>
                    <p>Un seau de lait</p>
                    <button onclick="contempler(${bloc.x}, ${bloc.y})">Contempler le seau</button>
                    <button onclick="ramasserLait(${bloc.x}, ${bloc.y})">Ramasser</button>
                `;
                break;

            case "charbon":
            case "cuivre":
            case "fer":
            case "or":
            case "diamant":
                html = `
                    <h2>${bloc.type}</h2>
                    <p>Minerais de ressource rare</p>
                    <button onclick="contempler(${bloc.x}, ${bloc.y})">Contempler le minerais</button>
                    <button onclick="piocher('${bloc.type}', ${bloc.x}, ${bloc.y})">Piocher</button>
                `;
                break;

            default:
                html = `
                    <h2>${bloc.type}</h2>
                    <p>C'est beau !</p>
                    <button onclick="contempler(${bloc.x}, ${bloc.y})">Contempler les lieux</button>
                `;
                break;
        }
        contenu.innerHTML = html;
    }
    else {
        switch (bloc.type) {
            case "vide": case "ciel": case "eau":
                const [x, y] = playerLocalisation;
                const dx = x - bloc.x;
                const dy = y - bloc.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 1) {
                    bloc.type = objetPorte.id;
                    objetPorte.quantite -= 1;
                    const item = monInventaire[indexSelectionne];
                    item.quantite -= 1;
                    if (item.quantite === 0) {
                        item.id = null;
                        objetPorte.id = null;
                        itemSelectionne = null;
                        indexSelectionne = null;
    
                        curseur.style.display = "none";
                        document.body.style.cursor = "default";
                    }

                    majAffichageInventaire();
                }
                break;
        }
    }
}

// Modale d'action

// Fonction pour tondre les moutons
function tondreLesMoutons(x, y) {
    travaux = true;
    console.log("Tu tonds le mouton en", x, y);
    fermerModaleMobs();
    afficherBarreDeProgression(() => {
        ajouterObjetDansInventaire("laine", 1);
    });
}

// Fonction pour traire les moutons
function traireLeMouton(x, y) {
    travaux = true;
    console.log("Tu trais le mouton en", x, y);
    fermerModaleMobs();
    afficherBarreDeProgression(() => {
        ajouterObjetDansInventaire("lait", 1);
    });
}

// Fonction d'action couper un arbre
function couperArbre(x, y) {
    travaux = true;
    console.log("Tu coupes l’arbre en", x, y);
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("bois", 20);
    });
}
// Fonction d'action casser une branche
function casserBranches(x, y) {
    travaux = true;
    console.log("Tu casses des branches en", x, y);
    fermerModale();
    afficherBarreDeProgression(() => {
        ajouterObjetDansInventaire("bois", 1);
    });
}
// Fonction d'action miner un rocher
function minerRocher(x, y) {
    travaux = true;
    console.log("Tu mines le rocher en", x, y);
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("roche", 1);
    });
}
// Fonction d'action creuser de la terre
function creuserTerre(x, y) {
    travaux = true;
    console.log("Tu creuses la terre en", x, y);
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("terre", 1);
    });
}
// Fonction d'action creuser du sable
function creuserSable(x, y) {
    travaux = true;
    console.log("Tu creuses le sable en", x, y);
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("sable", 1);
    });
}
// Fonction d'action ramasser le bois
function ramasserBois(x, y) {
    travaux = true;
    console.log("Tu ramasses le bois", x, y);
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("bois", 1);
    });
}
// Fonction d'action ramasser la laine
function ramasserLaine(x, y) {
    travaux = true;
    console.log("Tu ramasses la laine", x, y);
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("laine", 1);
    });
}
// Fonction d'action ramasser le lait
function ramasserLait(x, y) {
    travaux = true;
    console.log("Tu ramasses le seau de lait", x, y);
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("lait", 1);
    });
}
// Fonction d'action piocher minerais
function piocher(type, x, y) {
    travaux = true;
    console.log("Tu pioches le minerais", x, y);
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire(type, 1);
    });
}
// Fonction d'action contempler
function contempler(x, y) {
    travaux = true;
    console.log("Tu contemples les lieux", x, y);
    fermerModale();
    afficherBarreDeProgression(() => {

    });
}

// Fonction d'action observer
function observer(x, y) {
    travaux = true;
    console.log("Tu observes l'animal", x, y);
    fermerModaleMobs();
    afficherBarreDeProgression(() => {

    });
}
//  Fermer la modale d'action
function fermerModale() {
    document.getElementById("modale-bloc").classList.add("modale-cachee");
}

// Barre de progression des travaux
function afficherBarreDeProgression(callback) {
    const container = document.getElementById("progress-container");
    const bar = document.getElementById("progress-bar");
    container.style.display = "block";
    bar.style.width = "0%";

    let width = 0;
    const duration = 2000; // 2 secondes
    const intervalTime = 50; // toutes les 50ms
    const increment = 100 / (duration / intervalTime);

    const interval = setInterval(() => {
        width += increment;
        bar.style.width = width + "%";

        if (width >= 100) {
            clearInterval(interval);
            container.style.display = "none";
            callback();
            travaux = false;
        }
    }, intervalTime);
}

// Fonction de changement d'état du bloc
function remplacerBlocParCiel(x, y, monde) {
    const bloc = monde.find(b => b.x === x && b.y === y);
    if (!bloc) {
        console.warn(`Aucun bloc trouvé en (${x}, ${y}).`);
        return;
    }

    // Vérifie les voisins pour détecter l'eau
    const voisins = [
        monde.find(b => b.x === x - 1 && b.y === y),     // gauche
        monde.find(b => b.x === x + 1 && b.y === y),     // droite
        monde.find(b => b.x === x && b.y === y + 1)      // au-dessus
    ];

    const voisinAEau = voisins.some(b => b && b.type === "eau");

    // Remplacement principal
    bloc.type = voisinAEau ? "eau" : "ciel";
    console.log(`Le bloc en (${x}, ${y}) a été remplacé par ${bloc.type}.`);

    // Si on vient de placer de l'eau, propager autour
    if (bloc.type === "eau") {
        propagerDeEau(x, y, monde);
    } else {
        // Sinon comportement par défaut (comme avant)
        const blocDessous = monde.find(b => b.x === x && b.y === y - 1);
        if (blocDessous && (blocDessous.type === "vide" || blocDessous.type === "ciel")) {
            blocDessous.type = "ciel";
            console.log(`Le bloc en dessous (${x}, ${y - 1}) remplacé par un bloc de ciel.`);
        }
    }
}

// Fonction pour propager l'eau vers bas/gauche/droite
function propagerDeEau(x, y, monde) {
    const directions = [
        { dx: 0, dy: -1 }, // bas
        { dx: -1, dy: 0 }, // gauche
        { dx: 1, dy: 0 }   // droite
    ];

    for (const { dx, dy } of directions) {
        const voisin = monde.find(b => b.x === x + dx && b.y === y + dy);
        if (voisin && (voisin.type === "vide" || voisin.type === "ciel")) {
            voisin.type = "eau";
            console.log(`Propagation de l'eau en (${voisin.x}, ${voisin.y}).`);
            propagerDeEau(voisin.x, voisin.y, monde); // propagation récursive
        }
    }
}

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

// Fonction d'impacte des actions selon le temps
function getTimeWeight(currentTurn, actionTurn, decayRate) {
    const age = currentTurn - actionTurn;
    return Math.exp(-decayRate * age);
}

// Fonciton de calcul du score par Dieu
function calculerScoreDieu(actions, dieu, currentTurn) {
    const decayRate = decayRates[dieu];
    return actions
        .filter(a => a.dieu === dieu)
        .reduce((score, action) => {
        const poids = getTimeWeight(currentTurn, action.tour, decayRate);
        return score + action.valeur * poids;
        }, 0);
}

// Fonction de mise à jour des scores
function mettreAJourScores(actions, currentTurn) {
    for (const dieu in scores) {
      scores[dieu] = calculerScoreDieu(actions, dieu, currentTurn);
    }
}

// Fonction d'affichage des scores
function afficherScores(scores) {
    for (const dieu in scores) {
        const score = scores[dieu];
        const verdict = score > 100 ? "💖 Accepté" : "❌ Rejeté";
        console.log(`${dieu}: ${score.toFixed(2)} → ${verdict}`);
    }
}

// Fonction de calcul du jugement dernier
function calculerJugement(scores) {
    const seuil = 100;
    const dieuxSatisfaits = Object.values(scores).filter(score => score > seuil).length;
  
    if (dieuxSatisfaits >= 4) {
      return {
        resultat: "Paradisiaque",
        message: "Tu as été accepté par suffisamment de Dieux. Tu accèdes au Paradis."
      };
    } else {
      return {
        resultat: "Rejeté",
        message: "Moins de 4 Dieux t'ont accepté. Tu es rejeté et peux retenter ta survie."
      };
    }
}

// Fonction de sauvegarde de la partie
function sauvegarderPartie() {
    const sauvegardeData = {
        scores,
        actions,
        monMonde: compresserMonde(monMonde),
        playerLocalisation,
        mesMobs,
        physique,
        monInventaire
    };
    localStorage.setItem("sauvegarde", JSON.stringify(sauvegardeData));
    console.log("💾 Partie sauvegardée !");
}

// Fonction d'export sur json
function exporterJSON(scores, verdict) {
    const data = {
        timestamp: new Date().toISOString(),
        scores,
        verdict
    };
  
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = "jugement_final.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Simulation d’un jugement au tour 150
// const currentTurn = 150;
// mettreAJourScores(actions, currentTurn);
// afficherScores(scores);
// const verdict = calculerJugement(scores);
// console.log("\nJugement Final :", verdict.message);
// exporterJSON(scores, verdict);