import { Response } from "express";


export class HttpResponse {
  static success(res: Response, data: any, message = "Operación exitosa", statusCode = 200) {
    if (data && data.data && data.pagination) {
      return res.status(statusCode).json({
        success: true,
        message,
        ...data,
        statusCode
      });
    }

    return res.status(statusCode).json({
      success: true,
      message,
      data,
      statusCode
    });
  }

}

