export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  username: string;
  authorities: string;
  refreshToken: string;
}

// POST /auth/refresh — rotates the refresh token and issues a fresh access token.
// Note: authorities are not re-sent, so existing roles/permissions are retained.
export interface RefreshResponse {
  token: string;
  type: string;
  username: string;
  refreshToken: string;
}

export interface AuthUser {
  username: string;
  roles: string[];
  permissions: string[];
  token: string;
}
