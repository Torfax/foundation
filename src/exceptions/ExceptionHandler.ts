// src/core/middleware/exceptionHandler.ts
import { BadRequestException, HttpException, isHttpException, NotFoundException } from './HttpException';
import { Request, Response, NextFunction } from 'express';


// Interfaz para la respuesta de error estandarizada
interface ErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: any; // aca se inserta el objeto "data"
    timestamp: string;
    path: string;
    stack?: string;
  };
}

export class ExceptionHandler {
  /**
   * Middleware principal para manejar errores
   */
  public static handle() {
    return (error: Error | HttpException, req: Request, res: Response, next: NextFunction) => {
      // Si es una HttpException, manejarla específicamente
      if (isHttpException(error)) {
        return ExceptionHandler.handleHttpException(error as HttpException, req, res);
      }

      // Si es un error de sintaxis JSON (común en Express)
      if (error instanceof SyntaxError && 'body' in req) {
        return ExceptionHandler.handleHttpException(
          new BadRequestException('Invalid JSON payload'),
          req,
          res
        );
      }

      // Error genérico no controlado
      return ExceptionHandler.handleUnknownError(error, req, res);
    };
  }

  /**
   * Maneja excepciones HTTP conocidas
   */
  private static handleHttpException(exception: HttpException, req: Request, res: Response) {
    const statusCode = exception.statusCode;
    const errorCode = ExceptionHandler.getErrorCode(exception);
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message: exception.message,
        details: exception.data || null,
        timestamp: new Date().toISOString(),
        path: req.path,
      }
    };

    // Incluir stack trace solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.stack = exception.stack;
    }

    // Log del error
    ExceptionHandler.logException(exception, req);

    return res.status(statusCode).json(errorResponse);
  }

  /**
   * Maneja errores desconocidos
   */
  private static handleUnknownError(error: Error, req: Request, res: Response) {
    console.error('❌ Unhandled Error:', error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: req.path,
      }
    };

    // En desarrollo, incluir más detalles
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.details = {
        originalError: error.message,
        stack: error.stack
      };
    }

    return res.status(500).json(errorResponse);
  }

  /**
   * Genera códigos de error legibles a partir del nombre de la clase
   */
  private static getErrorCode(exception: HttpException): string {
    const className = exception.constructor.name;

    // Remover 'Exception' del nombre y convertir a SNAKE_CASE
    const baseName = className.replace('Exception', '');
    const snakeCase = baseName.replace(/([A-Z])/g, '_$1').toUpperCase();

    return snakeCase.startsWith('_') ? snakeCase.slice(1) : snakeCase;
  }

  /**
   * Sistema de logging para excepciones
   */
  private static logException(exception: HttpException, req: Request) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: exception.statusCode,
      message: exception.message,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      details: exception.data
    };

    // Diferentes niveles de log según el status code
    if (exception.statusCode >= 500) {
      console.error('Server Error:', logEntry);
    } else if (exception.statusCode >= 400) {
      console.warn('Client Error:', logEntry);
    } else {
      console.info('Application Error:', logEntry);
    }
  }

  /**
   * Middleware para rutas no encontradas (404)
   */
  public static notFoundHandler() {
    return (req: Request, res: Response, next: NextFunction) => {
      const exception = new NotFoundException(`Route ${req.method} ${req.path} not found`);
      ExceptionHandler.handleHttpException(exception, req, res);
    };
  }

  /**
   * Middleware para manejo de errores asíncronos
   */
  public static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

// Exportar una instancia por conveniencia
export const exceptionHandler = ExceptionHandler;

// Exportar middleware preconfigurado
export const handleExceptions = ExceptionHandler.handle();
export const handleNotFound = ExceptionHandler.notFoundHandler();
export const asyncHandler = ExceptionHandler.asyncHandler;