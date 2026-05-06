import React, { useMemo, useState } from 'react';

type SectionId = 'fish' | 'bait' | 'technique' | 'knots' | 'law';

type FishProfile = {
  id: string;
  name: string;
  latin: string;
  icon?: string;
  type: string;
  body: string;
  senses: string;
  food: string;
  habitat: string[];
  season: string;
  tactics: string[];
};

type BaitProfile = {
  id: string;
  name: string;
  visual: 'softbait' | 'wobbler' | 'spinner' | 'worm' | 'corn' | 'fish';
  bestFor: string;
  useWhen: string;
  rig: string;
  action: string;
  mistakes: string[];
};

type TechniqueProfile = {
  id: string;
  name: string;
  bait: string;
  targets: string;
  where: string;
  tempo: string;
  pause: string;
  bite: string;
  steps: string[];
};

type KnotProfile = {
  id: string;
  name: string;
  use: string;
  line: string;
  strength: string;
  steps: string[];
  warning: string;
};

type LegalRow = {
  state: string;
  pikeClosed: string;
  pikeSize: string;
  zanderClosed: string;
  zanderSize: string;
};

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path}`;

const sections: { id: SectionId; label: string; hint: string }[] = [
  { id: 'fish', label: 'Fische', hint: 'Erkennen, finden, verstehen' },
  { id: 'bait', label: 'Koeder', hint: 'Wann welcher Reiz passt' },
  { id: 'technique', label: 'Fuehrung', hint: 'Tempo, Pausen, Bissphase' },
  { id: 'knots', label: 'Knoten', hint: 'Einsatz und Schrittfolge' },
  { id: 'law', label: 'Regeln', hint: 'Schonzeit und Mass' },
];

const fishProfiles: FishProfile[] = [
  {
    id: 'zander',
    name: 'Zander',
    latin: 'Sander lucioperca',
    icon: assetPath('icons/zander.svg'),
    type: 'vorsichtiger Daemmerungsraeuber',
    body: 'Schlanker Koerper, grosses Maul, spitze Hundszaehne und helle Augen. Gebaut fuer kurze Attacken auf schlanke Beutefische.',
    senses: 'Sehr stark bei wenig Licht und Truebung. Er reagiert auf Vibration, Bodenkontakt und saubere Koederfisch-Gerueche.',
    food: 'Laube, Rotauge, kleine Barsche, Grundeln und andere schmale Beutefische.',
    habitat: ['Steinpackung', 'Buhnenkopf', 'harte Kante', 'Spundwand', 'tiefe Rinne'],
    season: 'Fruehjahr nach der Schonzeit und Herbst sind stark. Im Sommer oft nachts oder bei Sauerstoff und Stroemung.',
    tactics: ['Grundnah jiggen oder faulenzen.', 'In der Daemmerung flacher suchen.', 'Im Winter kleine Shads und lange Bodenkontakte.'],
  },
  {
    id: 'hecht',
    name: 'Hecht',
    latin: 'Esox lucius',
    icon: assetPath('icons/hecht.svg'),
    type: 'explosiver Lauerjaeger',
    body: 'Pfeilfoermiger Koerper, weit hinten sitzende Flossen und ein breites Maul mit nach hinten gerichteten Zaehnen.',
    senses: 'Starker Sichtjaeger. Silhouette, Druckwellen und ploetzliche Richtungswechsel loesen Attacken aus.',
    food: 'Fische, Krebse, Froesche und gelegentlich kleine Wasservoegel.',
    habitat: ['Krautkante', 'Schilf', 'Totholz', 'Einlauf', 'windgedruecktes Ufer'],
    season: 'Herbst und fruehes Fruehjahr sind top. Im Hochsommer frueh, spaet und an sauerstoffreichen Zonen.',
    tactics: ['Grosse Koeder mit klarer Silhouette.', 'Stop-and-go am Kraut.', 'Bei kaltem Wasser langsam und nah am Standplatz.'],
  },
  {
    id: 'barsch',
    name: 'Barsch',
    latin: 'Perca fluviatilis',
    icon: assetPath('icons/barsch.svg'),
    type: 'aktiver Schwarmraeuber',
    body: 'Hochrueckig, dunkle Querstreifen, rote Flossen und harte Stachelstrahlen in der ersten Rueckenflosse.',
    senses: 'Reagiert stark auf Futterneid, kleine Fluchtbewegungen und Schwarmaktivitaet von Kleinfischen.',
    food: 'Insektenlarven, Krebse, Jungfische, Grundeln und kleine Weissfische.',
    habitat: ['Spundwand', 'Poller', 'Steinpackung', 'Hafeneinfahrt', 'Kleinfischschwarm'],
    season: 'Sommer bis Herbst sehr aktiv. Im Winter tiefer und oft konzentriert in kleinen Gruppen.',
    tactics: ['Ersten Kontakt ausnutzen und sofort weiterwerfen.', 'Kleine Shads, Dropshot oder Spinner.', 'Grosse Barsche tiefer und strukturgebunden suchen.'],
  },
  {
    id: 'karpfen',
    name: 'Karpfen',
    latin: 'Cyprinus carpio',
    type: 'starker Grundfresser',
    body: 'Gedrungener Koerper, grosse Schuppen oder Spiegelpartien und vier Barteln am Maul.',
    senses: 'Sehr vorsichtig bei Druck, Schnurkontakt und ungewoehnlichem Widerstand. Geruch und Futterspur sind entscheidend.',
    food: 'Larven, Schnecken, Muscheln, Pflanzen, Mais, Tigernuesse und Boilies.',
    habitat: ['Plateau', 'Seerosenkante', 'weicher Grund', 'Futterplatz', 'warme Flachzone'],
    season: 'Mai bis Oktober. Bei warmem Wasser aktiv, bei Hitze eher frueh, spaet oder nachts.',
    tactics: ['Futterplatz sparsam aufbauen.', 'Haarmontage und Selbsthakeffekt nutzen.', 'Schnur sauber ablegen und Stoerung vermeiden.'],
  },
  {
    id: 'forelle',
    name: 'Forelle',
    latin: 'Salmo trutta / Oncorhynchus mykiss',
    type: 'stroemungsliebender Sichtfisch',
    body: 'Torpedofoermig, Fettflosse, feine Schuppen und gute Beschleunigung in Stroemung.',
    senses: 'Sieht sehr gut und reagiert auf natuerliche Drift, Insektenaktivitaet und kleine Beutefisch-Impulse.',
    food: 'Insekten, Larven, Anflugnahrung, Bachflohkrebse und kleine Fische.',
    habitat: ['Gumpen', 'Kehrstroemung', 'unterspueltes Ufer', 'Sauerstoffzone', 'Forellenteichkante'],
    season: 'Kuehles, sauerstoffreiches Wasser. Im Sommer Schatten und Zulauf, im Fruehjahr flacher.',
    tactics: ['Natuerliche Drift oder kleine Spinner.', 'Leise bewegen und tief stehen bleiben.', 'Bei Sonne fein und unauffaellig fischen.'],
  },
];

const baitProfiles: BaitProfile[] = [
  {
    id: 'softbait',
    name: 'Gummifisch',
    visual: 'softbait',
    bestFor: 'Zander, Barsch, Hecht',
    useWhen: 'Wenn du Grund, Kanten oder Tiefe kontrolliert absuchen willst.',
    rig: 'Jigkopf, Cheburashka, Texas Rig oder Dropshot.',
    action: 'Anheben, absinken lassen, Bodenkontakt halten. Farbe: natuerlich bei klarem Wasser, auffaellig bei Truebung.',
    mistakes: ['Zu schwerer Jigkopf', 'kein Bodenkontakt', 'Anhieb zu spaet beim Zander'],
  },
  {
    id: 'wobbler',
    name: 'Wobbler',
    visual: 'wobbler',
    bestFor: 'Hecht, Zander, Forelle, Barsch',
    useWhen: 'Wenn Raeuber aktiv jagen oder in der Daemmerung flach ziehen.',
    rig: 'Direkt an Snap oder Rapala-Schlaufe. Stahl/Titan bei Hechtgefahr.',
    action: 'Einleiern, stop-and-go oder twitchen. Suspender im Winter mit langen Pausen.',
    mistakes: ['Zu schnell im kalten Wasser', 'falsche Lauftiefe', 'zu grosse Snaps bei kleinen Wobblern'],
  },
  {
    id: 'spinner',
    name: 'Spinner / Blinker',
    visual: 'spinner',
    bestFor: 'Barsch, Forelle, Hecht',
    useWhen: 'Wenn Fische aktiv sind und du Flaeche schnell absuchen willst.',
    rig: 'Direkt am Snap, bei Drall mit Wirbel. Bei Hecht immer bissfestes Vorfach.',
    action: 'Konstant fuehren, kurz absinken lassen, ueber Kraut oder Steine lupfen.',
    mistakes: ['Zu tief ueber Hindernissen', 'ohne Wirbel bei starkem Drall', 'monoton bei Nachlaeufern'],
  },
  {
    id: 'worm',
    name: 'Wurm',
    visual: 'worm',
    bestFor: 'Barsch, Aal, Schleie, Brassen',
    useWhen: 'Bei Truebung, Regen, Nacht oder wenn Geruch wichtiger als Optik ist.',
    rig: 'Pose, Grundmontage, Dropshot-Wurm oder kleiner Haken am leichten Blei.',
    action: 'Lebendig anbieten, nicht ueberladen. Kleine Stuecke fuer vorsichtige Bisse.',
    mistakes: ['Haken komplett versteckt', 'zu grosser Koeder fuer kleine Fische', 'zu stramme Schnur bei vorsichtigen Friedfischen'],
  },
  {
    id: 'corn',
    name: 'Mais / Partikel',
    visual: 'corn',
    bestFor: 'Karpfen, Schleie, Rotauge, Brassen',
    useWhen: 'Wenn Friedfische am Platz gehalten werden sollen.',
    rig: 'Pose, Feeder, Haarmontage oder Method Feeder.',
    action: 'Kleine Futterspur, einzelne Koerner am Haken oder Haar. Nicht ueberfuettern.',
    mistakes: ['Zu viel Futter am Anfang', 'zu grober Haken', 'zu spaeter Anschlag bei Posenbissen'],
  },
  {
    id: 'deadbait',
    name: 'Toter Koederfisch',
    visual: 'fish',
    bestFor: 'Zander, Hecht, Aal, Wels',
    useWhen: 'Wenn Geruch, natuerliche Silhouette und passive Praesentation gefragt sind.',
    rig: 'Grundmontage, Pose oder System. Regeln zum Koederfisch immer lokal pruefen.',
    action: 'Frisch, sauber und passend gross. Zander eher schlank, Hecht auch groesser.',
    mistakes: ['Alter Koederfisch', 'zu grosser Widerstand', 'fehlendes Stahlvorfach bei Hechtgefahr'],
  },
];

const techniqueProfiles: TechniqueProfile[] = [
  {
    id: 'jiggen',
    name: 'Jiggen',
    bait: 'Gummifisch am Jigkopf',
    targets: 'Zander, Barsch, Hecht',
    where: 'Kanten, Steinpackungen, Buhnen, harte Boeden, Hafenbecken',
    tempo: 'Sommer: 1-2 schnelle Kurbelumdrehungen. Winter: 1 kurze Rutenspitzenbewegung oder halbe Kurbelumdrehung.',
    pause: 'Absinkphase meistens 1-4 Sekunden. Tiefer oder kaelter: 3-8 Sekunden. Wenn der Koeder sofort liegt, leichter fischen.',
    bite: 'Tock, Schnurstop, seitliches Weglaufen oder ploetzlich kein Bodenkontakt. Sofort Kontakt aufnehmen und anschlagen.',
    steps: ['Auswerfen und bis Grundkontakt warten.', 'Koeder 20-80 cm anheben.', 'Schnur leicht gespannt halten.', 'Absinken beobachten.', 'Nach 2-3 Spruengen kurz liegen lassen.'],
  },
  {
    id: 'faulenzen',
    name: 'Faulenzen',
    bait: 'Gummifisch am Jigkopf',
    targets: 'Zander, Barsch',
    where: 'Harter Grund, Kanten, flache Daemmerungszonen',
    tempo: '1-3 Kurbelumdrehungen aus der Rolle, Rute bleibt eher ruhig.',
    pause: 'Absinkphase 1-5 Sekunden. Im Winter sehr kleine Spruenge und laengere Bodenkontakte.',
    bite: 'Oft als harter Schlag in die lockere Schnur oder als Schnurbogen sichtbar.',
    steps: ['Grundkontakt finden.', 'Nur mit der Rolle anheben.', 'Rute zeigt Richtung Koeder.', 'Absinken kontrollieren.', 'Bei jedem Verdacht anschlagen.'],
  },
  {
    id: 'twitchen',
    name: 'Twitchen',
    bait: 'Suspender-Wobbler oder Minnow',
    targets: 'Barsch, Hecht, Zander, Forelle',
    where: 'Flache Kanten, Krautluecken, Hafenwaende, Daemmerungsbereiche',
    tempo: 'Warm: 2-4 kurze Schlaege, dann Pause. Kalt: 1 Schlag, lange stehen lassen.',
    pause: 'Sommer 1-3 Sekunden. Winter 5-30 Sekunden, besonders mit Suspender.',
    bite: 'Attacke kommt oft in der Pause. Schnur leicht beobachten, nicht komplett schlaff werden lassen.',
    steps: ['Wobbler auf Tiefe bringen.', 'In lockere Schnur schlagen.', 'Koeder ausbrechen lassen.', 'Pause halten.', 'Beim Einschlag direkt Kontakt herstellen.'],
  },
  {
    id: 'spinner',
    name: 'Spinner / Blinker fuehren',
    bait: 'Metallkoeder',
    targets: 'Forelle, Barsch, Hecht',
    where: 'Flachwasser, Einlaeufe, Krautkanten, aktive Schwarmbereiche',
    tempo: 'So langsam wie moeglich, so schnell wie noetig: Blatt muss laufen, Blinker darf nicht kippen.',
    pause: 'Kurze Spinnstopps von 0.5-2 Sekunden. Ueber Kraut nur kurz absinken lassen.',
    bite: 'Meist klarer Einschlag oder ploetzliches Gewicht. Bei Nachlaeufern Tempo kurz brechen.',
    steps: ['Nach dem Wurf kurz absinken lassen.', 'Konstant starten.', 'Tempo variieren.', 'An Hindernissen anlupfen.', 'Vor den Fuessen bis zum Ende fuehren.'],
  },
  {
    id: 'dropshot',
    name: 'Drop-Shot',
    bait: 'Wurm, kleiner Shad, Pintail',
    targets: 'Barsch, Zander, Forelle',
    where: 'Steile Kanten, Spundwaende, tiefe Loecher, unter Boot oder Steg',
    tempo: 'Sehr langsam. Koeder zupfen, ohne ihn stark vom Platz zu bewegen.',
    pause: '2-10 Sekunden stehen lassen. Im Winter noch laenger, nur Schnur zittern lassen.',
    bite: 'Zupfer, leichtes Ziehen oder Druck. Kurz warten, dann kontrolliert anheben.',
    steps: ['Blei auf Grund stellen.', 'Schnur leicht spannen.', 'Koeder zittern lassen.', '30-80 cm versetzen.', 'Biss nicht ueberreissen.'],
  },
  {
    id: 'feeder',
    name: 'Feeder / Grund',
    bait: 'Maden, Mais, Wurm, Pellet',
    targets: 'Brassen, Rotauge, Schleie, Karpfen',
    where: 'Futterplatz, Kante, Schlamm-Sand-Uebergang, ruhige Stroemung',
    tempo: 'Praezise wiederholt werfen. Start alle 3-5 Minuten, spaeter nach Bissfrequenz.',
    pause: 'Rute ruhig. Bei vorsichtigen Bissen 3-10 Sekunden warten, bis der Zug klar wird.',
    bite: 'Zittern in der Spitze, langsames Ziehen oder ploetzliches Zurueckschnellen.',
    steps: ['Clip auf Distanz setzen.', 'Futterkorb fuellen.', 'Immer denselben Punkt treffen.', 'Schnur spannen.', 'Bisse ueber Rutenspitze lesen.'],
  },
];

const knotProfiles: KnotProfile[] = [
  {
    id: 'palomar',
    name: 'Palomar',
    use: 'Snap, Wirbel, Haken',
    line: 'Geflecht, Mono',
    strength: 'sehr hoch',
    steps: ['Schnur doppelt legen.', 'Schlaufe durch die Oese.', 'Einfachen Ueberhandknoten binden.', 'Schlaufe ueber Snap oder Haken legen.', 'Befeuchten und gleichmaessig festziehen.'],
    warning: 'Bei grossen Wobblern unpraktisch, weil die Schlaufe ueber den ganzen Koeder muss.',
  },
  {
    id: 'clinch',
    name: 'Verbesserter Clinch',
    use: 'Haken, Wirbel, kleine Snaps',
    line: 'Mono, Fluorocarbon',
    strength: 'hoch',
    steps: ['Schnur durch die Oese.', '5-7 Windungen um die Hauptschnur.', 'Ende durch die kleine Schlaufe an der Oese.', 'Ende durch die grosse Schlaufe zurueck.', 'Befeuchten und sauber zusammenziehen.'],
    warning: 'Bei glattem Geflecht kann er rutschen. Dann Palomar nutzen.',
  },
  {
    id: 'albright',
    name: 'Albright',
    use: 'Vorfach an Hauptschnur',
    line: 'Geflecht zu Fluorocarbon',
    strength: 'schlank',
    steps: ['Fluorocarbon zur Schlaufe legen.', 'Geflecht durch die Schlaufe fuehren.', '10-12 Windungen zur Schlaufenbasis.', 'Durch die Schlaufe zurueck.', 'Befeuchten, langsam festziehen, Enden kuerzen.'],
    warning: 'Windungen muessen sauber nebeneinander liegen, sonst hakt der Knoten in den Ringen.',
  },
  {
    id: 'rapala',
    name: 'Rapala-Schlaufe',
    use: 'Wobbler ohne Snap',
    line: 'Mono, Fluorocarbon',
    strength: 'beweglich',
    steps: ['Lockeren Ueberhandknoten vorformen.', 'Schnurende durch die Wobbler-Oese.', 'Ende durch den Ueberhandknoten zurueck.', '3-4 Windungen um die Hauptschnur.', 'Zurueck durch den Knoten, befeuchten, festziehen.'],
    warning: 'Schlaufe nicht zu gross machen, sonst verliert der Koeder Kontrolle.',
  },
  {
    id: 'dropshot',
    name: 'Drop-Shot-Knoten',
    use: 'Drop-Shot-Haken',
    line: 'Fluorocarbon',
    strength: '90-Grad-Hakenstand',
    steps: ['Haken mit Spitze nach oben anlegen.', 'Palomar-artig binden.', 'Langes Ende stehen lassen.', 'Ende erneut von oben durch die Oese fuehren.', 'Blei am Ende befestigen.'],
    warning: 'Wenn der Haken nach unten zeigt, das Ende durch die Oese in die andere Richtung fuehren.',
  },
];

const legalRows: LegalRow[] = [
  { state: 'Bayern', pikeClosed: '15.02. - 30.04.', pikeSize: '50 cm', zanderClosed: '15.03. - 30.04.', zanderSize: '50 cm' },
  { state: 'NRW', pikeClosed: '15.02. - 30.04.', pikeSize: '45 cm', zanderClosed: '01.04. - 31.05.', zanderSize: '40 cm' },
  { state: 'Brandenburg', pikeClosed: 'nur Erwerbsfischerei', pikeSize: '45 cm', zanderClosed: 'gewaesserspezifisch', zanderSize: '45 cm' },
  { state: 'Hessen', pikeClosed: 'keine', pikeSize: '50 cm', zanderClosed: 'keine', zanderSize: '45 cm' },
  { state: 'Baden-Wuerttemberg', pikeClosed: '15.02. - 15.05.', pikeSize: '45 cm', zanderClosed: '01.04. - 15.05.', zanderSize: '45 cm' },
  { state: 'Sachsen', pikeClosed: '01.02. - 31.05.', pikeSize: '50 cm', zanderClosed: '01.02. - 31.05.', zanderSize: '50 cm' },
];

function SectionTabs({ activeSection, onChange }: { activeSection: SectionId; onChange: (section: SectionId) => void }) {
  return (
    <div className="sticky top-0 z-20 -mx-1 bg-slate-900/95 py-2 backdrop-blur-md">
      <div className="flex gap-2 overflow-x-auto px-1 pb-1">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onChange(section.id)}
            className={`min-w-[104px] rounded-lg border px-3 py-2 text-left transition-colors ${
              activeSection === section.id
                ? 'border-blue-400/40 bg-blue-500/20 text-white'
                : 'border-slate-800 bg-slate-950/40 text-slate-400'
            }`}
          >
            <span className="block text-xs font-black uppercase">{section.label}</span>
            <span className="mt-0.5 block text-[10px] font-semibold leading-tight opacity-75">{section.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GuidePanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-2xl font-black leading-tight text-white">{title}</h2>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-400">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function ChoiceRow<T extends { id: string; name: string }>({
  items,
  activeId,
  onChange,
}: {
  items: T[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-black uppercase transition-colors ${
            activeId === item.id
              ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100'
              : 'border-slate-800 bg-slate-950/40 text-slate-400'
          }`}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}

function MiniList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm font-semibold leading-relaxed text-slate-300">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FishVisual({ fish }: { fish: FishProfile }) {
  return (
    <div className="relative min-h-[150px] overflow-hidden rounded-lg border border-slate-800 bg-slate-950/45 p-4">
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-cyan-500/15 to-transparent" />
      <div className="absolute left-4 top-5 h-10 w-24 rounded-full bg-emerald-400/10 blur-xl" />
      {fish.icon ? (
        <img src={fish.icon} alt="" className="relative mx-auto h-24 w-full object-contain invert" />
      ) : (
        <div className="relative mx-auto mt-4 flex h-20 max-w-[230px] items-center justify-center">
          <div className="h-14 w-36 rounded-[50%] border border-emerald-300/40 bg-emerald-400/15" />
          <div className="-ml-2 h-0 w-0 border-y-[26px] border-l-[42px] border-y-transparent border-l-emerald-300/40" />
          <div className="-ml-28 h-2 w-2 rounded-full bg-slate-100" />
        </div>
      )}
      <div className="relative mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase text-slate-300">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">Koerper</div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">Sinne</div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">Standplatz</div>
      </div>
    </div>
  );
}

function BaitVisual({ visual }: { visual: BaitProfile['visual'] }) {
  return (
    <div className="relative flex min-h-[128px] items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-950/45">
      <div className="absolute inset-x-4 top-1/2 h-px bg-cyan-300/20" />
      {visual === 'softbait' && (
        <div className="relative flex items-center">
          <div className="h-7 w-24 rounded-full bg-lime-300/80 shadow-lg shadow-lime-900/30" />
          <div className="-ml-1 h-0 w-0 border-y-[18px] border-l-[34px] border-y-transparent border-l-lime-200/80" />
          <div className="-ml-24 h-2 w-2 rounded-full bg-slate-950" />
          <div className="ml-3 h-12 w-8 border-b-2 border-r-2 border-slate-200/70" />
        </div>
      )}
      {visual === 'wobbler' && (
        <div className="relative flex items-center">
          <div className="h-9 w-28 rounded-[50%] bg-amber-300/85" />
          <div className="-ml-2 h-0 w-0 border-y-[18px] border-l-[28px] border-y-transparent border-l-red-300/80" />
          <div className="-ml-24 h-2 w-2 rounded-full bg-slate-950" />
          <div className="-ml-4 mt-10 h-8 w-12 -rotate-12 rounded border border-cyan-200/50" />
        </div>
      )}
      {visual === 'spinner' && (
        <div className="relative flex items-center gap-3">
          <div className="h-12 w-7 rotate-12 rounded-full border border-yellow-200/70 bg-yellow-300/70" />
          <div className="h-px w-20 bg-slate-200/70" />
          <div className="h-10 w-7 border-b-2 border-r-2 border-slate-200/70" />
        </div>
      )}
      {visual === 'worm' && (
        <div className="relative h-16 w-44">
          <div className="absolute left-4 top-7 h-5 w-24 rounded-full bg-rose-300/80" />
          <div className="absolute left-24 top-4 h-5 w-16 rotate-12 rounded-full bg-rose-200/80" />
          <div className="absolute left-36 top-3 h-2 w-2 rounded-full bg-slate-950" />
        </div>
      )}
      {visual === 'corn' && (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, index) => (
            <span key={index} className="h-5 w-5 rounded-full bg-yellow-300/85 shadow-sm shadow-yellow-900/50" />
          ))}
        </div>
      )}
      {visual === 'fish' && (
        <div className="relative flex items-center opacity-80">
          <div className="h-10 w-28 rounded-[50%] bg-slate-300/80" />
          <div className="-ml-1 h-0 w-0 border-y-[22px] border-l-[34px] border-y-transparent border-l-slate-300/80" />
          <div className="-ml-24 h-2 w-2 rounded-full bg-slate-950" />
        </div>
      )}
    </div>
  );
}

function TechniqueMotion({ technique }: { technique: TechniqueProfile }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/45 p-4">
      <div className="relative h-28 overflow-hidden rounded-lg bg-gradient-to-b from-cyan-500/10 via-slate-900 to-slate-950">
        <div className="absolute bottom-5 left-0 right-0 h-px border-t border-dashed border-slate-600" />
        <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
          {technique.steps.slice(0, 5).map((step, index) => (
            <div key={step} className="flex flex-col items-center gap-1">
              <div
                className={`h-3 w-3 rounded-full ${
                  index % 2 === 0 ? 'bg-emerald-300' : 'bg-yellow-300'
                }`}
                style={{ transform: `translateY(-${index % 2 === 0 ? 34 : 12}px)` }}
              />
              <span className="text-[9px] font-black text-slate-500">{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
      <ol className="mt-3 space-y-2">
        {technique.steps.map((step, index) => (
          <li key={step} className="flex gap-2 text-xs font-semibold leading-relaxed text-slate-300">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-black text-blue-200">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function KnotDiagram({ knot }: { knot: KnotProfile }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/45 p-4">
      <div className="relative mb-4 h-28 overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
        <div className="absolute left-6 right-6 top-1/2 h-1 rounded-full bg-cyan-200/80" />
        <div className="absolute left-14 top-8 h-14 w-20 rounded-full border-4 border-yellow-300/80" />
        <div className="absolute right-14 top-10 h-10 w-10 rounded-full border-4 border-slate-300/80" />
        <div className="absolute right-20 top-12 h-12 w-6 border-b-4 border-r-4 border-slate-300/70" />
        <div className="absolute bottom-2 left-3 rounded bg-slate-950/80 px-2 py-1 text-[10px] font-black uppercase text-slate-400">
          Schrittbild statt GIF
        </div>
      </div>
      <div className="space-y-2">
        {knot.steps.map((step, index) => (
          <div key={step} className="flex gap-2 text-xs font-semibold leading-relaxed text-slate-300">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400/20 text-[10px] font-black text-yellow-100">
              {index + 1}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FishGuide() {
  const [activeFishId, setActiveFishId] = useState(fishProfiles[0].id);
  const fish = useMemo(
    () => fishProfiles.find((item) => item.id === activeFishId) ?? fishProfiles[0],
    [activeFishId]
  );

  return (
    <GuidePanel title="Fische erkennen und gezielt suchen" subtitle="Waehle eine Art und lies nur das, was am Wasser hilft.">
      <ChoiceRow items={fishProfiles} activeId={fish.id} onChange={setActiveFishId} />
      <FishVisual fish={fish} />
      <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-white">{fish.name}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{fish.latin}</p>
          </div>
          <span className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-100">
            {fish.type}
          </span>
        </div>
        <div className="grid gap-2">
          <InfoBlock label="Koerper" value={fish.body} />
          <InfoBlock label="Sinne" value={fish.senses} />
          <InfoBlock label="Nahrung" value={fish.food} />
          <InfoBlock label="Saison" value={fish.season} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
          <h4 className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Standplaetze</h4>
          <div className="flex flex-wrap gap-2">
            {fish.habitat.map((place) => (
              <span key={place} className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-xs font-bold text-cyan-100">
                {place}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/35 p-3">
          <h4 className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Direkte Taktik</h4>
          <MiniList items={fish.tactics} />
        </div>
      </div>
    </GuidePanel>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/45 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-300">{value}</p>
    </div>
  );
}

function BaitGuide() {
  const [activeBaitId, setActiveBaitId] = useState(baitProfiles[0].id);
  const bait = useMemo(
    () => baitProfiles.find((item) => item.id === activeBaitId) ?? baitProfiles[0],
    [activeBaitId]
  );

  return (
    <GuidePanel title="Koeder: Reiz, Einsatz, Fehler" subtitle="Interaktiv nach Koedertyp. Fokus: wann einsetzen, wie anbieten, was vermeiden.">
      <ChoiceRow items={baitProfiles} activeId={bait.id} onChange={setActiveBaitId} />
      <BaitVisual visual={bait.visual} />
      <div className="grid gap-2">
        <InfoBlock label="Faengt vor allem" value={bait.bestFor} />
        <InfoBlock label="Einsetzen wenn" value={bait.useWhen} />
        <InfoBlock label="Montage" value={bait.rig} />
        <InfoBlock label="Fuehrung / Praesentation" value={bait.action} />
      </div>
      <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3">
        <h4 className="mb-2 text-xs font-black uppercase tracking-widest text-red-100">Haefige Fehler</h4>
        <MiniList items={bait.mistakes} />
      </div>
    </GuidePanel>
  );
}

function TechniqueGuide() {
  const [activeTechniqueId, setActiveTechniqueId] = useState(techniqueProfiles[0].id);
  const technique = useMemo(
    () => techniqueProfiles.find((item) => item.id === activeTechniqueId) ?? techniqueProfiles[0],
    [activeTechniqueId]
  );

  return (
    <GuidePanel title="Fuehrung: Tempo, Pause, Bissphase" subtitle="Konkrete Zeiten und Ablaufe statt allgemeiner Taktiktexte.">
      <ChoiceRow items={techniqueProfiles} activeId={technique.id} onChange={setActiveTechniqueId} />
      <TechniqueMotion technique={technique} />
      <div className="grid gap-2">
        <InfoBlock label="Koeder" value={technique.bait} />
        <InfoBlock label="Zielfische" value={technique.targets} />
        <InfoBlock label="Wo" value={technique.where} />
        <InfoBlock label="Tempo" value={technique.tempo} />
        <InfoBlock label="Pause / Phase" value={technique.pause} />
        <InfoBlock label="Biss erkennen" value={technique.bite} />
      </div>
    </GuidePanel>
  );
}

function KnotGuide() {
  const [activeKnotId, setActiveKnotId] = useState(knotProfiles[0].id);
  const knot = useMemo(
    () => knotProfiles.find((item) => item.id === activeKnotId) ?? knotProfiles[0],
    [activeKnotId]
  );

  return (
    <GuidePanel title="Knoten: welcher, wann, wie" subtitle="Mit Schrittbild. Echte GIFs waeren fuer Fingerfuehrung und Zugrichtung sinnvoll.">
      <ChoiceRow items={knotProfiles} activeId={knot.id} onChange={setActiveKnotId} />
      <div className="grid gap-2 sm:grid-cols-3">
        <InfoBlock label="Einsatz" value={knot.use} />
        <InfoBlock label="Schnur" value={knot.line} />
        <InfoBlock label="Vorteil" value={knot.strength} />
      </div>
      <KnotDiagram knot={knot} />
      <div className="rounded-lg border border-yellow-400/25 bg-yellow-400/10 p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-yellow-100">Wichtig</p>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-yellow-50">
          {knot.warning} Immer befeuchten, langsam zuziehen und beide Enden kontrollieren.
        </p>
      </div>
    </GuidePanel>
  );
}

function LawGuide() {
  return (
    <GuidePanel title="Schonzeiten und Mindestmasse" subtitle="Kurze Orientierung. Lokal immer aktuellen Erlaubnisschein und Gewaesserordnung pruefen.">
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-[620px] w-full border-collapse text-left text-xs">
          <thead className="bg-slate-950/70 text-[10px] uppercase tracking-widest text-slate-500">
            <tr>
              <th className="border-b border-slate-800 px-3 py-2">Bundesland</th>
              <th className="border-b border-slate-800 px-3 py-2">Hecht Schonzeit</th>
              <th className="border-b border-slate-800 px-3 py-2">Hecht Mass</th>
              <th className="border-b border-slate-800 px-3 py-2">Zander Schonzeit</th>
              <th className="border-b border-slate-800 px-3 py-2">Zander Mass</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950/25">
            {legalRows.map((row) => (
              <tr key={row.state}>
                <td className="px-3 py-2 font-black text-slate-100">{row.state}</td>
                <td className="px-3 py-2 font-semibold text-slate-300">{row.pikeClosed}</td>
                <td className="px-3 py-2 font-semibold text-slate-300">{row.pikeSize}</td>
                <td className="px-3 py-2 font-semibold text-slate-300">{row.zanderClosed}</td>
                <td className="px-3 py-2 font-semibold text-slate-300">{row.zanderSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GuidePanel>
  );
}

const GuidesView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('fish');

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10">
      <section className="card border-emerald-400/20 bg-emerald-400/10">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Guide-Bibliothek</p>
        <h1 className="mt-1 text-2xl font-black leading-tight text-white">Kurz, visuell, direkt nutzbar</h1>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-200">
          Waehle ein Thema. Jeder Guide zeigt konkrete Erkennung, Einsatzbereiche, Zeiten, Fehler und Schrittfolgen.
        </p>
      </section>

      <SectionTabs activeSection={activeSection} onChange={setActiveSection} />

      {activeSection === 'fish' && <FishGuide />}
      {activeSection === 'bait' && <BaitGuide />}
      {activeSection === 'technique' && <TechniqueGuide />}
      {activeSection === 'knots' && <KnotGuide />}
      {activeSection === 'law' && <LawGuide />}
    </div>
  );
};

export default GuidesView;
