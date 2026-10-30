import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * This class is a middleware function that logs information about incoming requests and outgoing responses.
 *
 */
@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  /**
   * This function is a middleware function that logs information about incoming requests and outgoing responses.
   * This includes the IP address, HTTP method, URL, HTTP status code, response time, parameters, query string, body, and user agent.
   * It also logs whether the request was successful or not, and if not, whether it was a client error or server error.
   * @param request The incoming HTTP request.
   * @param response The outgoing HTTP response.
   * @param next The next middleware function to call in the stack.
   */
  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl: url, params, query } = request;
    const userAgent = request.get('user-agent') ?? 'unknown';
    const startTime = Date.now();

    const logMessage = {
      ip,
      url,
      method,
      params,
      query,
      userAgent,
    };

    this.logger.log('Incoming Request: ', logMessage);

    response.on('finish', () => {
      const { statusCode } = response;
      const responseTime = Date.now() - startTime;
      const responseLogMessage = {
        statusCode,
        ...logMessage,
        responseTime: responseTime + 'ms',
      };

      if (statusCode >= 500) {
        this.logger.error('Request Failed:', responseLogMessage);
      } else if (statusCode >= 400) {
        this.logger.warn('Client Error: ', responseLogMessage);
      } else {
        this.logger.log('Request Completed: ', responseLogMessage);
      }
    });

    next();
  }
}
