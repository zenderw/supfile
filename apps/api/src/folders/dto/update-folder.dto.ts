import { MAX_NAME_LENGTH } from '@supfile/shared';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateFolderDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NAME_LENGTH)
  name?: string;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsUUID('4')
  parentId?: string | null;
}
