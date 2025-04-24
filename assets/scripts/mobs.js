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
        <button onclick="tuerLeMouton(${mouton.x}, ${mouton.y})">Tuer le mouton</button>
    `;
    
    contenu.innerHTML = html;
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

// Fonction pour vérifier si un mob est dans l'eau
function mobEstDansEau(mob) {
    const bloc = getBlocAt(Math.floor(mob.x), Math.floor(mob.y));
    return bloc && bloc.type === "eau";
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

// Fonction d'update des mobs
function updateMobs() {
    const maintenant = Date.now();
    for (const mob of mesMobs) {
        const dansEau = mobEstDansEau(mob);
        const vitesseFacteur = dansEau ? 0.3 : 1.0; // Réduit la vitesse à 30% dans l'eau
        
        // Comportement spécial dans l'eau : chercher le bord
        if (dansEau && maintenant > (mob.prochainChangementDirectionEau || 0)) {
            // Définir le prochain moment pour changer de direction dans l'eau
            mob.prochainChangementDirectionEau = maintenant + 3000 + Math.random() * 2000;
            
            const maxDistance = 15; // combien de blocs max on cherche autour
            let trouveSortieAGauche = false;
            let trouveSortieADroite = false;

            // Cherche à gauche
            for (let i = 1; i <= maxDistance; i++) {
                const bloc = getBlocAt(Math.floor(mob.x) - i, Math.floor(mob.y));
                if (!bloc || !bloc.estEau) {
                    trouveSortieAGauche = true;
                    break;
                }
            }

            // Cherche à droite
            for (let i = 1; i <= maxDistance; i++) {
                const bloc = getBlocAt(Math.floor(mob.x) + i, Math.floor(mob.y));
                if (!bloc || !bloc.estEau) {
                    trouveSortieADroite = true;
                    break;
                }
            }

            // Choisit la direction vers la sortie la plus proche
            if (trouveSortieAGauche && !trouveSortieADroite) {
                mob.direction = "gauche";
            } else if (trouveSortieADroite && !trouveSortieAGauche) {
                mob.direction = "droite";
            } else if (trouveSortieAGauche && trouveSortieADroite) {
                // Les deux côtés sont valides : aller vers le plus proche
                mob.direction = Math.random() < 0.5 ? "gauche" : "droite";
            }
        }

        // Appliquer la gravité modifiée
        if (!mob.estAuSol) {
            const facteur = dansEau ? 0.05 : 1.0; // Réduit encore plus la gravité dans l'eau
            mob.velociteY -= 0.05 * facteur;
            mob.velociteY = Math.max(mob.velociteY, -0.3);
        }
        // Flottaison dans l'eau
        if (dansEau) {
            // Force de flottaison - les moutons flottent naturellement
            // Pousse constamment vers le haut pour contrer la gravité
            mob.velociteY += 0.04; // Force constante vers le haut
            
            // Limite la vitesse verticale uniquement si ce n’est pas un saut actif
            if (!mob.vientDeSauter) {
                mob.velociteY = Math.max(-0.1, Math.min(0.1, mob.velociteY));
            }

            
            // Amortissement pour éviter les mouvements brusques
            mob.velociteY *= 0.9;
        }
        if (maintenant > mob.prochainEtat) {
            mob.actif = !mob.actif; // alterne actif/immobile
            mob.prochainEtat = maintenant + 1000 + Math.random() * 3000;
        }

        // Changement de direction seulement hors de l'eau
        if (!dansEau && maintenant > mob.prochainChangementDirection) {
            mob.direction = mob.direction === "droite" ? "gauche" : "droite";
            mob.prochainChangementDirection = maintenant + 1000 + Math.random() * 3000;
        }

        // Mouvement horizontal
        if (mob.actif) {
            const directionX = mob.direction === "droite" ? 1 : -1;
            // Applique le facteur de vitesse pour l'eau
            const nouvelX = mob.x + directionX * mob.vitesseX * vitesseFacteur;
        
            if (!detecterCollision(nouvelX, mob.y, mob.direction)) {
                mob.x = nouvelX;
            } else {
                // Ne retourne que si le mob est hors de l'eau
                // Si dans l'eau, ne rien faire (le changement de direction est géré ailleurs)
                if (!dansEau) {
                    const peutSauter = mob.estAuSol && Math.random() < 0.8;
            
                    // Tentative de monter s'il y a un bloc juste au-dessus mais libre au-dessus de celui-ci
                    const dirX = mob.direction === "droite" ? 1 : -1;
                    const blocDevant = getBlocAt(Math.floor(mob.x + dirX * 2), Math.floor(mob.y));
                    const blocAuDessus = getBlocAt(Math.floor(mob.x + dirX * 2), Math.floor(mob.y + 1));
                    const espaceLibre = !blocAuDessus || !estBlocSolide(blocAuDessus.type);
            
                    if (peutSauter && blocDevant && estBlocSolide(blocDevant.type) && espaceLibre) {
                        mob.velociteY = 0.5 + Math.random() * 0.2;
                        mob.estAuSol = false;
                        mob.dernierSaut = Date.now();
                    } else {
                        mob.direction = mob.direction === "droite" ? "gauche" : "droite";
                    }
                }
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
        
        // Vérifie s'il est vraiment au sol
        mob.estAuSol = mobEstAuSol(mob);
        
       // Saut aléatoire avec ajustement pour l'eau
       if ((mob.estAuSol || dansEau) && maintenant - mob.dernierSaut > 1000 + Math.random() * 1000) {
            // Force de saut plus importante dans l'eau
            if (dansEau) {
                mob.velociteY = 0.6 + Math.random() * 0.3; // Saut plus puissant dans l'eau
            } else {
                mob.velociteY = 0.3 + Math.random() * 0.2; // Saut normal sur terre
            }
            mob.estAuSol = false;
            mob.dernierSaut = maintenant;
            mob.vientDeSauter = true;
            setTimeout(() => {
                mob.vientDeSauter = false;
            }, 200);
        }
    }
}