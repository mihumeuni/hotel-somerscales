//validaciones de email y largo de contraseña

export const isValidEmail = (email: string): boolean => {
  return /\S+@\S+\.\S+/.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};