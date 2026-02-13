/**
 * Mock Telegram environment for local development.
 * Sets up mock data in window.Telegram for testing.
 */
export function initMockEnv() {
  if (import.meta.env.DEV && !window.Telegram?.WebApp) {
    console.log('🔧 Mocking Telegram environment for development');

    // Mock Telegram WebApp object
    window.Telegram = {
      WebApp: {
        initData: 'user=%7B%22id%22%3A99281932%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22testuser%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1234567890&hash=89d6079ad6762351f38c6dbbc41bb53048019256a9443988af7a48bcad16ba31',
        initDataUnsafe: {
          user: {
            id: 99281932,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            language_code: 'en',
          },
          auth_date: 1234567890,
          hash: '89d6079ad6762351f38c6dbbc41bb53048019256a9443988af7a48bcad16ba31',
        },
        version: '8.0',
        platform: 'unknown',
        colorScheme: 'dark',
        themeParams: {
          bg_color: '#17212b',
          text_color: '#f5f5f5',
          hint_color: '#708499',
          link_color: '#6ab3f3',
          button_color: '#5288c1',
          button_text_color: '#ffffff',
          secondary_bg_color: '#232e3c',
        },
        isExpanded: false,
        viewportHeight: 600,
        viewportStableHeight: 600,
        headerColor: '#17212b',
        backgroundColor: '#17212b',
        isClosingConfirmationEnabled: false,
        BackButton: {
          isVisible: false,
          onClick: (callback: () => void) => {},
          offClick: (callback: () => void) => {},
          show: () => {},
          hide: () => {},
        },
        MainButton: {
          text: '',
          color: '#5288c1',
          textColor: '#ffffff',
          isVisible: false,
          isActive: true,
          isProgressVisible: false,
          setText: (text: string) => {},
          onClick: (callback: () => void) => {},
          offClick: (callback: () => void) => {},
          show: () => {},
          hide: () => {},
          enable: () => {},
          disable: () => {},
          showProgress: () => {},
          hideProgress: () => {},
          setParams: (params: any) => {},
        },
        ready: () => {},
        expand: () => {},
        close: () => {},
        enableClosingConfirmation: () => {},
        disableClosingConfirmation: () => {},
        onEvent: (eventType: string, callback: () => void) => {},
        offEvent: (eventType: string, callback: () => void) => {},
        sendData: (data: string) => {},
        openLink: (url: string) => {},
        openTelegramLink: (url: string) => {},
        openInvoice: (url: string, callback?: (status: string) => void) => {},
        showPopup: (params: any, callback?: (id: string) => void) => {},
        showAlert: (message: string, callback?: () => void) => {},
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => {},
        showScanQrPopup: (params: any, callback?: (text: string) => boolean) => {},
        closeScanQrPopup: () => {},
        readTextFromClipboard: (callback?: (text: string) => void) => {},
        requestWriteAccess: (callback?: (granted: boolean) => void) => {},
        requestContact: (callback?: (granted: boolean) => void) => {},
        requestLocation: (callback?: (location: any) => void) => {},
      } as any,
    } as any;
  }
}
