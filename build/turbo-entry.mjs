// Build entry · sprint H · @alvaro 2026-05-10
//
// Re-export del Turbo SDK perquè esbuild resol el path correcte via
// package.json exports map (no cal saber la ruta interna exacta).
// Genera vendor/turbo-sdk.js · usable amb import dinàmic des del browser.

export * from '@ardrive/turbo-sdk/web';
export { default } from '@ardrive/turbo-sdk/web';
