import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Mes tâches (MyTasks.tsx).
export const { t, tn, tIn, dict } = translator({
  ...common,
  Attribué: { de: "Zugewiesen", it: "Assegnato" },
  "Mission d’ordre": { de: "Auftrag aus Befehl", it: "Missione d’ordine" },
  Diffusion: { de: "Verteilung", it: "Diffusione" },
  "+{n} min": { de: "+{n} Min.", it: "+{n} min" },
  "Terminé (Mes tâches)": {
    de: "Erledigt (Meine Aufgaben)",
    it: "Concluso (I miei compiti)",
  },
  "{entry} : terminé.": { de: "{entry}: erledigt.", it: "{entry}: concluso." },
  "Tâche terminée.": { de: "Aufgabe erledigt.", it: "Compito concluso." },
  "Mission terminée.": { de: "Auftrag erledigt.", it: "Missione conclusa." },
  "Échéance reportée de {n} min": {
    de: "Frist um {n} Min. verschoben",
    it: "Scadenza rinviata di {n} min",
  },
  "{entry} : échéance reportée de {n} min.": {
    de: "{entry}: Frist um {n} Min. verschoben.",
    it: "{entry}: scadenza rinviata di {n} min.",
  },
  "Échéance reportée de {n} min.": {
    de: "Frist um {n} Min. verschoben.",
    it: "Scadenza rinviata di {n} min.",
  },
  "Suite de {entry}": { de: "Folge von {entry}", it: "Seguito di {entry}" },
  "« {ack} » envoyé.": { de: "« {ack} » gesendet.", it: "« {ack} » inviato." },
  "Tout ce qui est attribué à votre fonction ou à votre nom : entrées à suivre, missions des ordres, éléments attribués, diffusions à quittancer.":
    {
      de: "Alles, was Ihrer Funktion oder Ihrem Namen zugewiesen ist: zu verfolgende Einträge, Aufträge aus Befehlen, zugewiesene Elemente, zu quittierende Verteilungen.",
      it: "Tutto ciò che è assegnato alla vostra funzione o al vostro nome: voci da seguire, missioni degli ordini, elementi assegnati, diffusioni da quittanzare.",
    },
  "Ma fonction (ce poste)": {
    de: "Meine Funktion (dieser Arbeitsplatz)",
    it: "La mia funzione (questa postazione)",
  },
  "Choisissez la fonction de ce poste : elle décide de ce qui vous est attribué, des alertes et du module d’arrivée.":
    {
      de: "Wählen Sie die Funktion dieses Arbeitsplatzes: Sie bestimmt, was Ihnen zugewiesen wird, die Alarme und das Startmodul.",
      it: "Scegliete la funzione di questa postazione: decide ciò che vi è assegnato, gli avvisi e il modulo d’arrivo.",
    },
  "Ma cellule (facultatif)": {
    de: "Meine Zelle (optional)",
    it: "La mia cellula (facoltativo)",
  },
  "Opérateur : {author}. Une tâche attribuée à ce nom, à cette fonction ou à cette cellule apparaît ici.":
    {
      de: "Operateur: {author}. Eine Aufgabe, die diesem Namen, dieser Funktion oder dieser Zelle zugewiesen ist, erscheint hier.",
      it: "Operatore: {author}. Un compito assegnato a questo nome, a questa funzione o a questa cellula compare qui.",
    },
  "Mes tâches en chiffres": {
    de: "Meine Aufgaben in Zahlen",
    it: "I miei compiti in cifre",
  },
  "À faire": { de: "Zu erledigen", it: "Da fare" },
  "À quittancer": { de: "Zu quittieren", it: "Da quittanzare" },
  "Prochaine échéance · {title}": {
    de: "Nächste Frist · {title}",
    it: "Prossima scadenza · {title}",
  },
  "Aucune échéance à venir": {
    de: "Keine anstehende Frist",
    it: "Nessuna scadenza imminente",
  },
  "Rien d’attribué à ce poste pour l’instant": {
    de: "Diesem Arbeitsplatz ist vorerst nichts zugewiesen",
    it: "Per ora nulla di assegnato a questa postazione",
  },
  "Choisissez d’abord votre fonction": {
    de: "Wählen Sie zuerst Ihre Funktion",
    it: "Scegliete prima la vostra funzione",
  },
  "Une entrée dont le responsable est « {role} » ou « {author} », une mission d’ordre pour votre fonction, un élément attribué ou une diffusion qui vous est destinée apparaît ici, la plus en retard d’abord.":
    {
      de: "Ein Eintrag mit « {role} » oder « {author} » als Verantwortlichem, ein Auftrag aus einem Befehl für Ihre Funktion, ein zugewiesenes Element oder eine Verteilung an Sie erscheint hier, das Überfälligste zuerst.",
      it: "Una voce il cui responsabile è « {role} » o « {author} », una missione d’ordine per la vostra funzione, un elemento assegnato o una diffusione a voi destinata compare qui, prima la più in ritardo.",
    },
  "votre fonction": { de: "Ihre Funktion", it: "la vostra funzione" },
  "Mes tâches": { de: "Meine Aufgaben", it: "I miei compiti" },
  "Noter au journal": { de: "Im Journal notieren", it: "Annota nel diario" },
  "Pour votre fonction": {
    de: "Für Ihre Funktion",
    it: "Per la vostra funzione",
  },
} satisfies Dict);
