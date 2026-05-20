import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export type SearchCategory = 'all' | 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'other';

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['all', 'folder', 'file'])
  type?: 'all' | 'folder' | 'file' = 'all';

  @IsOptional()
  @IsIn(['all', 'image', 'video', 'audio', 'pdf', 'document', 'other'])
  category?: SearchCategory = 'all';

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
