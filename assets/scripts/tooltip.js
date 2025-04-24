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
    return type.replace(/_/g, " ");
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