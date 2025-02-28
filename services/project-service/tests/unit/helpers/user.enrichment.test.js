import axios from "axios";
import { fetchUsersByIds } from "../../../services/helpers/user.enrichment.js";

jest.mock("axios");

describe("fetchUsersByIds", () => {
  const token = "test-token";
  const userIds = ["id1", "id2"];
  const identityServiceUrl = process.env.IDENTITY_SERVICE_URL; // Make sure to set this in your test environment

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns an empty object when userIds is an empty array", async () => {
    const result = await fetchUsersByIds([], token);
    expect(result).toEqual({});
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("returns an empty object when userIds is null", async () => {
    const result = await fetchUsersByIds(null, token);
    expect(result).toEqual({});
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("fetches user details and returns a mapping object", async () => {
    const responseData = [
      { id: "id1", fullName: "John Doe", role: "ROLE_ADMIN" },
      { id: "id2", fullName: "Jane Doe", role: "ROLE_MANAGER" },
    ];
    axios.post.mockResolvedValue({ data: responseData });

    const result = await fetchUsersByIds(userIds, token);
    expect(axios.post).toHaveBeenCalledWith(
      `${identityServiceUrl}/api/users/batch`,
      { ids: userIds },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(result).toEqual({
      id1: { id: "id1", fullName: "John Doe", role: "ROLE_ADMIN" },
      id2: { id: "id2", fullName: "Jane Doe", role: "ROLE_MANAGER" },
    });
  });

  test("returns an empty object and logs an error when axios.post fails", async () => {
    const error = new Error("Network Error");
    axios.post.mockRejectedValue(error);
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await fetchUsersByIds(userIds, token);
    expect(result).toEqual({});
    expect(console.error).toHaveBeenCalledWith("Error fetching user details:", error);
    spy.mockRestore();
  });
});
