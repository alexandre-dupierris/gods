// Fonction pour vérifier si un bloc est solide
function estBlocSolide(type) {
    return physique.blocSolides.includes(type);
}

// Fonction pour obtenir un bloc à une position donnée
function getBlocAt(x, y) {
    return monMonde.find(bloc => bloc.x === x && bloc.y === y);
}

// Fonction de mise à jour de l'herbe et des légumes
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
                if (blocDessus && ["ciel", "vide", "eau", "arbre", "lait", "graine", "graine_de_legume", "graine_de_plante", "legume", "plante"].includes(blocDessus.type)) {

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
                    
                    if (herbeVoisine && Math.random() < 0.08) {
                        
                        bloc.type = "terre_herbeuse";
                    }
                }
            }
            else if (bloc && bloc.type === "terre_labouree"){
                if (blocDessus && blocDessus.type === "graine") {
                    if (Math.random() < 0.01) {
                        blocDessus.type = "legume";
                    }
                    else if (Math.random() < 0.02) {
                        blocDessus.type = "plante";
                    }
                }
                if (blocDessus && blocDessus.type === "graine_de_legume") {
                    if (Math.random() < 0.02) {
                        blocDessus.type = "legume";
                    }
                }
                if (blocDessus && blocDessus.type === "graine_de_plante") {
                    if (Math.random() < 0.02) {
                        blocDessus.type = "plante";
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
    return voisins.some(b => b && ["ciel", "arbre", "eau", "lait", "bois", "laine", "graine", "legume", "graine_de_legume", "graine_de_plante", "plante"].includes(b.type));
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
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler l'arbre</button>
                    <button onclick="couperArbre(${bloc.x}, ${bloc.y})">Couper l'arbre</button>
                    <button onclick="casserBranches(${bloc.x}, ${bloc.y})">Casser des branches</button>
                `;
                break;

            case "terre_herbeuse":
                html = `
                    <h2>Terre herbeuse</h2>
                    <p>De la terre... On pourrait creuser...</p>
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler l'herbe</button>
                    <button onclick="creuserTerre(${bloc.x}, ${bloc.y})">Creuser</button>
                    <button onclick="labourerTerre(${bloc.x}, ${bloc.y})">Labourer</button>
                `;
                break;

            case "terre":
                html = `
                    <h2>Terre</h2>
                    <p>De la terre... On pourrait creuser...</p>
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler la terre</button>
                    <button onclick="creuserTerre(${bloc.x}, ${bloc.y})">Creuser</button>
                    <button onclick="labourerTerre(${bloc.x}, ${bloc.y})">Labourer</button>
                `;
                break;

            case "terre_labouree":
                html = `
                    <h2>Terre labourée</h2>
                    <p>De la terre... On pourrait creuser...</p>
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler la terre</button>
                    <button onclick="creuserTerre(${bloc.x}, ${bloc.y})">Creuser</button>
                `;
                break;

            case "legume":
                html = `
                    <h2>Légumes</h2>
                    <p>De bons légumes, pourquoi ne pas les cueillir ?</p>
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler les légumes</button>
                    <button onclick="cueillirLegumes(${bloc.x}, ${bloc.y})">Cueillir</button>
                `;
                break;

            case "plante":
                html = `
                    <h2>Plante</h2>
                    <p>Une magnifique plante</p>
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler la plante</button>
                    <button onclick="cueillirPlante(${bloc.x}, ${bloc.y})">Cueillir</button>
                `;
                break;

            case "sable":
                html = `
                    <h2>Sable</h2>
                    <p>Du sable... On pourrait creuser...</p>
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler le sable</button>
                    <button onclick="creuserSable(${bloc.x}, ${bloc.y})">Creuser</button>
                `;
                break;

            case "roche":
                html = `
                    <h2>Roche</h2>
                    <p>Un rocher solide. Ça sent le coup de pioche !</p>
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler la roche</button>
                    <button onclick="minerRocher(${bloc.x}, ${bloc.y})">Miner</button>
                `;
                break;

            case "bois":
                html = `
                    <h2>Pile de bois</h2>
                    <p>Du bois bien empilé</p>
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler la pile de bois</button>
                    <button onclick="ramasserBois(${bloc.x}, ${bloc.y})">Ramasser</button>
                `;
                break;

            case "laine":
                html = `
                    <h2>Laine</h2>
                    <p>Une belle laine</p>
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler la laine</button>
                    <button onclick="ramasserLaine(${bloc.x}, ${bloc.y})">Ramasser</button>
                `;
                break;

            case "lait":
                html = `
                    <h2>Lait</h2>
                    <p>Un seau de lait</p>
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler le seau</button>
                    <button onclick="ramasserLait(${bloc.x}, ${bloc.y})">Ramasser</button>
                `;
                break;

            case "graine":
            case "graine_de_legume":
            case "graine_de_plante":
                html = `
                    <h2>Graine</h2>
                    <p>Une graine plantée là</p>
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler la graine</button>
                    <button onclick="ramasserGraine('${bloc.type}', ${bloc.x}, ${bloc.y})">Ramasser</button>
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
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler le minerais</button>
                    <button onclick="piocher('${bloc.type}', ${bloc.x}, ${bloc.y})">Piocher</button>
                `;
                break;

            default:
                html = `
                    <h2>${bloc.type}</h2>
                    <p>C'est beau !</p>
                    <button onclick="contempler('${bloc.type}', ${bloc.x}, ${bloc.y})">Contempler les lieux</button>
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
                        return distanceMob < 1; // Rayon de sécurité
                    });
                    if (mobPresent) break; // Annule la pose si un mob est là
    
                    // Vérification spéciale pour planter un arbre
                    if (objetPorte.id === "arbre") {
                        const blocDessous = getBlocAt(bloc.x, bloc.y - 1); // fonction pour récupérer le bloc sous celui-ci
                        if (!blocDessous || (blocDessous.type !== "terre" && blocDessous.type !== "terre_herbeuse")) {
                            afficherNotification("Les arbres ne peuvent être plantés que sur de la terre...");
                            break; // Si pas de terre/terre_herbeuse en dessous, annule la pose
                        }
                    }
                    // Vérification spéciale pour poser des graines, ou du lait
                    if (objetPorte.id === "graine" || objetPorte.id === "lait" || objetPorte.id === "graine_de_legume" || objetPorte.id === "graine_de_plante") {
                        if (bloc.type === "eau") {
                            afficherNotification("Cela doit être posé sur la terre ferme...");
                            break;
                        }
                    }
                    // Vérification spéciale pour une plante
                    if (objetPorte.id === "plante") {
                        afficherNotification("On ne peut pas replanter ça...");
                        break;
                    }
    
                    bloc.type = objetPorte.id;
                    objetPorte.quantite -= 1;
                    const item = monInventaire[indexSelectionne];
                    item.quantite -= 1;
                    if (item.quantite <= 0) {
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

    // Si on vient de placer de l'eau, propager autour
    if (bloc.type === "eau") {
        propagerDeEau(x, y, monde);
    } else {
        // Sinon comportement par défaut (comme avant)
        const blocDessous = monde.find(b => b.x === x && b.y === y - 1);
        if (blocDessous && (blocDessous.type === "vide" || blocDessous.type === "ciel")) {
            blocDessous.type = "ciel";
        }
    }
}