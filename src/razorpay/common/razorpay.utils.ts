import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

interface RazorpayErrorBody {
  code?: string;
  description?: string;
}

interface RazorpayErrorShape {
  statusCode?: number | string;
  error?: RazorpayErrorBody;
  code?: string;
  description?: string;
  message?: string;
}

export function mapRazorpayError(error: unknown, fallback: string): HttpException {
  const err = (error ?? {}) as RazorpayErrorShape;
  const status = Number(err.statusCode) || 500;
  const rawDescription = err.error?.description || err.description || err.message;
  const description = rawDescription || fallback;
  const code = err.error?.code || err.code;

  const notFound =
    status === 404 ||
    (rawDescription !== undefined &&
      /does not exist|not exist|not found|no .* found/i.test(rawDescription));

  if (notFound) {
    return new NotFoundException({
      message: rawDescription || 'Resource not found',
      code: code || 'NOT_FOUND',
      provider: 'razorpay',
    });
  }

  const payload = { message: description, code, provider: 'razorpay' };
  if (status === 401) return new UnauthorizedException(payload);
  if (status === 400 || status === 422) return new BadRequestException(payload);
  return new BadGatewayException(payload);
}

export function maskKeyId(keyId: string): string {
  if (!keyId) return '';
  if (keyId.length <= 8) return '****';
  return `${keyId.slice(0, 8)}****${keyId.slice(-4)}`;
}

export function timingSafeHexEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) return false;
  let mismatch = 0;
  for (let i = 0; i < bufferA.length; i += 1) {
    mismatch |= bufferA[i] ^ bufferB[i];
  }
  return mismatch === 0;
}
