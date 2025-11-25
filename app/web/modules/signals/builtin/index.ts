// app/web/modules/signals/builtin/index.ts

import type { SignalDefinition } from '../types';
import { volumeBurst1mSignal, volumeBurst5mSignal } from './volumeBurst';

/**
 * Built-in signals that ship with the app. This list will grow over time
 * (momentum, VWAP deviation, volatility compression, etc.).
 */
export const builtinSignals: SignalDefinition[] = [
  volumeBurst1mSignal,
  volumeBurst5mSignal,
];
