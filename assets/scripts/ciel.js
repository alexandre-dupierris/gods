// Fonction de gestion de la couleur du ciel
function getSkyGradient(time) {
    if (time < 2000) return ["#FFF2B2", "#FFD580"]; // matin
    if (time < 14000) return ["#87CEFA", "#00BFFF"]; // jour
    if (time < 16000) return ["#FFB347", "#FF8C00"]; // soir
    return ["#2c3e50", "#191970"]; // nuit
}

// Fonction de filtre selon le temps
function getDarknessOpacity(time) {
    const maxOpacity = 0.5; // la nuit sera sombre mais pas noire
    if (time >= 2000 && time <= 16000) return 0;
    if (time < 2000) return maxOpacity * (1 - (time / 2000));
    if (time > 16000) return maxOpacity * ((time - 16000) / 8000);
    return maxOpacity;
}

// Fonction de parse des couleurs
function parseCouleur(c) {
    if (c.startsWith("#")) {
        const hex = parseInt(c.slice(1), 16);
        return {
            r: (hex >> 16) & 0xFF,
            g: (hex >> 8) & 0xFF,
            b: hex & 0xFF
        };
    } else if (c.startsWith("rgb")) {
        const [r, g, b] = c.match(/\d+/g).map(Number);
        return { r, g, b };
    }
    return { r: 0, g: 0, b: 0 }; // fallback
}

// Fonction d'interpolation de la couleur du ciel
function interpoleCouleur(c1, c2, t) {
    const color1 = parseCouleur(c1);
    const color2 = parseCouleur(c2);

    const r = Math.round(color1.r + (color2.r - color1.r) * t);
    const g = Math.round(color1.g + (color2.g - color1.g) * t);
    const b = Math.round(color1.b + (color2.b - color1.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
}

// Fonction de navigation du Soleil
function drawSoleil(t, ctx, canvas) {
    const soleilX = (canvas.width + 80) * t - 40;
    const soleilY = canvas.height * (0.6 - 0.5 * Math.sin(Math.PI * t));

    ctx.beginPath();
    ctx.arc(soleilX, soleilY, 40, 0, Math.PI * 2);
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.closePath();
}

// Fonction de progression du jour
function getProgressionDuJour(heure) {
    return Math.max(0, Math.min(1, (heure) / 16000)); // de 6h à 18h
}

// Fonction de navigation de la Lune
function drawLune(t, ctx, canvas) {
    const luneX = (canvas.width + 80) * t - 40;
    const luneY = canvas.height * (0.6 - 0.5 * Math.sin(Math.PI * t));

    ctx.beginPath();
    ctx.arc(luneX, luneY, 40, 0, Math.PI * 2);
    ctx.fillStyle = "#ddddff";
    ctx.fill();
    ctx.closePath();
}

// Fonction de progression de la nuit
function getProgressionDeLaNuit(heure) {
    return Math.max(0, Math.min(1, (heure - 16000) / 8000)); // de 6h à 18h
}