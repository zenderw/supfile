import { IsString, MinLength } from 'class-validator';

export class GoogleMobileDto {
  @IsString()
  @MinLength(1)
  idToken!: string;
}
