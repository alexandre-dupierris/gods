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

// Fonction d'indexation du monde pour éviter les lags
function getBlocAt(x, y) {
    return indexMonde[`${x},${y}`];
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

// Fonction de génération d'un monde
function genererMonde() {
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
            const optionsSansEau = ["terre_herbeuse", "sable", "roche"];
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
                    type = Math.random() < 0.34 ? "arbre" : "ciel";
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

// Fonction d'affichage du monde
function afficherMonde(monMonde) {
    canvas = document.getElementById("mondeCanvas");
    canvas.addEventListener("click", handleCanvasClick);
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // couleur du ciel
    // Créer un dégradé vertical du haut (y=0) vers le bas (y=canvas.height)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    // Couleurs en fonction de la couleur du ciel (ex : matin, jour, soir, nuit)
    // Transition douce du ciel
    const [nouveauHaut, nouveauBas] = getSkyGradient(tempsJeu);

    // Interpolation douce (t = vitesse de transition, plus petit = plus fluide)
    const t = 0.01;
    ancienneCouleurHaut = interpoleCouleur(ancienneCouleurHaut, nouveauHaut, t);
    ancienneCouleurBas = interpoleCouleur(ancienneCouleurBas, nouveauBas, t);

    gradient.addColorStop(0, ancienneCouleurHaut);
    gradient.addColorStop(1, ancienneCouleurBas);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    // Soleil
    const tempsSoleil = getProgressionDuJour(tempsJeu);
    drawSoleil(tempsSoleil, ctx, canvas);
    // Lune
    const tempsLune = getProgressionDeLaNuit(tempsJeu);
    drawLune(tempsLune, ctx, canvas);

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
    
            if (img && img.complete && typeAffiche !== "ciel") {
                const xOffset = (playerX - cameraX) * tailleBloc;
                const yOffset = (cameraY - playerY) * tailleBloc;
    
                const xPixel = (bloc.x - xDebut) * tailleBloc - xOffset;
                const yPixel = (yDebut - bloc.y) * tailleBloc - yOffset;
    
                ctx.drawImage(img, Math.round(xPixel), Math.round(yPixel), tailleBloc, tailleBloc);
            }
        }
    }

    // Dessiner le joueur toujours exactement au centre
    ctx.fillStyle = "#A67B5B";
    const xPixelJoueur = demiLargeurCanvas * tailleBloc;
    const yPixelJoueur = demiHauteurCanvas * tailleBloc;
    
    // Vérifier si le joueur est dans l'eau pour un effet visuel
    const dansEau = estDansEau(playerX, playerY);
    
    // Taille du joueur
    const tailleJoueur = tailleBloc * 1.05;
    // Décalage pour centrer le joueur
    const decalage = (tailleBloc - tailleJoueur) / 2;

    // Couleur du joueur (teinte bleutée dans l'eau)
    ctx.fillStyle = dansEau ? "#7B93A6" : "#A67B5B";
    // Dessin du joueur
    drawRoundedRect(ctx, xPixelJoueur + decalage, yPixelJoueur + decalage, tailleJoueur, tailleJoueur, 10); // 10 = rayon des coins
    
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

    const opacite = getDarknessOpacity(tempsJeu);
    ctx.fillStyle = `rgba(0, 0, 0, ${opacite})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}