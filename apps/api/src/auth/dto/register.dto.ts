import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email invalide' })
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName!: string;
}
