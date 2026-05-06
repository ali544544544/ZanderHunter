import React from 'react';

type GuideTable = {
  headers: string[];
  rows: string[][];
};

type FishProfile = {
  name: string;
  scientificName: string;
  badge: string;
  text: string;
  tactics: string[];
};

const designPrinciples: GuideTable = {
  headers: ['Design-Komponente', 'Strategische Implementierung', 'Effekt'],
  rows: [
    ['Visuelle Hierarchie', 'Homescreen auf wenige klare Entscheidungen begrenzen.', 'Weniger kognitive Last, schnellere Task-Erledigung.'],
    ['Skeleton Screens', 'Platzhalterelemente waehrend Daten geladen werden.', 'Die App wirkt schneller und Nutzer brechen seltener ab.'],
    ['Adaptive Interfaces', 'Module nach Standort, Zeit und Nutzung priorisieren.', 'Personalisierung erhoeht Relevanz und Bindung.'],
    ['Kontrast-Management', 'Hochkontrast-Farben fuer Sonne, Daemmerung und nasse Displays.', 'Lesbarkeit bleibt auch draussen stabil.'],
    ['Offline-Funktionalitaet', 'Karten, Guides und Rechtsinfos lokal cachen.', 'Nutzbar an abgelegenen Gewaessern ohne Empfang.'],
  ],
};

const filterMatrix: GuideTable = {
  headers: ['Filterkategorie', 'Parameter', 'Zielsetzung'],
  rows: [
    ['Zielfisch', 'Hecht, Zander, Barsch, Karpfen, Forelle', 'Koeder, Montage und Standplatz eingrenzen.'],
    ['Gewaessertyp', 'Fluss, See, Kanal, Brackwasser, Forellenteich', 'Strategie an Stroemung, Tiefe und Struktur anpassen.'],
    ['Angelmethode', 'Spinnfischen, Ansitzangeln, Fliegenfischen, Feedern', 'Passendes Geraet und passende Technik waehlen.'],
    ['Umweltfaktoren', 'Truebung, Wassertemperatur, Luftdruck, Tageszeit', 'Koederempfehlung dynamisch nach Aktivitaet ableiten.'],
    ['Schwierigkeit', 'Anfaenger, Fortgeschritten, Profi', 'Anleitungen und Rigs in passender Tiefe erklaeren.'],
  ],
};

const fishProfiles: FishProfile[] = [
  {
    name: 'Hecht',
    scientificName: 'Esox lucius',
    badge: 'Lauerjaeger',
    text:
      'Der Hecht ist ein explosiver Sichtjaeger mit pfeilfoermigem Koerper, weit hinten liegender Rueckenflosse und stark bezahntem Maul. Er nutzt Kraut, Schilf, Totholz und harte Deckung, um Beute aus kurzer Distanz zu attackieren.',
    tactics: ['Grosse Silhouette und auffaellige Reize nutzen.', 'Morgen und Abend sowie Herbstphasen priorisieren.', 'Krautkanten, Einlaeufe und windgedrueckte Ufer absuchen.'],
  },
  {
    name: 'Zander',
    scientificName: 'Sander lucioperca',
    badge: 'Daemmerungsraeuber',
    text:
      'Der Zander ist vorsichtiger als der Hecht und konzentriert sich oft auf schlanke Beutefische. Seine lichtempfindlichen Augen und sein feines Gehoer geben ihm in Truebung, Tiefe und Dunkelheit einen Vorteil.',
    tactics: ['Harte Boeden, Steinpackungen, Buhnenkoepfe und Kanten befischen.', 'Geruch und Frische bei toten Koederfischen beachten.', 'In der Daemmerung flacher, tagsueber tiefer suchen.'],
  },
  {
    name: 'Flussbarsch',
    scientificName: 'Perca fluviatilis',
    badge: 'Futterneid',
    text:
      'Der Flussbarsch ist robust, anpassungsfaehig und an dunklen Querstreifen sowie roten Flossen gut zu erkennen. Seine Stachelflossen schuetzen ihn vor Pradatoren, sein Schwarmverhalten erzeugt oft aggressive Fressphasen.',
    tactics: ['Kleine Gummifische, Spinner und Twitchbaits aktiv fuehren.', 'Nach Kontakt weiterwerfen und Futterneid ausnutzen.', 'Grosse Barsche tiefer an Spundwaenden und Unterwasserbergen suchen.'],
  },
  {
    name: 'Karpfen',
    scientificName: 'Cyprinus carpio',
    badge: 'Bodenstaubsauger',
    text:
      'Der Karpfen ist ein kampfstarker Allesfresser. Er durchsucht den Grund nach Larven, Schnecken und Pflanzenteilen und reagiert bei modernen Montagen besonders gut auf Boilies am Haar.',
    tactics: ['Futterplatz ruhig und konsequent aufbauen.', 'Haarmontage fuer vorsichtige Aufnahme nutzen.', 'Kanten, Plateaus und weiche Bodenbereiche beobachten.'],
  },
  {
    name: 'Schleie',
    scientificName: 'Tinca tinca',
    badge: 'Scheuer Krautfisch',
    text:
      'Die Schleie lebt bevorzugt in stehenden oder langsam fliessenden, stark verkrauteten Gewaessern. Sie verraet sich oft durch Gasblasen beim Wuehlen und nimmt Wuermer, Schnecken, Mais oder feines Grundfutter.',
    tactics: ['Leise auftreten und feine Montagen fischen.', 'Krautluecken und schlammige Zonen beobachten.', 'Fruehe und spaete Tagesphasen nutzen.'],
  },
];

const fishBiology: GuideTable = {
  headers: ['Fischart', 'Koerperbau', 'Nahrung', 'Laichzeit'],
  rows: [
    ['Hecht', 'Pfeilfoermig, oberstaendiges Maul', 'Fische, Krebse, kleine Wasservoegel', 'Maerz bis Mai'],
    ['Zander', 'Spindelfoermig, grosse Augen', 'Schlanke Fische wie Laube und Rotauge', 'April bis Juni'],
    ['Barsch', 'Hochrueckig, Stachelflossen', 'Insekten, Krebse, kleine Fische', 'Maerz bis Juni'],
    ['Karpfen', 'Gedrungen, vier Barteln', 'Larven, Pflanzen, Schnecken', 'Mai bis Juli'],
    ['Forelle', 'Torpedofoermig, Fettflosse', 'Insekten, Anflug, kleine Fische', 'Oktober bis Maerz'],
  ],
};

const baitGroups = [
  {
    title: 'Naturkoeder',
    items: [
      'Maden und Caster: universell fuer Friedfische, Caster besonders fuer groessere Brassen und Karpfen.',
      'Tauwurm und Mistwurm: Bewegung und Geruch sprechen Friedfische, Barsche und Aale an.',
      'Mais und Hanf: klassische Pflanzenkoeder, Hanf haelt Fische lange am Platz.',
      'Kaese, Fruehstuecksfleisch und Kirschen: Spezialoptionen fuer Barbe und Doebel.',
      'Tote Koederfische: bei Zander und Wels entscheidet Frische ueber die olfaktorische Qualitaet.',
    ],
  },
  {
    title: 'Kunstkoeder',
    items: [
      'Wobbler: Hardbaits mit Tauchschaufel, als floating, suspending oder sinking Modell.',
      'Gummifische: flexible Standardkoeder, die ueber Jigkopf-Gewicht in jeder Tiefe laufen.',
      'Spinner und Blinker: starke Druckwellen und Lichtreflexe fuer aggressive Raeuber.',
      'Jerkbaits und Surface-Baits: ruckartige Fuehrung oder Oberflaechenreize fuer Attacken.',
    ],
  },
];

const techniques = [
  {
    title: 'Jiggen',
    text: 'Gummifisch vom Boden anheben und kontrolliert absinken lassen. Viele Bisse kommen in der Absinkphase.',
  },
  {
    title: 'Twitchen',
    text: 'Suspender-Wobbler mit kurzen Schlaegen seitlich ausbrechen lassen. Pausen sind besonders im Winter entscheidend.',
  },
  {
    title: 'Schleppangeln',
    text: 'Koeder hinter dem Boot in definierter Tiefe fuehren, um grosse Wasserflaechen und pelagische Fische zu finden.',
  },
  {
    title: 'Vertikalangeln',
    text: 'Koeder direkt unter Boot oder Rutenspitze kontrollieren. Praezise an Kanten und versunkenen Strukturen.',
  },
];

const knots: GuideTable = {
  headers: ['Knoten', 'Einsatz', 'Schnurtyp', 'Vorteil'],
  rows: [
    ['Palomar', 'Wirbel, Haken, Snaps', 'Geflecht', 'Sehr hohe Tragkraft, rutschfest.'],
    ['Clinch', 'Oesen aller Art', 'Mono / Fluorocarbon', 'Einfach, stark bei monofiler Schnur.'],
    ['Albright', 'Schnurverbindung', 'Mono zu Geflecht', 'Schlankes Profil fuer Rutenringe.'],
    ['Rapala', 'Wobbler', 'Mono / Fluorocarbon', 'Feste Schlaufe fuer freie Koederaktion.'],
    ['Schlaufenknoten', 'Posen und Bleie', 'Universell', 'Schnell, praktisch fuer Finesse-Rigs.'],
    ['Drop-Shot', 'Drop-Shot-Haken', 'Fluorocarbon', 'Haken steht sauber im 90-Grad-Winkel.'],
  ],
};

const rigs = [
  {
    title: 'Texas Rig',
    text: 'Bullet-Weight, Perle und Offset-Haken erzeugen eine krautfeste Praesentation fuer Barsch und Zander.',
  },
  {
    title: 'Carolina Rig',
    text: 'Gewicht und Koeder sind getrennt. Der Koeder sinkt langsam und reizt misstrauische Raeuber.',
  },
  {
    title: 'Drop-Shot',
    text: 'Haken sitzt oberhalb des Bleis. Der Koeder kann fast auf der Stelle tanzen.',
  },
  {
    title: 'Feeder-Durchlaufmontage',
    text: 'Futterkorb laeuft frei, damit der Fisch den Koeder ohne direkten Gewichtswiderstand aufnehmen kann.',
  },
  {
    title: 'Haarmontage',
    text: 'Karpfen saugen den Koeder ein, ohne dass der Haken direkt im Koeder steckt. Beim Ausspucken greift der Selbsthakeffekt.',
  },
];

const legalExamples: GuideTable = {
  headers: ['Bundesland', 'Hecht-Schonzeit', 'Hecht-Mass', 'Zander-Schonzeit', 'Zander-Mass'],
  rows: [
    ['Bayern', '15.02. - 30.04.', '50 cm', '15.03. - 30.04.', '50 cm'],
    ['NRW', '15.02. - 30.04.', '45 cm', '01.04. - 31.05.', '40 cm'],
    ['Brandenburg', 'nur Erwerbsfischerei', '45 cm', 'gewaesserspezifisch', '45 cm'],
    ['Hessen', 'keine', '50 cm', 'keine', '45 cm'],
    ['Baden-Wuerttemberg', '15.02. - 15.05.', '45 cm', '01.04. - 15.05.', '45 cm'],
    ['Sachsen', '01.02. - 31.05.', '50 cm', '01.02. - 31.05.', '50 cm'],
  ],
};

const marketFeatures = [
  'KI-gestuetzte Fangprognosen aus Fanghistorie, Wetter, Luftdruck und Mondphase.',
  'Digitaler Erlaubnisscheinkauf ueber Partner wie hejfish.',
  'Hydrographische Karten mit Tiefen, Kanten und Unterwasserstrukturen.',
  'Community-Gilden mit Mentoren und verifiziertem Erfahrungswissen.',
  'Smart Gear Management fuer Tackle, Verschleiss und erfolgreiche Koeder-Ruten-Kombinationen.',
];

function GuideSection({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">{kicker}</p>
        <h3 className="mt-1 text-xl font-black leading-tight text-white">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function DataTable({ table }: { table: GuideTable }) {
  return (
    <div className="-mx-1 overflow-x-auto rounded-lg border border-slate-800">
      <table className="min-w-[620px] w-full border-collapse text-left text-xs">
        <thead className="bg-slate-950/70 text-[10px] uppercase tracking-widest text-slate-500">
          <tr>
            {table.headers.map((header) => (
              <th key={header} className="border-b border-slate-800 px-3 py-2 font-black">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-950/25">
          {table.rows.map((row) => (
            <tr key={row.join('|')} className="align-top">
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`} className="px-3 py-2 font-semibold leading-relaxed text-slate-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm font-semibold leading-relaxed text-slate-300">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-300" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const GuidesView: React.FC = () => {
  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-10">
      <section className="card border-blue-500/30 bg-blue-600/10">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Guides</p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-white">Digitale Angler-Plattform fuer Deutschland</h2>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-200">
          Ein guter Angel-Guide verbindet Biologie, Recht, Umweltbedingungen und Technik. Die App soll nicht nur Daten sammeln,
          sondern konkrete Entscheidungen am Wasser beschleunigen: Wo suchen, welchen Koeder waehlen, welche Montage passt und
          welche Regeln gelten lokal?
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {['UX draussen', 'Fischbiologie', 'Koeder & Rigs', 'Recht 2026'].map((item) => (
            <div key={item} className="rounded-lg border border-blue-400/20 bg-blue-400/10 px-3 py-2 font-black text-blue-50">
              {item}
            </div>
          ))}
        </div>
      </section>

      <GuideSection kicker="Architektur" title="Interface-Psychologie im Outdoor-Kontext">
        <p className="text-sm font-semibold leading-relaxed text-slate-300">
          Am Wasser zaehlen Klarheit, grosse Touch-Targets und Lesbarkeit bei Sonne, Regen und Daemmerung. Primaere Aktionen
          gehoeren in die Daumenzone, der Dark Mode reduziert Blendung und spart auf OLED-Displays Energie.
        </p>
        <DataTable table={designPrinciples} />
        <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Praediktive UX</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-300">
            Standort, Tageszeit und Gewohnheiten koennen Shortcuts ausloesen: Beissindex bei Sonnenaufgang, passende
            Landesregeln beim Bundeslandwechsel oder Offline-Karten in Empfangsloechern.
          </p>
        </div>
      </GuideSection>

      <GuideSection kicker="Navigation" title="Such- und Filterlogik als Zentrum">
        <p className="text-sm font-semibold leading-relaxed text-slate-300">
          Die Informationsarchitektur sollte natuerliche Sprache, klare Kategorien und multidimensionale Filter kombinieren.
          So findet ein Nutzer nicht nur einen Artikel, sondern eine handlungsrelevante Antwort fuer die aktuelle Situation.
        </p>
        <DataTable table={filterMatrix} />
      </GuideSection>

      <GuideSection kicker="Ichthyologie" title="Fischsteckbriefe und Verhalten">
        <div className="space-y-3">
          {fishProfiles.map((fish) => (
            <article key={fish.name} className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-black text-white">{fish.name}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{fish.scientificName}</p>
                </div>
                <span className="rounded-lg border border-blue-400/20 bg-blue-400/10 px-2 py-1 text-[10px] font-black uppercase text-blue-200">
                  {fish.badge}
                </span>
              </div>
              <p className="text-sm font-semibold leading-relaxed text-slate-300">{fish.text}</p>
              <div className="mt-3">
                <BulletList items={fish.tactics} />
              </div>
            </article>
          ))}
        </div>
        <DataTable table={fishBiology} />
      </GuideSection>

      <GuideSection kicker="Koederoekologie" title="Natuerliche und kuenstliche Reizquellen">
        <div className="grid gap-3 sm:grid-cols-2">
          {baitGroups.map((group) => (
            <div key={group.title} className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
              <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-white">{group.title}</h4>
              <BulletList items={group.items} />
            </div>
          ))}
        </div>
        <p className="text-sm font-semibold leading-relaxed text-slate-300">
          Die Koederwahl sollte Biologie und Physik zusammenfuehren: Geruch und Geschmack bei Naturkoedern, Druckwellen,
          Silhouette, Farbe und Laufverhalten bei Kunstkoedern.
        </p>
      </GuideSection>

      <GuideSection kicker="Praesentation" title="Fuehrungstechniken nach Jahreszeit">
        <div className="grid gap-3 sm:grid-cols-2">
          {techniques.map((technique) => (
            <div key={technique.title} className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
              <h4 className="text-sm font-black text-white">{technique.title}</h4>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">{technique.text}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-yellow-400/25 bg-yellow-400/10 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-200">Saisonlogik</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-yellow-50">
            Im Sommer funktionieren schnelle, aggressive Reize haeufig besser. Im Winter sinkt der Stoffwechsel: langsamer
            fuehren, laengere Pausen setzen und energiereiche Beute imitieren.
          </p>
        </div>
      </GuideSection>

      <GuideSection kicker="Knotenkunde" title="Mechanische Verbindung zum Fisch">
        <p className="text-sm font-semibold leading-relaxed text-slate-300">
          Knoten entscheiden ueber Tragkraft und Kontrolle. Schnur vor dem Festziehen immer befeuchten, damit Reibungshitze
          Monofil, Fluorocarbon oder Geflecht nicht strukturell schwaecht.
        </p>
        <DataTable table={knots} />
        <div className="space-y-2">
          {rigs.map((rig) => (
            <div key={rig.title} className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
              <h4 className="text-sm font-black text-white">{rig.title}</h4>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-300">{rig.text}</p>
            </div>
          ))}
        </div>
      </GuideSection>

      <GuideSection kicker="Compliance" title="Gesetzliche Regelungen und Artenschutz">
        <div className="rounded-lg border border-red-400/25 bg-red-400/10 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-200">Wichtiger Hinweis</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-red-50">
            Die Tabelle dient als redaktionelle Orientierung. Verbindlich sind immer aktuelle Landesverordnungen,
            Gewaesserordnungen, Erlaubnisscheine und Vereinsregeln vor Ort.
          </p>
        </div>
        <DataTable table={legalExamples} />
        <BulletList
          items={[
            'Schonzeiten schuetzen Fische waehrend der Fortpflanzungsphase.',
            'Mindestmasse sollen sicherstellen, dass Fische vor Entnahme mindestens einmal ablaichen konnten.',
            'Lebende Wirbeltiere als Koeder sind in vielen Rechtsraeumen unzulaessig und muessen als Warnhinweis behandelt werden.',
            'Ganzjaehrig geschuetzte Arten wie Stoer, Moderlieschen, Lachs oder regional Quappe brauchen sichere Identifikationshilfen.',
            'Berlin regelt unter anderem Haelterung, Setzkescher und bestimmte Mehrfachhaken besonders detailliert.',
          ]}
        />
      </GuideSection>

      <GuideSection kicker="Markt" title="Differenzierung einer modernen Angel-App">
        <p className="text-sm font-semibold leading-relaxed text-slate-300">
          Plattformen wie Fishbrain oder Alle Angeln zeigen, dass Community, Fangdaten und Karten hohe Erwartungen setzen.
          Eine neue App sollte daher echte Problemlosung liefern statt nur Fanglogs zu sammeln.
        </p>
        <BulletList items={marketFeatures} />
      </GuideSection>

      <GuideSection kicker="Ausblick" title="Tradition trifft Echtzeitdaten">
        <p className="text-sm font-semibold leading-relaxed text-slate-300">
          Der Kern einer digitalen Angler-Plattform ist ein Assistent, der Datenflut in einfache Empfehlungen uebersetzt.
          Wenn Biologie, Recht, Gewaesserzustand und Technik zusammenarbeiten, steigt nicht nur die Fangchance, sondern auch
          die Waidgerechtigkeit und der Schutz der Fischbestaende.
        </p>
      </GuideSection>
    </div>
  );
};

export default GuidesView;
