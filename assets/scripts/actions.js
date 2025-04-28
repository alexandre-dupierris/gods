// Fonction pour tondre les moutons
function tondreLesMoutons(x, y) {
    travaux = true;
    fermerModaleMobs();
    afficherBarreDeProgression(() => {
        ajouterObjetDansInventaire("laine", 1);
        afficherNotification("Tu as tondu le mouton.");
    });
}

// Fonction pour traire les moutons
function traireLeMouton(x, y) {
    travaux = true;
    fermerModaleMobs();
    afficherBarreDeProgression(() => {
        ajouterObjetDansInventaire("lait", 1);
        afficherNotification("Tu as trait le mouton.");
    });
}

// Fonction pour tuer les moutons
function tuerLeMouton(x, y) {
    travaux = true;
    const rayon = 5; // tolérance
    for (let i = 0; i < mesMobs.length; i++) {
        const mob = mesMobs[i];
        if (mob.type === "mouton") {
            const distance = Math.sqrt((mob.x - x) ** 2 + (mob.y - y) ** 2);
            if (distance < rayon) {
                afficherNotification("Tu as tué un mouton.");
                ajouterObjetDansInventaire("viande", 16);
                mesMobs.splice(i, 1);
                moutonTrouve = true;
                break;
            }
        }
    }
    if (!moutonTrouve) {
        afficherNotification("Le mouton s'en est tiré cette fois-ci...");
    }
    fermerModaleMobs();
    afficherBarreDeProgression(() => {

    });
}

// Fonction d'action nourrir le mounton
function nourrirLeMouton(x, y){
    const planteDispo = utiliserPlante();
    fermerModaleMobs();
    if (planteDispo) {
        travaux = true;
        afficherNotification("Tu nourris le mouton...");
        afficherBarreDeProgression(() => {
            if (Math.random() < 1/3) {
                mesMobs.push({
                    type: "mouton",
                    x,
                    y,
                    direction: Math.random() < 0.5 ? "gauche" : "droite",
                    actif: Math.random() < 0.5,
                    vitesseX: 0.05,
                    velociteY: 0,
                    estAuSol: false,
                    dernierSaut: 0,
                    prochainChangementDirection: Date.now() + 1000 + Math.random() * 4000,
                    prochainEtat: Date.now() + 1000 + Math.random() * 3000
                });
                afficherNotification("Un nouveau mouton est né !");
            }
        });
    }
    else {
        afficherNotification("Il faut des plantes pour le nourrir...");
    }
}

// Fonction d'action couper un arbre
function couperArbre(x, y) {
    travaux = true;
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("bois", 20);
        afficherNotification("Tu as coupé l'arbre...");
    });
}
// Fonction d'action casser une branche
function casserBranches(x, y) {
    travaux = true;
    fermerModale();
    afficherBarreDeProgression(() => {
        ajouterObjetDansInventaire("bois", 1);
        afficherNotification("Tu as cassé une branche.");
    });
}
// Fonction d'action miner un rocher
function minerRocher(x, y) {
    travaux = true;
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("roche", 1);
        afficherNotification("Tu as miné un rocher.");
    });
}
// Fonction d'action creuser de la terre
function creuserTerre(x, y) {
    travaux = true;
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("terre", 1);
        afficherNotification("Tu as creusé la terre.");
        const blocDessus = getBlocAt(x, y + 1);
        if (blocDessus.type === "arbre"){
            remplacerBlocParCiel(x, y + 1, monMonde);
            ajouterObjetDansInventaire("bois", 10);
        }
        if (blocDessus.type === "legume"){
            remplacerBlocParCiel(x, y + 1, monMonde);
            ajouterObjetDansInventaire("legume", 4);
        }
        if (blocDessus.type === "graine"){
            remplacerBlocParCiel(x, y + 1, monMonde);
            ajouterObjetDansInventaire("graine", 1);
        }
    });
}
// Fonction d'action labourer la terre
function labourerTerre(x, y) {
    travaux = true;
    fermerModale();
    afficherBarreDeProgression(() => {
        const terre_labouree = getBlocAt(x, y);
        terre_labouree.type = "terre_labouree";
        afficherNotification("Tu as labouré la terre.");
    });
}
// Fonction d'action cueillir les légumes
function cueillirLegumes(x, y) {
    travaux = true;
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        const arrondi = Math.floor(Math.random() * 4) + 1;
        ajouterObjetDansInventaire("legume", (8 - arrondi));
        ajouterObjetDansInventaire("graine_de_legume", arrondi);
        afficherNotification("Tu as cueilli des graines et légumes.");
    });
}
// Fonction d'action cueillir la plante
function cueillirPlante(x, y) {
    travaux = true;
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        const arrondi = Math.floor(Math.random() * 2 + 1);
        ajouterObjetDansInventaire("plante", 1);
        ajouterObjetDansInventaire("graine_de_plante", arrondi);
        afficherNotification("Tu as cueilli des graines et la plante.");
    });
}
// Fonction d'action creuser du sable
function creuserSable(x, y) {
    travaux = true;
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("sable", 1);
        afficherNotification("Tu as creusé le sable.");
    });
}
// Fonction d'action ramasser le bois
function ramasserBois(x, y) {
    travaux = true;
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("bois", 1);
        afficherNotification("Tu as ramassé du bois.");
    });
}
// Fonction d'action ramasser la laine
function ramasserLaine(x, y) {
    travaux = true;
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("laine", 1);
        afficherNotification("Tu as ramassé la laine.");
    });
}
// Fonction d'action ramasser le lait
function ramasserLait(x, y) {
    travaux = true;
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire("lait", 1);
        afficherNotification("Tu as ramassé le seau de lait.");
    });
}
// Fonction d'action ramasser une graine
function ramasserGraine(type, x, y) {
    travaux = true;
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire(type, 1);
        afficherNotification("Tu as ramassé la graine.");
    });
}
// Fonction d'action piocher minerais
function piocher(type, x, y) {
    travaux = true;
    fermerModale();
    afficherBarreDeProgression(() => {
        remplacerBlocParCiel(x, y, monMonde);
        ajouterObjetDansInventaire(type, 1);
        afficherNotification("Tu as pioché le minerais.");
    });
}
// Fonction d'action contempler
function contempler(type, x, y) {
    travaux = true;
    afficherNotification("Tu contemples les lieux...");
    fermerModale();
    afficherBarreDeProgression(() => {
        if (type === "arbre") {
            if (Math.random() < 1/3) {
                ajouterObjetDansInventaire("fruit", 1);
                afficherNotification("Tu as trouvé un fruit !");
            }
            else if (Math.random() > 9/10) {
                ajouterObjetDansInventaire("arbre", 1);
                afficherNotification("Tu as trouvé une pousse d'arbre !");
            }
            else {
                afficherNotification("Cet arbre doit cacher quelques fruits...");
            }
        }
        if (type === "terre_herbeuse") {
            if (Math.random() < 1/3) {
                ajouterObjetDansInventaire("graine", 1);
                afficherNotification("Tu as trouvé une graine !");
            }
            else {
                afficherNotification("Il doit y avoir des graines dans cette herbe...");
            }
        }
    });
}

// Fonction d'action observer
function observer(x, y) {
    travaux = true;
    afficherNotification("Tu observes l'animal...");
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
    let [x, y] = playerLocalisation;
    bar.style.width = "0%";
    const dansEau = estDansEau(x, y);
    let width = 0;
    const duration = 1000; // 1 seconde
    const intervalTime = 50; // toutes les 50ms
    const increment = 100 / (duration / intervalTime);

    const interval = setInterval(() => {
        width += increment;
        bar.style.width = width + "%";
        if (dansEau) {
            joueur.air -= 0.4;
        }
        else {
            joueur.air = Math.min(joueur.air + 0.8, joueur.airMax);
        }
        if (width >= 100) {
            clearInterval(interval);
            container.style.display = "none";
            callback();
            travaux = false;
        }
    }, intervalTime);
}