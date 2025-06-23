// API configuration for iOS app
const API_BASE_URL = 'https://workspace.benjirichter53.repl.co';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};

// Golf app specific API calls
export const createGame = async (gameData: any) => {
  return apiRequest('/api/games', {
    method: 'POST',
    body: JSON.stringify(gameData),
  });
};

export const getLeaderboard = async () => {
  return apiRequest('/api/leaderboard');
};

export const uploadPhoto = async (formData: FormData) => {
  return fetch(`${API_BASE_URL}/api/photos`, {
    method: 'POST',
    body: formData,
  });
};