export const config = {
  baseURL: process.env.BASE_URL ?? 'https://petstore3.swagger.io/api/v3',
  timeout: Number(process.env.TIMEOUT ?? 10000),
  retries: Number(process.env.RETRIES ?? 2)
};
