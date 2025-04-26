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
    afficherBarreDeProgression(() => {});
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
function contempler(type, x, y) {
    travaux = true;
    console.log("Tu contemples les lieux", x, y);
    fermerModale();
    afficherBarreDeProgression(() => {
        if (type === "arbre") {
            if (Math.random() < 1/3) {
                ajouterObjetDansInventaire("fruit", 1);
                afficherNotification("🍏 Tu as trouvé un fruit !");
            }
            else {
                afficherNotification("Cet arbre doit cacher quelques fruits...");
            }
        }
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