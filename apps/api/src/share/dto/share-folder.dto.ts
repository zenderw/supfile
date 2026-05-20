import { IsEmail } from 'class-validator';

export class ShareFolderDto {
  @IsEmail({}, { message: 'Email invalide' })
  email!: string;
}
