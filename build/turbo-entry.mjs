// Build entry · sprint H · @alvaro 2026-05-10 · ampliat sprint A2 2026-05-12
// Re-exporta named exports del Turbo SDK + ArconnectSigner d'arbundles ·
// esbuild resol els paths reals via package.json exports map.
export * from '@ardrive/turbo-sdk/web';
// WALLET-AUTH-001 sprint A2 · ArconnectSigner per signar via Wander extension
export { ArconnectSigner } from '@dha-team/arbundles/web';
