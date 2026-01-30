export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (!username || username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }
  if (username.length > 50) {
    return { valid: false, error: 'Username must be less than 50 characters' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }
  if (password.length > 100) {
    return { valid: false, error: 'Password must be less than 100 characters' };
  }
  return { valid: true };
};

export const validateMessage = (message: string): { valid: boolean; error?: string } => {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (message.length > 5000) {
    return { valid: false, error: 'Message must be less than 5000 characters' };
  }
  return { valid: true };
};

export const validateTemperament = (temperament: number): { valid: boolean; error?: string } => {
  if (temperament < 1 || temperament > 10) {
    return { valid: false, error: 'Temperament must be between 1 and 10' };
  }
  return { valid: true };
};

export const validateTimeLimit = (timeLimit: number): { valid: boolean; error?: string } => {
  if (timeLimit < 0) {
    return { valid: false, error: 'Time limit cannot be negative' };
  }
  if (timeLimit > 240) {
    return { valid: false, error: 'Time limit must be less than 240 minutes (4 hours)' };
  }
  return { valid: true };
};
