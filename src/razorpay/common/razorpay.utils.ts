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
  const description =
    err.error?.description || err.description || err.message || fallback;
  const code = err.error?.code || err.code;

  const payload = { message: description, code, provider: 'razorpay' };

  const notFound =
    status === 404 ||
    /does not exist|not exist|not found|not a valid id|no .* found/i.test(
      description,
    );

  if (notFound) {
    return new NotFoundException({
      ...payload,
      message: description || 'Resource not found',
      code: code || 'NOT_FOUND',
    });
  }
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
