import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryRequestDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => {
    try {
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  })
  filters?: any[] = [];

  @IsOptional()
  @Transform(({ value }) => {
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  })
  sort?: { field: string; direction: 'ASC' | 'DESC' } | null = null;
}