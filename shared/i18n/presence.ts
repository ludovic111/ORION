import { translator, type Dict } from "./core.ts";

// Roll-call and plan de relève (shared/presence.ts): warnings about time on
// duty and rest, default names.
export const { t, tn, tIn, dict } = translator({
  "En service {duration} d’affilée depuis {since} (maximum {max} h)": {
    de: "Im Dienst {duration} am Stück seit {since} (maximal {max} h)",
    it: "In servizio {duration} di fila dalle {since} (massimo {max} h)",
  },
  "A servi {duration} d’affilée depuis {since} (maximum {max} h)": {
    de: "{duration} am Stück im Dienst gewesen seit {since} (maximal {max} h)",
    it: "Ha prestato servizio {duration} di fila dalle {since} (massimo {max} h)",
  },
  "Repos de {duration} seulement avant la reprise à {back} (minimum {min} h)": {
    de: "Nur {duration} Ruhe vor der Wiederaufnahme um {back} (mindestens {min} h)",
    it: "Riposo di soli {duration} prima della ripresa alle {back} (minimo {min} h)",
  },
  "Personne retirée": { de: "Entfernte Person", it: "Persona rimossa" },
  Relève: { de: "Ablösung", it: "Avvicendamento" },
  "{name} : {duration} de service d’affilée (maximum {max} h)": {
    de: "{name}: {duration} Dienst am Stück (maximal {max} h)",
    it: "{name}: {duration} di servizio di fila (massimo {max} h)",
  },
  "{name} : repos de {duration} seulement avant « {title} » (minimum {min} h)":
    {
      de: "{name}: nur {duration} Ruhe vor «{title}» (mindestens {min} h)",
      it: "{name}: riposo di soli {duration} prima di «{title}» (minimo {min} h)",
    },
} satisfies Dict);
