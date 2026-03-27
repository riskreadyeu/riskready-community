import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import * as net from 'node:net';

/**
 * Check whether a hostname resolves to a private/internal IP range.
 * Uses string-based checks for hostnames and numeric checks for IPs.
 */
function isPrivateHost(hostname: string): boolean {
  // Block well-known internal hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    return true;
  }

  // If it's an IP address, check private ranges
  if (net.isIPv4(hostname)) {
    const parts = hostname.split('.');
    const a = Number(parts[0]);
    const b = Number(parts[1]);
    const c = Number(parts[2]);
    const d = Number(parts[3]);
    const ip = (a << 24) | (b << 16) | (c << 8) | d;
    return (
      (ip >>> 24) === 127 ||          // 127.0.0.0/8 (loopback)
      (ip >>> 24) === 10 ||            // 10.0.0.0/8
      (ip >>> 20) === 0xAC1 ||         // 172.16.0.0/12
      (ip >>> 16) === 0xC0A8 ||        // 192.168.0.0/16
      (ip >>> 16) === 0xA9FE ||        // 169.254.0.0/16 (link-local / cloud metadata)
      (ip >>> 24) === 0               // 0.0.0.0/8
    );
  }

  if (net.isIPv6(hostname)) {
    // Block IPv6 loopback and link-local
    return hostname === '::1' || hostname.startsWith('fe80:') || hostname.startsWith('fc') || hostname.startsWith('fd');
  }

  return false;
}

export function isUrlSafe(url: string): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Only http and https schemes are allowed' };
    }

    if (parsed.username || parsed.password) {
      return { safe: false, reason: 'URLs with embedded credentials are not allowed' };
    }

    if (isPrivateHost(parsed.hostname)) {
      return { safe: false, reason: 'URL points to a private or internal address' };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }
}

@ValidatorConstraint({ name: 'isSafeUrl', async: false })
class IsSafeUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    return isUrlSafe(value).safe;
  }

  defaultMessage(): string {
    return 'URL must be a valid http/https URL that does not point to private or internal addresses';
  }
}

export function IsSafeUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeUrlConstraint,
    });
  };
}
