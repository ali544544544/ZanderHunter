import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AngelIndex from '../components/AngelIndex';

describe('AngelIndex Component', () => {
  it('zeigt den Score korrekt an', () => {
    render(<AngelIndex score={85} loading={false} />);
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText(/Sehr gut/)).toBeInTheDocument();
  });

  it('zeigt Loading State an', () => {
    render(<AngelIndex score={0} loading={true} />);
    expect(screen.getByText(/Berechne Angel-Index/)).toBeInTheDocument();
  });
});
