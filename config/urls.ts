// config/urls.ts

function getRequiredUrl(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Required environment variable '${name}' is not configured`
    );
  }

  return value.replace(/\/$/, '');
}

export const urls = {
  complaintsResolution: getRequiredUrl('COMPLAINTS_RESOLUTION_URL'),
};