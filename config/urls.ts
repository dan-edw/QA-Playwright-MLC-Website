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
  complaint: getRequiredUrl('COMPLAINT_BASE_URL'),
};
