import { useEffect, useState } from 'react';
import { listWearableProviders } from '../api';
import { PROVIDERS } from '../constants';
import type { Provider } from '../types';

export function useAllowedProviders() {
  const [allowedProviders, setAllowedProviders] = useState<Provider[]>([]);

  useEffect(() => {
    async function loadAllowedProviders() {
      try {
        const response = await listWearableProviders();
        if (response.success && response.sources) {
          setAllowedProviders(response.sources.map((source: any) => mapProvider(source)));
        }
      } catch {
        setAllowedProviders([]);
      }
    }

    void loadAllowedProviders();
  }, []);

  return allowedProviders;
}

function mapProvider(source: any): Provider {
  const logoUrl: string | undefined = source.logo_url || undefined;
  const existing = PROVIDERS.find((provider) => provider.id === source.slug);
  if (existing) return { ...existing, ...(logoUrl ? { logoUrl } : {}) };

  let cat: Provider['cat'] = 'wear';
  let kind = 'Wearable';
  let ic = '⌚';
  let gives = 'Health Data';
  const name = (source.name || source.slug || '').toLowerCase();

  if (name.includes('libre') || name.includes('dexcom') || name.includes('accu')) { cat = 'cgm'; kind = 'CGM'; ic = '🩸'; gives = 'Continuous glucose'; }
  else if (name.includes('scale') || name.includes('renpho') || name.includes('withings')) { cat = 'scale'; kind = 'Smart scale'; ic = '⚖️'; gives = 'Weight & body composition'; }
  else if (name.includes('omron') || name.includes('beurer')) { cat = 'bp'; kind = 'Monitor'; ic = '🩺'; gives = 'Blood pressure'; }
  else if (name.includes('apple') || name.includes('healthconnect') || name.includes('samsung')) { cat = 'ondevice'; kind = 'On-device'; ic = '📱'; gives = 'All health & fitness data'; }
  else if (name.includes('strava') || name.includes('wahoo') || name.includes('peloton') || name.includes('zwift') || name.includes('fit')) { cat = 'app'; kind = 'App'; ic = '🏃'; gives = 'Activity & workouts'; }

  return {
    id: source.slug,
    name: source.name || source.slug,
    cat,
    kind,
    gives,
    ic,
    ...(logoUrl ? { logoUrl } : {}),
  };
}
