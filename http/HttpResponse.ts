import { Response } from "express";


export class HttpResponse {
  static success(res: Response, data: any, message: string = 'Operación exitosa', statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      statusCode : statusCode
    });
  }
}

