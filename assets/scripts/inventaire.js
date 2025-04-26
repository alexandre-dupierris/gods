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
            // Trouver l'élément .case-inventaire le plus proche
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
            } else if (item.id) {
                if (item.id === "viande") {
                    // Nourrir le joueur
                    joueur.nourriture = Math.min(100, joueur.nourriture + 20);
                    
                    // Réduire la quantité de viande
                    item.quantite -= 1;
    
                    // Si la quantité tombe à 0, on vide la case
                    if (item.quantite <= 0) {
                        monInventaire[index] = { id: null, quantite: 0 };
                    }
    
                    // miseAJourAffichageInventaire();
                    majAffichageInventaire();
    
                }
                else if (item.id === "fruit") {
                    // Nourrir le joueur
                    joueur.nourriture = Math.min(100, joueur.nourriture + 5);
                    
                    // Réduire la quantité de viande
                    item.quantite -= 1;
    
                    // Si la quantité tombe à 0, on vide la case
                    if (item.quantite <= 0) {
                        monInventaire[index] = { id: null, quantite: 0 };
                    }
    
                    // miseAJourAffichageInventaire();
                    majAffichageInventaire();
                } else {
                    // Sélection d’un autre type d’objet
                    itemSelectionne = item;
                    indexSelectionne = index;
    
                    document.body.style.cursor = "none";
                    curseur.innerHTML = "";
    
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
                    curseur.style.left = (e.pageX - 16) + "px";
                    curseur.style.top = (e.pageY - 16) + "px";
                }
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
    initialiserTooltip();
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

        // Gestion du tooltip pour chaque case de l'inventaire
        caseDiv.addEventListener("mouseenter", (e) => {
            if (objet.id) {
                tooltipElement.textContent = objet.id;
                tooltipElement.style.display = "block";
            }
        });

        caseDiv.addEventListener("mousemove", (e) => {
            tooltipElement.style.left = (e.pageX + 10) + "px";
            tooltipElement.style.top = (e.pageY + 10) + "px";
        });

        caseDiv.addEventListener("mouseleave", () => {
            tooltipElement.style.display = "none";
        });

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