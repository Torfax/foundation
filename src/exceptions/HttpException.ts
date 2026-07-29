// src/exceptions/HttpException.ts
export class HttpException extends Error {
  public statusCode: number;
  public data?: any;

  constructor(message: string, statusCode: number = 500, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    Object.setPrototypeOf(this, new.target.prototype); // Fix para instanceof
    Error.captureStackTrace(this);
  }
}

// 4xx Client Errors
export class BadRequestException extends HttpException {
  constructor(message: string = "Bad Request", data?: any) {
    super(message, 400, data);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = "Unauthorized", data?: any) {
    super(message, 401, data);
  }
}

export class PaymentRequiredException extends HttpException {
  constructor(message: string = "Payment Required", data?: any) {
    super(message, 402, data);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = "Forbidden", data?: any) {
    super(message, 403, data);
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string = "Not Found", data?: any) {
    super(message, 404, data);
  }
}

export class MethodNotAllowedException extends HttpException {
  constructor(message: string = "Method Not Allowed", data?: any) {
    super(message, 405, data);
  }
}

export class NotAcceptableException extends HttpException {
  constructor(message: string = "Not Acceptable", data?: any) {
    super(message, 406, data);
  }
}

export class ProxyAuthenticationRequiredException extends HttpException {
  constructor(message: string = "Proxy Authentication Required", data?: any) {
    super(message, 407, data);
  }
}

export class RequestTimeoutException extends HttpException {
  constructor(message: string = "Request Timeout", data?: any) {
    super(message, 408, data);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string = "Conflict", data?: any) {
    super(message, 409, data);
  }
}

export class GoneException extends HttpException {
  constructor(message: string = "Gone", data?: any) {
    super(message, 410, data);
  }
}

export class LengthRequiredException extends HttpException {
  constructor(message: string = "Length Required", data?: any) {
    super(message, 411, data);
  }
}

export class PreconditionFailedException extends HttpException {
  constructor(message: string = "Precondition Failed", data?: any) {
    super(message, 412, data);
  }
}

export class PayloadTooLargeException extends HttpException {
  constructor(message: string = "Payload Too Large", data?: any) {
    super(message, 413, data);
  }
}

export class URITooLongException extends HttpException {
  constructor(message: string = "URI Too Long", data?: any) {
    super(message, 414, data);
  }
}

export class UnsupportedMediaTypeException extends HttpException {
  constructor(message: string = "Unsupported Media Type", data?: any) {
    super(message, 415, data);
  }
}

export class RangeNotSatisfiableException extends HttpException {
  constructor(message: string = "Range Not Satisfiable", data?: any) {
    super(message, 416, data);
  }
}

export class ExpectationFailedException extends HttpException {
  constructor(message: string = "Expectation Failed", data?: any) {
    super(message, 417, data);
  }
}

export class ImATeapotException extends HttpException {
  constructor(message: string = "I'm a teapot", data?: any) {
    super(message, 418, data);
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(message: string = "Unprocessable Entity", data?: any) {
    super(message, 422, data);
  }
}

export class LockedException extends HttpException {
  constructor(message: string = "Locked", data?: any) {
    super(message, 423, data);
  }
}

export class FailedDependencyException extends HttpException {
  constructor(message: string = "Failed Dependency", data?: any) {
    super(message, 424, data);
  }
}

export class TooEarlyException extends HttpException {
  constructor(message: string = "Too Early", data?: any) {
    super(message, 425, data);
  }
}

export class UpgradeRequiredException extends HttpException {
  constructor(message: string = "Upgrade Required", data?: any) {
    super(message, 426, data);
  }
}

export class PreconditionRequiredException extends HttpException {
  constructor(message: string = "Precondition Required", data?: any) {
    super(message, 428, data);
  }
}

export class TooManyRequestsException extends HttpException {
  constructor(message: string = "Too Many Requests", data?: any) {
    super(message, 429, data);
  }
}

export class RequestHeaderFieldsTooLargeException extends HttpException {
  constructor(message: string = "Request Header Fields Too Large", data?: any) {
    super(message, 431, data);
  }
}

export class UnavailableForLegalReasonsException extends HttpException {
  constructor(message: string = "Unavailable For Legal Reasons", data?: any) {
    super(message, 451, data);
  }
}

// 5xx Server Errors
export class InternalServerErrorException extends HttpException {
  constructor(message: string = "Internal Server Error", data?: any) {
    super(message, 500, data);
  }
}

export class NotImplementedException extends HttpException {
  constructor(message: string = "Not Implemented", data?: any) {
    super(message, 501, data);
  }
}

export class BadGatewayException extends HttpException {
  constructor(message: string = "Bad Gateway", data?: any) {
    super(message, 502, data);
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(message: string = "Service Unavailable", data?: any) {
    super(message, 503, data);
  }
}

export class GatewayTimeoutException extends HttpException {
  constructor(message: string = "Gateway Timeout", data?: any) {
    super(message, 504, data);
  }
}

export class HTTPVersionNotSupportedException extends HttpException {
  constructor(message: string = "HTTP Version Not Supported", data?: any) {
    super(message, 505, data);
  }
}

export class VariantAlsoNegotiatesException extends HttpException {
  constructor(message: string = "Variant Also Negotiates", data?: any) {
    super(message, 506, data);
  }
}

export class InsufficientStorageException extends HttpException {
  constructor(message: string = "Insufficient Storage", data?: any) {
    super(message, 507, data);
  }
}

export class LoopDetectedException extends HttpException {
  constructor(message: string = "Loop Detected", data?: any) {
    super(message, 508, data);
  }
}

export class NotExtendedException extends HttpException {
  constructor(message: string = "Not Extended", data?: any) {
    super(message, 510, data);
  }
}

export class NetworkAuthenticationRequiredException extends HttpException {
  constructor(message: string = "Network Authentication Required", data?: any) {
    super(message, 511, data);
  }
}

// Excepciones personalizadas comunes para aplicaciones web
export class ValidationException extends HttpException {
  constructor(message: string = "Validation Error", data?: any) {
    super(message, 422, data);
  }
}

export class RateLimitException extends HttpException {
  constructor(message: string = "Rate Limit Exceeded", data?: any) {
    super(message, 429, data);
  }
}

export class DatabaseException extends HttpException {
  constructor(message: string = "Database Error", data?: any) {
    super(message, 500, data);
  }
}

export class ExternalServiceException extends HttpException {
  constructor(message: string = "External Service Error", data?: any) {
    super(message, 502, data);
  }
}

export class MaintenanceException extends HttpException {
  constructor(message: string = "Service Under Maintenance", data?: any) {
    super(message, 503, data);
  }
}

// Helper para crear excepciones personalizadas rápidamente
export const createHttpException = (
  statusCode: number,
  message: string,
  data?: any
): HttpException => {
  return new HttpException(message, statusCode, data);
};

// Helper para verificar si un error es una HttpException
export const isHttpException = (error: any): error is HttpException => {
  return error instanceof HttpException;
};

// Mapa de códigos de estado a excepciones (útil para factories)
export const statusCodeToException: Record<number, new (message?: string, data?: any) => HttpException> = {
  400: BadRequestException,
  401: UnauthorizedException,
  402: PaymentRequiredException,
  403: ForbiddenException,
  404: NotFoundException,
  405: MethodNotAllowedException,
  406: NotAcceptableException,
  407: ProxyAuthenticationRequiredException,
  408: RequestTimeoutException,
  409: ConflictException,
  410: GoneException,
  411: LengthRequiredException,
  412: PreconditionFailedException,
  413: PayloadTooLargeException,
  414: URITooLongException,
  415: UnsupportedMediaTypeException,
  416: RangeNotSatisfiableException,
  417: ExpectationFailedException,
  418: ImATeapotException,
  422: UnprocessableEntityException,
  423: LockedException,
  424: FailedDependencyException,
  425: TooEarlyException,
  426: UpgradeRequiredException,
  428: PreconditionRequiredException,
  429: TooManyRequestsException,
  431: RequestHeaderFieldsTooLargeException,
  451: UnavailableForLegalReasonsException,
  500: InternalServerErrorException,
  501: NotImplementedException,
  502: BadGatewayException,
  503: ServiceUnavailableException,
  504: GatewayTimeoutException,
  505: HTTPVersionNotSupportedException,
  506: VariantAlsoNegotiatesException,
  507: InsufficientStorageException,
  508: LoopDetectedException,
  510: NotExtendedException,
  511: NetworkAuthenticationRequiredException,
};