// Fonction de notification
function afficherNotification(message) {
    const notifications = document.getElementById("notifications");
    const notif = document.createElement("div");
    notif.className = "notification";
    notif.textContent = message;
    notifications.appendChild(notif);

    // Supprimer le message après 1,5 secondes
    setTimeout(() => {
        notif.remove();
    }, 1500);
}