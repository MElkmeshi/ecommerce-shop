import axios from 'axios';

export interface OrderWebhookPayload {
  orderId: number;
  phoneNumber: string;
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  totalAmount: number;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  telegramUser: {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    languageCode?: string;
  };
  timestamp: string;
}

/**
 * Send order notification to webhook URL
 */
export async function sendOrderNotification(payload: OrderWebhookPayload): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('⚠️ WEBHOOK_URL not configured, skipping webhook notification');
    return;
  }

  try {
    console.log(`📤 Sending order webhook for order #${payload.orderId}...`);

    const response = await axios.post(webhookUrl, payload, {
      timeout: 5000, // 5 second timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Telegram-Ecommerce-Bot/1.0',
      },
    });

    console.log(`✅ Webhook sent successfully: ${response.status}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Webhook failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error('❌ Webhook failed:', error);
    }

    // Don't throw error - webhook failure shouldn't block order creation
    // Just log the error for monitoring
  }
}

/**
 * Test webhook connection
 */
export async function testWebhook(): Promise<boolean> {
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('⚠️ WEBHOOK_URL not configured');
    return false;
  }

  try {
    const response = await axios.post(
      webhookUrl,
      {
        test: true,
        message: 'Webhook connection test',
        timestamp: new Date().toISOString(),
      },
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Webhook test successful: ${response.status}`);
    return true;
  } catch (error) {
    console.error('❌ Webhook test failed:', error);
    return false;
  }
}
