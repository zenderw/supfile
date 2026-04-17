import { IsOptional, IsUUID } from 'class-validator';

export class ListFolderQuery {
  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
