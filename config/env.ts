// config/env.ts

import dotenv from 'dotenv';

export type Environment = 'uat' | 'prod';

const environment = (
  process.env.ENVIRONMENT || 'uat'
).toLowerCase() as Environment;

dotenv.config({
  path: `.env.${environment}`,
});

export const ENVIRONMENT = environment;

console.log(`Environment: ${ENVIRONMENT}`);