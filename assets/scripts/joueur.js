// Fonction pour vérifier si le joueur est dans l'eau
function estDansEau(x, y) {
  const delta = 0 // tolérance verticale vers le bas
  const positions = [
    [Math.floor(x), Math.floor(y)], // position principale
    [Math.ceil(x), Math.floor(y)], // coin supérieur droit
    [Math.floor(x), Math.ceil(y)], // coin inférieur gauche
    [Math.ceil(x), Math.ceil(y)], // coin inférieur droit
    [Math.floor(x), Math.floor(y - delta)],
    [Math.ceil(x), Math.floor(y - delta)],
  ]

  for (const [checkX, checkY] of positions) {
    const bloc = getBlocAt(checkX, checkY)
    if (bloc && bloc.type === 'eau') {
      return true
    }
  }

  return false
}

// Fonction de gestion de l'apnée et nourriture
function apneeEtNourriture(dansEau) {
  if (dansEau) {
    if (joueur.air > 0) {
      joueur.air -= 0.2 // diminue l'air lentement
    } else {
      // Commence à perdre de la vie quand l'air est à 0
      joueur.vie = Math.max(0, joueur.vie - 0.1)
    }
  } else {
    // Reprendre de l'air petit à petit hors de l'eau
    joueur.air = Math.min(joueur.air + 0.4, joueur.airMax)
  }
  if (joueur.nourriture > 0) {
    joueur.nourriture = Math.max(0, joueur.nourriture - 0.005)
  } else {
    // Commence à perdre de la vie quand la nourriture est à 0
    joueur.vie = Math.max(0, joueur.vie - 0.05)
  }
  // meurs si le joueur n'a plus de vie
  if (joueur.vie === 0) {
    joueurMort = true
  }
}

// Fonction pour arrondir le personnage
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
  ctx.fill()
}

// Fonction d'affichage des barres de santé et autres
function updateHUD() {
  const pourcentageVie = (joueur.vie / joueur.vieMax) * 100
  const pourcentageNourriture = (joueur.nourriture / joueur.nourritureMax) * 100
  const pourcentageAir = (joueur.air / joueur.airMax) * 100

  document.getElementById('barreVie').style.width = pourcentageVie + '%'
  document.getElementById('barreFaim').style.width = pourcentageNourriture + '%'
  document.getElementById('barreAir').style.width = pourcentageAir + '%'
}
