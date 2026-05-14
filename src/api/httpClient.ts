import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { API_PREFIX } from '../config/api';

const TOKEN_KEY = '@fullStackLearning/jwt';

export const httpClient = axios.create({
  baseURL: API_PREFIX,
  headers: {'Content-Type': 'application/json'},
  timeout: 15000,
});

httpClient.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function persistToken(token: string | null) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
