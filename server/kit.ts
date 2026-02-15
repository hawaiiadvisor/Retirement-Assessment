// Kit (ConvertKit) API integration - v3 API
const KIT_API_URL = 'https://api.convertkit.com/v3';

function getApiSecret(): string | null {
  return process.env.KIT_API_SECRET || null;
}

export async function addSubscriber(email: string, fields?: Record<string, string>) {
  const apiSecret = getApiSecret();
  if (!apiSecret) {
    console.warn('[Kit] KIT_API_SECRET not set, skipping subscriber add');
    return;
  }

  const formId = process.env.KIT_FORM_ID;
  if (!formId) {
    console.warn('[Kit] KIT_FORM_ID not set, skipping subscriber add');
    return;
  }

  try {
    const body: any = {
      api_secret: apiSecret,
      email,
    };
    if (fields) {
      body.fields = fields;
    }

    const res = await fetch(`${KIT_API_URL}/forms/${formId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Kit] Failed to add subscriber ${email}: ${res.status} ${text}`);
      console.error(`[Kit] Check that KIT_FORM_ID (${formId}) is a valid numeric form ID from your Kit account`);
      return;
    }

    console.log(`[Kit] Added subscriber: ${email}`);
  } catch (err) {
    console.error('[Kit] Error adding subscriber:', err);
  }
}

export async function tagSubscriber(email: string, tagId: string) {
  const apiSecret = getApiSecret();
  if (!apiSecret) {
    console.warn('[Kit] KIT_API_SECRET not set, skipping tag');
    return;
  }

  try {
    const res = await fetch(`${KIT_API_URL}/tags/${tagId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_secret: apiSecret,
        email,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Kit] Failed to tag subscriber ${email} with tag ${tagId}: ${res.status} ${text}`);
      return;
    }

    console.log(`[Kit] Tagged subscriber ${email} with tag ${tagId}`);
  } catch (err) {
    console.error('[Kit] Error tagging subscriber:', err);
  }
}
