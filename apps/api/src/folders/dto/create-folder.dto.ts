import { MAX_NAME_LENGTH } from '@supfile/shared';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @MinLength(1, { message: 'Le nom ne peut pas être vide' })
  @MaxLength(MAX_NAME_LENGTH)
  name!: string;

  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
