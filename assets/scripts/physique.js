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
    if (dansEau) {
        physique.velocite.y = Math.max(physique.velocite.y, -physique.vitesseMax * 0.5);
    }
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
    if (touches.z && (physique.estAuSol || dansEau) && (maintenant - dernierSaut > 333)) {
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

    // Gestion de savoir si le joueur est au sol
    if (
        distanceAuSol < 0.2 &&
        (
            (piedsGauche && estBlocSolide(piedsGauche.type)) ||
            (piedsDroit && estBlocSolide(piedsDroit.type))
        )
    ) {
        physique.estAuSol = true;
    }

    // Système d'apnée
    apneeEtNourriture(dansEau);

    // Position du joueur
    playerLocalisation = [x, y];

    // Gestion de fermeture des modales si on a bougé
    if (oldX !== x || oldY !== y) {
        fermerModale();
        fermerModaleMobs();
    }
}

// Fonction de détection de collision
function detecterCollision(x, y, direction) {
    // direction peut être "haut", "bas", "gauche", "droite" ou undefined pour tous

    // Positions à vérifier pour la collision avec hitbox
    const positions = [
        [Math.floor(x), Math.floor(y)],   // coin supérieur gauche
        [Math.ceil(x), Math.floor(y)],    // coin supérieur droit
        [Math.floor(x), Math.ceil(y)],    // coin inférieur gauche
        [Math.ceil(x), Math.ceil(y)]      // coin inférieur droit
    ];

    // Si on saute vers le haut
    if (direction === "haut") {
        // Vérifier les coins supérieurs pour les collisions en haut
        positions[0][1] = Math.floor(y);
        positions[1][1] = Math.floor(y);
    }
    
    for (const [checkX, checkY] of positions) {
        const bloc = getBlocAt(checkX, checkY);
        if (bloc && estBlocSolide(bloc.type)) {
            return true;
        }
    }
    
    return false;
}