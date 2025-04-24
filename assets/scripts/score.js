// Fonction d'impacte des actions selon le temps
function getTimeWeight(currentTurn, actionTurn, decayRate) {
    const age = currentTurn - actionTurn;
    return Math.exp(-decayRate * age);
}

// Fonction de calcul du score par Dieu
function calculerScoreDieu(actions, dieu, currentTurn) {
    const decayRate = decayRates[dieu];
    return actions
        .filter(a => a.dieu === dieu)
        .reduce((score, action) => {
        const poids = getTimeWeight(currentTurn, action.tour, decayRate);
        return score + action.valeur * poids;
        }, 0);
}

// Fonction de mise à jour des scores
function mettreAJourScores(actions, currentTurn) {
    for (const dieu in scores) {
      scores[dieu] = calculerScoreDieu(actions, dieu, currentTurn);
    }
}

// Fonction d'affichage des scores
function afficherScores(scores) {
    for (const dieu in scores) {
        const score = scores[dieu];
        const verdict = score > 100 ? "💖 Accepté" : "❌ Rejeté";
        console.log(`${dieu}: ${score.toFixed(2)} → ${verdict}`);
    }
}

// Fonction de calcul du jugement dernier
function calculerJugement(scores) {
    const seuil = 100;
    const dieuxSatisfaits = Object.values(scores).filter(score => score > seuil).length;
  
    if (dieuxSatisfaits >= 4) {
      return {
        resultat: "Paradisiaque",
        message: "Tu as été accepté par suffisamment de Dieux. Tu accèdes au Paradis."
      };
    } else {
      return {
        resultat: "Rejeté",
        message: "Moins de 4 Dieux t'ont accepté. Tu es rejeté et peux retenter ta survie."
      };
    }
}

// Fonction d'export sur json
function exporterJSON(scores, verdict) {
    const data = {
        timestamp: new Date().toISOString(),
        scores,
        verdict
    };
  
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = "jugement_final.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}