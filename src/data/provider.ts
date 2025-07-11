/**
 * @fileOverview Data provider factory.
 * This file is responsible for determining which data provider to use.
 * For now, it's hardcoded to use the local file system provider.
 * In the future, this could be extended to support other data sources like Firestore.
 */

import { LocalProvider } from './local-provider';
import type { DataProvider } from '@/types/data-provider';

let provider: DataProvider;

export function getProvider(): DataProvider {
  if (!provider) {
    // For now, we only have one provider.
    // A more complex app might have logic to switch providers based on environment.
    provider = new LocalProvider();
  }
  return provider;
}
