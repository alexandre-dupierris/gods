// // Fonction de sauvegarde
// function sauvegarder() {
//     const data = {
//         scores,
//         actions,
//         monMonde: compresserMonde(monMonde),
//         playerLocalisation,
//         mesMobs,
//         physique,
//         monInventaire,
//         tempsJeu,
//         joueur
//     };
//     localStorage.setItem("sauvegarde", JSON.stringify(data));
//     console.log("💾 Données sauvegardées !");
// }

// Fonction de sauvegarde de la partie
function sauvegarderPartie() {
    const sauvegardeData = {
        scores,
        actions,
        monMonde: compresserMonde(monMonde),
        playerLocalisation,
        mesMobs,
        physique,
        monInventaire,
        tempsJeu,
        joueur
    };
    localStorage.setItem("sauvegarde", JSON.stringify(sauvegardeData));
    afficherNotification("💾 Partie sauvegardée !");
}