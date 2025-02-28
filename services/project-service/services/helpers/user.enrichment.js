import axios from "axios";

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL;

/**
 * Batch fetch user details from the identity service.
 * @param {string[]} userIds - Array of user IDs.
 * @param {string} token - JWT token to authorize the request.
 * @returns {Promise<Object>} - A mapping of userId to user details.
 */
export const fetchUsersByIds = async (userIds, token) => {
  if (!userIds || userIds.length === 0) return {};
  try {
    const response = await axios.post(
      `${IDENTITY_SERVICE_URL}/api/users/batch`,
      { ids: userIds },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Build a lookup map for quick access using the id as key
    return response.data.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching user details:", error);
    return {};
  }
};
