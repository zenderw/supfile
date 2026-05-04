import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyShareDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;
}
