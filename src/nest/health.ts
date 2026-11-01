import { Controller, Get, Inject, Module, Res, type DynamicModule } from '@nestjs/common';
import type { Response } from 'express';
import type { DataSource } from 'typeorm';
import { buildVersion, versionedName } from '../config/buildVersion';
import { DATA_SOURCE } from './tokens';

export interface HealthOptions {
  /** The service's code («arcana»). */
  service: string;
  /** Its name for people («Arcana»); it is published with the version («Arcana v0.5.2»). */
  name: string;
  /**
   * Any origin may ask: a landing page that shows whether the service is up. The header goes
   * on before the database is asked, so a failing check arrives as a failure and not as a
   * CORS error that reads as «down».
   */
  public?: boolean;
}

export const HEALTH_OPTIONS = Symbol('HEALTH_OPTIONS');

@Controller('health')
class HealthController {
  constructor(
    @Inject(DATA_SOURCE) private readonly database: DataSource,
    @Inject(HEALTH_OPTIONS) private readonly options: HealthOptions,
  ) {}

  @Get()
  async health(@Res({ passthrough: true }) res: Response) {
    if (this.options.public) res.setHeader('Access-Control-Allow-Origin', '*');
    await this.database.query('SELECT 1');
    return {
      status: 'ok',
      service: this.options.service,
      name: versionedName(this.options.name),
      version: buildVersion(),
    };
  }
}

/** `GET /health`: the database answers, and which release is running (`buildVersion`). */
@Module({})
export class HealthModule {
  static forRoot(options: HealthOptions): DynamicModule {
    return {
      module: HealthModule,
      controllers: [HealthController],
      providers: [{ provide: HEALTH_OPTIONS, useValue: options }],
    };
  }
}
