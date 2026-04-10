# ZanderHunter Hamburg 🎣

Eine progressive Web-App (PWA) für Zander-Angler in Hamburg. Die App liefert Echtzeit-Daten zu Tide, Wetter und Beißzeiten, um den optimalen Angel-Moment nicht zu verpassen.

## Features
- **Angel-Index:** Ein Score von 0–100 basierend auf Luftdruck-Trend, Tide-Phase, Wassertemperatur, Wind und Mondphase.
- **Tide-Timeline:** Übersicht über die nächsten Hoch- und Niedrigwasser-Ereignisse in Hamburg St. Pauli.
- **Spot-Guide:** 7 handverlesene Spots in Hamburg inkl. Score-Bewertung für die aktuellen Bedingungen.
- **Köder-Empfehlungen:** Dynamische Auswahl von Köderfarben, Gewichten und Techniken.
- **PWA Support:** Installierbar auf dem Smartphone, funktioniert offline (Caching).
- **CI/CD:** Automatisierte Tests und Deployment auf GitHub Pages via GitHub Actions.

## Tech Stack
- React (Vite) + TypeScript
- Tailwind CSS
- Vitest (Testing)
- GitHub Actions (CI/CD)

## Entwicklung
1. **Lokal ausführen:** `npm run dev`
2. **Tests laufen lassen:** `npm run test`
3. **Build:** `npm run build`

## Deployment
Wird automatisch bei jedem Push auf den `main` Branch via GitHub Actions auf GitHub Pages veröffentlicht.

---
Entwickelt mit ❤️ für Hamburger Angler.