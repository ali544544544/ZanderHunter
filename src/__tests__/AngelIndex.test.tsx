import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AngelIndex from '../components/AngelIndex';

describe('AngelIndex Component', () => {
  it('zeigt den Score korrekt an', () => {
    render(<AngelIndex score={85} loading={false} />);
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText(/Sehr gut/)).toBeInTheDocument();
  });

  it('zeigt Bewertung und Schonzeit-Hinweis gleichzeitig', () => {
    render(
      <AngelIndex
        score={68}
        loading={false}
        scoreDetails={{
          total: 68,
          confidence: 6,
          rating: 'GUT',
          subScores: {
            temperatur: 70,
            barometer: 64,
            hydrologie: 72,
            lichtWind: 60,
          },
          interactionBonus: 4,
          legal: {
            schonzeitAktiv: true,
            entnahmefenster: '45-75 cm',
            baglimit: 2,
            hinweis: 'SCHONZEIT AKTIV: gezieltes Angeln aussetzen.',
          },
          primeWindow: 'Dämmerung',
          topTactic: 'Langsam führen',
          hotspot: 'Kante',
          probability: '68% biologisch, Schonzeit beachten',
        }}
      />
    );

    expect(screen.getByText('68')).toBeInTheDocument();
    expect(screen.getByText(/Gut/)).toBeInTheDocument();
    expect(screen.getByText('Schonzeit aktiv')).toBeInTheDocument();
    expect(screen.getByText(/gezieltes Angeln aussetzen/)).toBeInTheDocument();
  });

  it('zeigt Loading State an', () => {
    render(<AngelIndex score={0} loading={true} />);
    expect(screen.getByText(/Berechne Angel-Index/)).toBeInTheDocument();
  });
});
