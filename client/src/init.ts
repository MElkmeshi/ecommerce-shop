/**
 * Initializes the Telegram Mini App SDK.
 * For @tma.js/sdk-react v2, the SDK initializes automatically.
 * This function is kept for any additional setup logic.
 */
export async function init(debug: boolean = false): Promise<void> {
  // The SDK initializes automatically in @tma.js/sdk-react v2
  // Components like viewport, themeParams, etc. are accessed via hooks in components

  if (debug) {
    console.log('🔧 Debug mode enabled');
  }

  console.log('✅ Telegram SDK initialized');
}
