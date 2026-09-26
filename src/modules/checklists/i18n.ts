import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Checklists (Checklists.tsx, TemplateSheet.tsx).
export const { t, tn, tIn, dict } = translator({
  ...common,
  "Cette liste n’existe plus.": {
    de: "Diese Checkliste existiert nicht mehr.",
    it: "Questa lista non esiste più.",
  },
  "Liste de contrôle · {title}": {
    de: "Checkliste · {title}",
    it: "Lista di controllo · {title}",
  },
  "Démarrée le {date}": { de: "Gestartet am {date}", it: "Avviata il {date}" },
  "liste-de-controle": { de: "checkliste", it: "lista-di-controllo" },
  "{done}/{n} étape": { de: "{done}/{n} Schritt", it: "{done}/{n} passo" },
  "{done}/{n} étapes": { de: "{done}/{n} Schritte", it: "{done}/{n} passi" },
  Étape: { de: "Schritt", it: "Passo" },
  Étapes: { de: "Schritte", it: "Passi" },
  Fait: { de: "Erledigt", it: "Fatto" },
  Par: { de: "Von", it: "Da" },
  "(contrôle {n} min)": {
    de: "(Kontrolle {n} Min.)",
    it: "(controllo {n} min)",
  },
  "Nouveau modèle": { de: "Neue Vorlage", it: "Nuovo modello" },
  "Démarrer une liste": { de: "Checkliste starten", it: "Avvia una lista" },
  "Listes en cours": { de: "Laufende Checklisten", it: "Liste in corso" },
  "Étapes faites": { de: "Erledigte Schritte", it: "Passi fatti" },
  "Contrôles en retard": {
    de: "Überfällige Kontrollen",
    it: "Controlli in ritardo",
  },
  "Listes closes": {
    de: "Abgeschlossene Checklisten",
    it: "Liste chiuse",
  },
  "Aucune liste en cours": {
    de: "Keine laufende Checkliste",
    it: "Nessuna lista in corso",
  },
  "Une liste de contrôle rappelle ce qu’il ne faut pas oublier pour un type d’événement (crue, black-out, canicule…). Cochez les étapes au fur et à mesure : le journal note qui l’a fait et quand.":
    {
      de: "Eine Checkliste erinnert daran, was bei einem Ereignistyp (Hochwasser, Blackout, Hitzewelle …) nicht vergessen werden darf. Haken Sie die Schritte laufend ab: Das Journal hält fest, wer sie wann erledigt hat.",
      it: "Una lista di controllo ricorda ciò che non va dimenticato per un tipo di evento (piena, black-out, canicola…). Spuntate i passi man mano: il diario annota chi li ha fatti e quando.",
    },
  "Étape cochée.": { de: "Schritt abgehakt.", it: "Passo spuntato." },
  "Étape décochée.": {
    de: "Häkchen entfernt.",
    it: "Spunta tolta.",
  },
  "Liste close.": {
    de: "Checkliste abgeschlossen.",
    it: "Lista chiusa.",
  },
  "Liste rouverte.": {
    de: "Checkliste wieder geöffnet.",
    it: "Lista riaperta.",
  },
  "Supprimer la liste « {title} » ? Les entrées du journal restent.": {
    de: "Checkliste « {title} » löschen? Die Journaleinträge bleiben.",
    it: "Eliminare la lista « {title} »? Le voci del diario restano.",
  },
  "Liste supprimée.": { de: "Checkliste gelöscht.", it: "Lista eliminata." },
  Modèles: { de: "Vorlagen", it: "Modelli" },
  "Modèles par type d’événement": {
    de: "Vorlagen nach Ereignistyp",
    it: "Modelli per tipo di evento",
  },
  "Cacher les masqués": {
    de: "Ausgeblendete verbergen",
    it: "Nascondi i nascosti",
  },
  "Masqués ({n})": { de: "Ausgeblendet ({n})", it: "Nascosti ({n})" },
  "{n} étape": { de: "{n} Schritt", it: "{n} passo" },
  "{n} étapes": { de: "{n} Schritte", it: "{n} passi" },
  "standard modifié": { de: "Standard geändert", it: "standard modificato" },
  standard: { de: "Standard", it: "standard" },
  "du journal": { de: "des Journals", it: "del diario" },
  masqué: { de: "ausgeblendet", it: "nascosto" },
  Démarrer: { de: "Starten", it: "Avvia" },
  "Modifier « {name} »": {
    de: "« {name} » bearbeiten",
    it: "Modifica « {name} »",
  },
  "Dupliquer « {name} »": {
    de: "« {name} » duplizieren",
    it: "Duplica « {name} »",
  },
  "Modèle dupliqué.": { de: "Vorlage dupliziert.", it: "Modello duplicato." },
  Afficher: { de: "Einblenden", it: "Mostra" },
  Masquer: { de: "Ausblenden", it: "Nascondi" },
  "Modèle affiché.": { de: "Vorlage eingeblendet.", it: "Modello mostrato." },
  "Modèle masqué.": { de: "Vorlage ausgeblendet.", it: "Modello nascosto." },
  "Rétablir le modèle standard": {
    de: "Standardvorlage wiederherstellen",
    it: "Ripristina il modello standard",
  },
  "Supprimer le modèle": { de: "Vorlage löschen", it: "Elimina il modello" },
  "Rétablir le standard": {
    de: "Standard wiederherstellen",
    it: "Ripristina lo standard",
  },
  "Rétablir « {name} » tel que livré ? Vos changements du modèle sont retirés (les listes démarrées ne changent pas).":
    {
      de: "« {name} » im Auslieferungszustand wiederherstellen? Ihre Änderungen an der Vorlage werden entfernt (gestartete Checklisten ändern sich nicht).",
      it: "Ripristinare « {name} » come fornito? Le vostre modifiche al modello vengono tolte (le liste avviate non cambiano).",
    },
  "Supprimer le modèle « {name} » ? Les listes démarrées restent.": {
    de: "Vorlage « {name} » löschen? Gestartete Checklisten bleiben.",
    it: "Eliminare il modello « {name} »? Le liste avviate restano.",
  },
  "Modèle rétabli.": {
    de: "Vorlage wiederhergestellt.",
    it: "Modello ripristinato.",
  },
  "Modèle supprimé.": { de: "Vorlage gelöscht.", it: "Modello eliminato." },
  "Liste « {title} » démarrée.": {
    de: "Checkliste « {title} » gestartet.",
    it: "Lista « {title} » avviata.",
  },
  "Modèle « {name} »": { de: "Vorlage « {name} »", it: "Modello « {name} »" },
  "Modèle standard : vos changements valent pour ce journal": {
    de: "Standardvorlage: Ihre Änderungen gelten für dieses Journal",
    it: "Modello standard: le vostre modifiche valgono per questo diario",
  },
  "Modèle du journal": { de: "Vorlage des Journals", it: "Modello del diario" },
  "Modèle enregistré.": { de: "Vorlage gespeichert.", it: "Modello salvato." },
  "Liste en cours : les étapes cochées restent": {
    de: "Laufende Checkliste: Abgehakte Schritte bleiben",
    it: "Lista in corso: i passi spuntati restano",
  },
  "Liste enregistrée.": {
    de: "Checkliste gespeichert.",
    it: "Lista salvata.",
  },
  "démarrée {date}": { de: "gestartet {date}", it: "avviata {date}" },
  "close {date}": { de: "abgeschlossen {date}", it: "chiusa {date}" },
  "contrôle {n} min après": {
    de: "Kontrolle {n} Min. danach",
    it: "controllo {n} min dopo",
  },
  "fait à {time} par {who}": {
    de: "erledigt um {time} von {who}",
    it: "fatto alle {time} da {who}",
  },
  "Contrôle en retard": {
    de: "Kontrolle überfällig",
    it: "Controllo in ritardo",
  },
  "Contrôle après l’étape": {
    de: "Kontrolle nach dem Schritt",
    it: "Controllo dopo il passo",
  },
  "Consignée (contrôle à suivre)": {
    de: "Erfasst (Kontrolle folgt)",
    it: "Registrato (controllo da seguire)",
  },
  "Sera consignée au journal": {
    de: "Wird im Journal erfasst",
    it: "Sarà registrato nel diario",
  },
  "Ne sera pas consignée": {
    de: "Wird nicht erfasst",
    it: "Non sarà registrato",
  },
  "Ne pas consigner cette étape": {
    de: "Diesen Schritt nicht erfassen",
    it: "Non registrare questo passo",
  },
  "Consigner cette étape": {
    de: "Diesen Schritt erfassen",
    it: "Registra questo passo",
  },
  "Clore la liste": { de: "Checkliste abschliessen", it: "Chiudi la lista" },
  Rouvrir: { de: "Wieder öffnen", it: "Riapri" },
  "Démarrer une liste de contrôle": {
    de: "Checkliste starten",
    it: "Avvia una lista di controllo",
  },
  "Titre de la liste": { de: "Titel der Checkliste", it: "Titolo della lista" },
  "Lieu ou secteur": { de: "Ort oder Sektor", it: "Luogo o settore" },
  // Editor of the steps (TemplateSheet.tsx)
  "Donnez un nom à la liste.": {
    de: "Geben Sie der Checkliste einen Namen.",
    it: "Date un nome alla lista.",
  },
  "Lecture seule.": { de: "Nur lesen.", it: "Sola lettura." },
  "Type d’événement": { de: "Ereignistyp", it: "Tipo di evento" },
  Description: { de: "Beschreibung", it: "Descrizione" },
  "Fonction responsable": {
    de: "Verantwortliche Funktion",
    it: "Funzione responsabile",
  },
  "Contrôle dans (min, 0 = aucun)": {
    de: "Kontrolle in (Min., 0 = keine)",
    it: "Controllo tra (min, 0 = nessuno)",
  },
  "Consigner au journal quand elle est cochée": {
    de: "Beim Abhaken im Journal erfassen",
    it: "Registrare nel diario quando è spuntato",
  },
  Monter: { de: "Nach oben", it: "Sposta su" },
  Descendre: { de: "Nach unten", it: "Sposta giù" },
  "Retirer l’étape": { de: "Schritt entfernen", it: "Rimuovi il passo" },
  "Ajouter une étape": { de: "Schritt hinzufügen", it: "Aggiungi un passo" },
} satisfies Dict);
