import {
  DEFAULT_PRIMARY_COLOR,
  getBrandingTheme,
  getBrandingThemeVariables,
  getContrastRatio,
  isAccessibleBrandColor,
  normalizeHexColor,
} from '@/lib/branding-theme';

describe('branding-theme', () => {
  it('normalizes 6-digit hex colors and rejects invalid values', () => {
    expect(normalizeHexColor('2d9d6a')).toBe('#2D9D6A');
    expect(normalizeHexColor('  #ffffff  ')).toBe('#FFFFFF');
    expect(normalizeHexColor('#FFF')).toBeNull();
    expect(normalizeHexColor('')).toBeNull();
  });

  it('falls back to the default primary color when the input is invalid', () => {
    expect(getBrandingTheme('bad-color')).toEqual({ primaryColor: DEFAULT_PRIMARY_COLOR });
  });

  it('builds theme variables and chooses a readable foreground color', () => {
    expect(getBrandingThemeVariables('#1A1A1A')).toMatchObject({
      '--accent': '#1A1A1A',
      '--accent-foreground': '#FFFFFF',
    });

    expect(getBrandingThemeVariables('#F3F4F6')).toMatchObject({
      '--accent': '#F3F4F6',
      '--accent-foreground': '#1A1A1A',
    });
  });

  it('computes accessibility based on white-text contrast', () => {
    expect(getContrastRatio('#000000', '#FFFFFF')).toBeGreaterThan(20);
    expect(isAccessibleBrandColor('#1A1A1A')).toBe(true);
    expect(isAccessibleBrandColor('#F3F4F6')).toBe(false);
  });
});
