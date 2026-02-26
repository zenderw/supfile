import type { User as UserShared } from '@supfile/shared';

export interface AuthResponseDto {
  user: UserShared;
  accessToken: string;
  refreshToken: string;
}
