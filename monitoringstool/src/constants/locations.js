import { getAccessToken } from "../services/auth";

export async function getLocations() {
  try {
    const response = await fetch("/api/locations");
    if (!response.ok) throw new Error("Failed to fetch locations");
    const json = await response.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function getGender(locationName) {
  const locs = await getLocations();
  const found = locs.find(l => l.name === locationName);
  return found ? found.gender : "male";
}

export async function createLocation(name, gender) {
  const token = await getAccessToken();
  const response = await fetch("/api/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, gender }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to create location");
  }
  return response.json();
}

export async function deleteLocation(name) {
  const token = await getAccessToken();
  const response = await fetch(`/api/locations/${encodeURIComponent(name)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to delete location");
  }
  return response.json();
}

export async function updateLocation(name, gender) {
  const token = await getAccessToken();
  const response = await fetch(`/api/locations/${encodeURIComponent(name)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ gender }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to update location");
  }
  return response.json();
}
