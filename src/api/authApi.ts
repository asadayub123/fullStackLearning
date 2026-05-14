import {httpClient, persistToken} from './httpClient';

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export async function login(username: string, password: string) {
  const {data} = await httpClient.post<LoginResponse>('/Auth/login', {
    username,
    password,
  });
  await persistToken(data.access_token);
  return data;
}

export async function logout() {
  await persistToken(null);
}
