import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Validate JWT token by calling the identity service
 * @param {string} token - The JWT token
 * @returns {Promise<Object>} - Returns user data if valid
 * @throws {Error} - Throws an error if the token is invalid or expired
 */
export const validateJwt = async (token) => {
  if (!token) {
    throw new Error("Unauthorized, token required");
  }

  const identityServiceUrl = `${process.env.IDENTITY_SERVICE_URL}/api/auth/authorize`;

  try {
    const response = await axios.get(identityServiceUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.user;
  } catch (error) {
    console.error("JWT validation error:", error.response?.data || error.message);
    throw new Error("Invalid or expired token");
  }
};
