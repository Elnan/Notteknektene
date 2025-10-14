import React from "react";
import styles from "./Rules.module.css";

const Rules = () => {
  return (
    <div className={styles.rulesContainer}>
      <h2>Regler</h2>
      <ul>
        <h3>Nytt for sesongen</h3>
        <li>
          <strong>Ingen tidtakning</strong> - dere kan bruke så mye tid dere vil
          (<strong>Innenfor fristen</strong>). Ingen teller minutter og
          sekunder.
        </li>
        <li>
          <strong>10 interaktive, hjemmelagde oppgaver</strong> - Vi er ferdige
          med oppgaver på et bilde, fra en bok. Nå har jeg laget oppgavene selv!
        </li>
        <li>
          <strong> Nytt utseende </strong> - Nøtteknektene har fått seg en ny
          stil.
        </li>
        <li>
          <strong>Oppdagelse belønnes</strong> - Oppgavene vil ha lite
          forklaring, men man kan alltid få instrukser mot -1 poeng. Det er med
          andre ord "bonuspoeng" å hente på å skjønne oppgaven på egenhånd.
        </li>

        <h3>Generelle regler</h3>
        <li>
          En sesong varer i <strong>10 uker</strong>, og det slippes en ny nøtt
          hver uke.
        </li>
        <li>
          Hver nøtt har en innleveringsfrist <strong>Søndag, kl. 23:59</strong>.
          En ny nøtt slippes <strong>mandag, kl. 00:00</strong>.
        </li>
        <li>
          Du har kun <strong>ett forsøk</strong> per oppgave – tenk deg godt om
          før du sender inn svaret.
        </li>
        <li>
          Hver oppgave vil ha lite instrukser. Dette er for å belønne de som har
          lyst til å finne ut av det selv. Alle oppgaver vil ha en knapp for
          instrukser (<strong>"Instructions"</strong>), men det vil koste 1
          poeng å bruke den.
          <ul>
            <li>
              I Oppgaver hvor "Instructions"-knappen ikke finnes, vil
              "Hint"-knappen gi nødvendig informasjon for å løse oppgaven.
            </li>
            <li>
              <strong>Merk</strong> at noen oppgaver er vanskelige, så ikke nøl
              med å bruke denne.
            </li>
          </ul>
        </li>
        <li>
          Hver oppgave har også en <strong>Hint-knapp</strong> som kan brukes. I
          noen oppgaver kan den brukes flere ganger. Det vil alltid koste{" "}
          <strong>1 poeng</strong> hver gang man bruker hint.
          <ul>
            <li>
              Både <strong>Hint</strong> og <strong>Instructions</strong> vil be
              om bekreftelse før de blir brukt. Så du blir ikke trukket poeng
              for å trykke på dem.
            </li>
          </ul>
        </li>
        <li>
          Det vil være mulig å <strong>løse gamle oppgaver igjen</strong>, men
          det er kun deres <strong>første besvarelse som teller</strong>.
        </li>
      </ul>
      <ul>
        <h3>Hjelpemidler</h3>
        <li>
          Alle hjelpemidler som ikke gir deg svaret direkte er tillatt i år.
          <ul>
            <li>
              ❌ KI og Solvers er eksempler på hjelpemidler som ikke er tillatt
              (ChatGPT, WordSolver, etc.).
            </li>
          </ul>
        </li>
      </ul>
      <ul>
        <h3>Poeng</h3>
        <li>
          Poengutdeling vil være forskjellig for hver oppgave. Noen spill vil gi
          en fast poengsum, mens andre vil gi poeng basert på hvor mange poeng
          du har scoret i oppgaven relativt til andre. I oppgaver med flere
          runder, vil man få poeng for hver runde man løser.
          <ul>
            <li>
              <strong>Instruksjoner</strong>: I de aller fleste oppgaver vil man
              kunne bruke en "Instructions"-knapp. Dette vil koste{" "}
              <strong>1 poeng</strong>, men gi verdifull instrukser for
              oppgaven.
            </li>
            <li>
              <strong>Hint</strong>: Hint vil også være tilgjengelig for alle
              oppgaver, men det vil koste <strong>1 poeng</strong>. I oppgaver
              med flere hint tilgjenglig, vil det koste{" "}
              <strong>1 poeng per hint.</strong>{" "}
            </li>
          </ul>
        </li>
        <li>
          Ingen oppgaver gir poeng på raskeste svar, så det er bare å bruke den
          tiden man trenger uten å stresse.
          <ul>
            <li>
              Én oppgave i år har en timer, men den er basert på å finne svaret
              innen tiden er ute og vil ha en pausefunksjon. Oppgaven vil være
              tydelig på dette før den begynner.
            </li>
          </ul>
        </li>
        <li>
          Feil svar eller ingen innlevering: <strong>0 poeng</strong>
        </li>
      </ul>
    </div>
  );
};

export default Rules;
