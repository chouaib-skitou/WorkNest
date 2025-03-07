/**
 * dtos/auth.dto.js
 * Data Transfer Object specifically for authentication flows.
 */
import { UserDTO } from "./user.dto.js";

export class AuthDTO {
  /**
   * 
   * @param {Object} params
   * @param {Object} params.user - The raw user object (from DB)
   * @param {string} params.accessToken
   * @param {string} params.refreshToken
   * @param {string|number} params.expiresIn
   */
  constructor({ user, accessToken, refreshToken, expiresIn }) {
    // Nest the user details using UserDTO
    this.user = new UserDTO(user);

    // Include tokens
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    // How long the access token is valid
    this.expiresIn = expiresIn;
  }
}
