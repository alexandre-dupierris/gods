// Fonction de boucle de jeu
function gameLoop(timestamp) {

    if (jeuEnPause) {
        requestAnimationFrame(gameLoop); // continue d'écouter les frames pour pouvoir reprendre
        return;
    }

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

    // Calculer le temps écoulé en secondes
    const deltaSeconds = frameTime / 1000;
    tempsJeu += deltaSeconds * tickPerSecond;
    if (tempsJeu > maxGameTime) tempsJeu -= maxGameTime;
    
    // Toujours afficher à chaque frame
    afficherMonde(monMonde);

    // Afficher l'HUD
    updateHUD();

    // Mettre à jour les positions des moutons à chaque frame
    mettreAJourPositionsMoutons();

    // mettre à jour l'herbe
    updateHerbe();

    requestAnimationFrame(gameLoop);
}

// Démarre la boucle de jeu
function startGame() {
    lastTime = 0;
    accumulator = 0;
    setupTooltipEvents();
    requestAnimationFrame(gameLoop);
}

