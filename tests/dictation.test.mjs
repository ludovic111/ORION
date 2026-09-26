import test from "node:test";
import assert from "node:assert/strict";
import {
  NBSP,
  applyVoiceCommands,
  insertAt,
  pickLang,
  speechSupported,
} from "../src/ui/dictation.ts";

test("speech recognition is detected on the window only when offered", () => {
  assert.equal(speechSupported(undefined), false);
  assert.equal(speechSupported({}), false);
  assert.equal(speechSupported({ webkitSpeechRecognition: class {} }), true);
  assert.equal(speechSupported({ SpeechRecognition: class {} }), true);
  assert.equal(speechSupported({ SpeechRecognition: "no" }), false);
});

test("dictation prefers Swiss French, then French of France", () => {
  assert.equal(pickLang(["fr-CH", "de-CH"]), "fr-CH");
  assert.equal(pickLang(["de-CH", "fr-ch"]), "fr-CH");
  assert.equal(pickLang(["fr-FR", "en"]), "fr-FR");
  assert.equal(pickLang(["fr"]), "fr-FR");
  assert.equal(pickLang(["fr-BE"]), "fr-FR");
  // No French in the browser: the application is in Swiss French.
  assert.equal(pickLang(["de-CH", "en-US"]), "fr-CH");
  assert.equal(pickLang([]), "fr-CH");
  assert.equal(pickLang(undefined), "fr-CH");
});

test("spoken commands become punctuation, spacing and capitals", () => {
  assert.equal(
    applyVoiceCommands("route coupée point les secours arrivent"),
    "route coupée. Les secours arrivent",
  );
  assert.equal(
    applyVoiceCommands("trois blessés virgule deux légers"),
    "trois blessés, deux légers",
  );
  assert.equal(
    applyVoiceCommands("Lieu deux points pont de Carouge"),
    `Lieu${NBSP}: pont de Carouge`,
  );
  assert.equal(
    applyVoiceCommands("qui confirme point d’interrogation"),
    `qui confirme${NBSP}?`,
  );
  assert.equal(
    applyVoiceCommands("qui confirme point d'interrogation merci"),
    `qui confirme${NBSP}? Merci`,
  );
  assert.equal(
    applyVoiceCommands("première ligne nouvelle ligne deuxième ligne"),
    "première ligne\nDeuxième ligne",
  );
  assert.equal(applyVoiceCommands("fin À la ligne suite"), "fin\nSuite");
  assert.equal(
    applyVoiceCommands("fin point nouveau paragraphe suite"),
    "fin.\n\nSuite",
  );
  assert.equal(applyVoiceCommands("NOUVELLE LIGNE Point"), "\n.");
  assert.equal(
    applyVoiceCommands("niveau trois virgule 5 mètres"),
    "niveau trois, 5 mètres",
  );
  assert.equal(
    applyVoiceCommands("niveau 3 virgule 5 mètres"),
    "niveau 3,5 mètres",
  );
});

test("« point » after a determiner stays a word", () => {
  assert.equal(
    applyVoiceCommands("le point de situation à 14 h point"),
    "le point de situation à 14 h.",
  );
  assert.equal(
    applyVoiceCommands("rendez-vous au point de rassemblement"),
    "rendez-vous au point de rassemblement",
  );
  assert.equal(applyVoiceCommands(""), "");
  assert.equal(applyVoiceCommands("  "), "");
});

test("dictated text is inserted at the caret with the right spacing", () => {
  assert.deepEqual(insertAt("", 0, 0, "route coupée"), {
    value: "Route coupée",
    caret: 12,
  });
  assert.deepEqual(insertAt("Route", 5, 5, "coupée"), {
    value: "Route coupée",
    caret: 12,
  });
  assert.deepEqual(insertAt("Route coupée. ", 14, 14, "les secours"), {
    value: "Route coupée. Les secours",
    caret: 25,
  });
  // Punctuation sticks to the previous word; « ? » takes a no-break space.
  assert.deepEqual(insertAt("Route coupée ", 13, 13, "."), {
    value: "Route coupée.",
    caret: 13,
  });
  assert.equal(insertAt("Qui ", 4, 4, "?").value, `Qui${NBSP}?`);
  // In the middle of the text: spaced like the words around it.
  assert.deepEqual(insertAt("PontCarouge", 4, 4, "de"), {
    value: "Pont de Carouge",
    caret: 8,
  });
  assert.deepEqual(insertAt("Pont Carouge", 4, 4, "de"), {
    value: "Pont de Carouge",
    caret: 7,
  });
  // The selection is replaced.
  assert.deepEqual(insertAt("Pont XXX Carouge", 5, 8, "de"), {
    value: "Pont de Carouge",
    caret: 7,
  });
  // A missing caret appends; the maximum length is kept.
  assert.equal(insertAt("Fin", null, null, "suite").value, "Fin suite");
  assert.equal(insertAt("abc", 3, 3, "defgh", 6).value, "abc de");
  assert.deepEqual(insertAt("abc", 1, 1, ""), { value: "abc", caret: 1 });
});
