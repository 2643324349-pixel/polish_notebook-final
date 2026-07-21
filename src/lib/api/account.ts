const API_BASE = import.meta.env.VITE_INFLECTION_API_URL ?? '';

export async function deleteAccountApi(
  userId: string,
  accessToken: string,
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (response.ok) return;

  let message = 'Failed to delete account';
  try {
    const data = (await response.json()) as { detail?: string };
    if (data.detail) message = data.detail;
  } catch {
    // ignore JSON parse errors
  }
  throw new Error(message);
}
