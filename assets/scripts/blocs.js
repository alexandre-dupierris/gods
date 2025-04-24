// Fonction pour vérifier si un bloc est solide
function estBlocSolide(type) {
    return physique.blocSolides.includes(type);
}

// Fonction pour obtenir un bloc à une position donnée
function getBlocAt(x, y) {
    return monMonde.find(bloc => bloc.x === x && bloc.y === y);
}

// Fonction de mise à jour de l'herbe
function updateHerbe() {
    const maintenant = Date.now();
    if (maintenant - dernierTickHerbe < 10000) return;
    dernierTickHerbe = maintenant;
    for (let x = xMin; x < xMax; x++) {
        for (let y = yMax; y > -hauteur + 1; y--) {
            const bloc = getBlocAt(x, y);
            const blocDessus = getBlocAt(x, y + 1);
            if (bloc && bloc.type === "terre") {
                // Vérifier si au-dessus c'est exposé
                if (blocDessus && ["ciel", "vide", "eau", "arbre", "lait"].includes(blocDessus.type)) {

                    // Vérifie les voisins à gauche et à droite (haut, milieu, bas)
                    const voisinsHerbe = [
                        getBlocAt(x - 1, y + 1), // gauche haut
                        getBlocAt(x - 1, y),     // gauche milieu
                        getBlocAt(x - 1, y - 1), // gauche bas
                        getBlocAt(x + 1, y + 1), // droite haut
                        getBlocAt(x + 1, y),     // droite milieu
                        getBlocAt(x + 1, y - 1), // droite bas
                    ];

                    const herbeVoisine = voisinsHerbe.some(b => b && b.type === "terre_herbeuse");
                    
                    if (herbeVoisine && Math.random() < 0.1) {
                        
                        bloc.type = "terre_herbeuse";
                    }
                }
            }
        }
    }
}

// Fonction de calcul de l'exposition des blocs
function estExpose(bloc) {
    const voisins = [
        getBlocAt(bloc.x, bloc.y + 1), // haut
        getBlocAt(bloc.x, bloc.y - 1), // bas
        getBlocAt(bloc.x + 1, bloc.y), // droite
        getBlocAt(bloc.x - 1, bloc.y)  // gauche
    ];
    return voisins.some(b => b && ["ciel", "arbre", "eau", "lait", "bois", "laine"].includes(b.type));
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
                    <button onclick="contempler(${bloc.x}, ${bloc.y})">Contempler l'herbe</button>
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
                    // Vérifier qu'aucun mob n'occupe l'emplacement
                    const mobPresent = mesMobs.some(mob => {
                        const distanceMob = Math.hypot(mob.x - bloc.x - 0.5, mob.y - bloc.y - 0.5);
                        return distanceMob < 1; // Rayon de sécurité (ajuste si besoin)
                    });
                    if (mobPresent) break; // Annule la pose si un mob est là

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