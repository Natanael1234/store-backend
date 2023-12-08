export enum PasswordMessage {
  STRING = 'Password should be string',
  REQUIRED = 'Password is required',
  MIN_LEN = 'Password should be at least 6 characters long',
  MAX_LEN = 'Password should have a maximum of 12 characters',
  INVALID = 'Password should have lowercase, uppercase, number and special characters',
}
