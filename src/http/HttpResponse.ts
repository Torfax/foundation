import { Response } from "express";


export class HttpResponse {
  static success(res: Response, data: any, message = "Operación exitosa", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      payload: data,
      statusCode
    });
  }

  static err(res: Response, data: any, message = "Operación fallida", statusCode = 400) {
    return res.status(statusCode).json({
      success: false,
      message,
      payload: data,
      statusCode
    });
  }

}

