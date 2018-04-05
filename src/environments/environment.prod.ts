import { configData } from './defaults';

export const environment: any = {
  production: true,
  LUMEER_ENV: 'production',
  ...configData
};
