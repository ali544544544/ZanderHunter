import { describe, expect, it } from 'vitest';
import { FallbackProvider } from '../providers/FallbackProvider';

describe('FallbackProvider local water detection', () => {
  it('recognizes a map point on the Dove-Elbe', async () => {
    const provider = new FallbackProvider();
    const profile = await provider.getWaterBodyProfile(53.511, 10.121);

    expect(profile.name).toBe('Dove-Elbe');
    expect(profile.type).toBe('river');
    expect(profile.dataQuality).toBe('medium');
    expect(profile.sources).toContain('user_report');
    expect(profile.species.some((entry) => entry.species === 'zander')).toBe(true);
    expect(profile.species.some((entry) => entry.species === 'aal')).toBe(true);
    expect(profile.links?.some((link) => link.label.includes('hejfish'))).toBe(true);
  });

  it('recognizes a map point on the Elbe as a river', async () => {
    const provider = new FallbackProvider();
    const profile = await provider.getWaterBodyProfile(53.545, 9.89);

    expect(profile.name).toBe('Elbe');
    expect(profile.type).toBe('river');
    expect(profile.species.length).toBeGreaterThanOrEqual(8);
  });
});
