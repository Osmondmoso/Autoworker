import { registerPlugin } from '@capacitor/core';

export interface AutoWorkerNativePlugin {
  isAccessibilityEnabled(): Promise<{ enabled: boolean }>;
  openAccessibilitySettings(): Promise<void>;
  launchApp(options: { packageName: string }): Promise<void>;
  readVisibleText(): Promise<{ text: string }>;
  readLastExternalScreen(): Promise<{ text: string; packageName: string; capturedAt: number }>;
  clickText(options: { text: string }): Promise<{ clicked: boolean }>;
  typeText(options: { text: string }): Promise<{ typed: boolean }>;
  scroll(options: { direction: 'up' | 'down' }): Promise<{ scrolled: boolean }>;
}

export const AutoWorkerNative = registerPlugin<AutoWorkerNativePlugin>('AutoWorkerNative');
