import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Verify Telegram Web App initData signature.
 * Based on official Telegram documentation.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(initData: string, botToken: string): boolean {
  try {
    // Parse initData query string
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      return false;
    }

    // Remove hash from params for verification
    params.delete('hash');

    // Create data check string (alphabetically sorted)
    const dataCheckArr = Array.from(params.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    const dataCheckString = dataCheckArr
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Calculate secret key using bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate hash using secret key
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch (err) {
    console.error('Error verifying Telegram initData:', err);
    return false;
  }
}

/**
 * Parse user data from Telegram initData
 */
export function parseTelegramUser(initData: string): any | null {
  try {
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');

    if (userParam) {
      return JSON.parse(decodeURIComponent(userParam));
    }

    return null;
  } catch (err) {
    console.error('Error parsing Telegram user:', err);
    return null;
  }
}

/**
 * Express middleware to verify Telegram authentication.
 * Checks the X-Telegram-Init-Data header for valid initData signature.
 */
export function telegramAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (!initData) {
    return res.status(401).json({ error: 'Missing Telegram authentication' });
  }

  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    console.error('BOT_TOKEN not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const isValid = verifyTelegramInitData(initData, botToken);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid Telegram authentication' });
  }

  // Parse user data from initData
  const user = parseTelegramUser(initData);

  if (user) {
    (req as any).telegramUser = user; // Attach user to request
  }

  next();
}

/**
 * Optional middleware - only verifies if header is present
 */
export function optionalTelegramAuth(req: Request, res: Response, next: NextFunction) {
  const initData = req.headers['x-telegram-init-data'] as string;

  if (initData) {
    const botToken = process.env.BOT_TOKEN;

    if (botToken) {
      const isValid = verifyTelegramInitData(initData, botToken);

      if (isValid) {
        const user = parseTelegramUser(initData);
        if (user) {
          (req as any).telegramUser = user;
        }
      }
    }
  }

  next();
}
