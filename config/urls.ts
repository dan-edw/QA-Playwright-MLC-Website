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

const complaintBaseURL = getRequiredUrl('COMPLAINT_BASE_URL');

export const urls = {
  complaint: complaintBaseURL,
  
};