import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { storage } from './storage';
import { generateVerificationCode, sendVerificationCode } from './sms';
import type { RegisterUser, LoginPhone, LoginPassword, VerifyCode, ChangePassword, ResetPassword } from '@shared/schema';

const SALT_ROUNDS = 10;
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

export async function registerUser(data: RegisterUser) {
  // Check if user already exists
  const existingUser = await storage.getUserByPhoneNumber(data.phoneNumber);
  if (existingUser) {
    throw new Error('Phone number already registered');
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Determine role - emperor for specific phone number, jedi for everyone else
  const role = data.phoneNumber === '8325776185' ? 'emperor' : 'jedi';

  // Create user
  const user = await storage.createUser({
    firstName: data.firstName,
    lastName: data.lastName,
    phoneNumber: data.phoneNumber,
    password: hashedPassword,
    role,
  });

  // Generate and send verification code
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await storage.createVerificationCode({
    phoneNumber: data.phoneNumber,
    code,
    type: 'register',
    expiresAt,
  });

  const smsSent = await sendVerificationCode(data.phoneNumber, code, 'register');
  if (!smsSent) {
    throw new Error('Failed to send verification code');
  }

  return { userId: user.id, message: 'Verification code sent' };
}

export async function verifyRegistration(data: VerifyCode) {
  const verificationCode = await storage.getValidVerificationCode(
    data.phoneNumber,
    data.code,
    data.type
  );

  if (!verificationCode) {
    throw new Error('Invalid or expired verification code');
  }

  // Mark code as used
  await storage.markVerificationCodeUsed(verificationCode.id);

  // Get user and mark as verified
  const user = await storage.getUserByPhoneNumber(data.phoneNumber);
  if (!user) {
    throw new Error('User not found');
  }

  // Create session
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  await storage.createSession(user.id, sessionId, expiresAt);

  return { user, sessionId };
}

export async function sendLoginCode(data: LoginPhone) {
  const user = await storage.getUserByPhoneNumber(data.phoneNumber);
  if (!user) {
    throw new Error('Phone number not registered');
  }

  // Generate and send verification code
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await storage.createVerificationCode({
    phoneNumber: data.phoneNumber,
    code,
    type: 'login',
    expiresAt,
  });

  const smsSent = await sendVerificationCode(data.phoneNumber, code, 'login');
  if (!smsSent) {
    throw new Error('Failed to send verification code');
  }

  return { message: 'Verification code sent' };
}

export async function verifyLogin(data: VerifyCode) {
  const verificationCode = await storage.getValidVerificationCode(
    data.phoneNumber,
    data.code,
    data.type
  );

  if (!verificationCode) {
    throw new Error('Invalid or expired verification code');
  }

  // Mark code as used
  await storage.markVerificationCodeUsed(verificationCode.id);

  // Get user
  const user = await storage.getUserByPhoneNumber(data.phoneNumber);
  if (!user) {
    throw new Error('User not found');
  }

  // Create session
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  await storage.createSession(user.id, sessionId, expiresAt);

  return { user, sessionId };
}

export async function loginWithPassword(data: LoginPassword) {
  const user = await storage.getUserByPhoneNumber(data.phoneNumber);
  if (!user) {
    throw new Error('Invalid phone number or password');
  }

  const isValidPassword = await comparePasswords(data.password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid phone number or password');
  }

  // Create session
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  await storage.createSession(user.id, sessionId, expiresAt);

  return { user, sessionId };
}

export async function changePassword(userId: number, data: ChangePassword) {
  const user = await storage.getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const isValidPassword = await comparePasswords(data.currentPassword, user.password);
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  const hashedNewPassword = await hashPassword(data.newPassword);
  await storage.updateUserPassword(userId, hashedNewPassword);

  return { message: 'Password updated successfully' };
}

export async function sendPasswordResetCode(data: LoginPhone) {
  const user = await storage.getUserByPhoneNumber(data.phoneNumber);
  if (!user) {
    throw new Error('Phone number not registered');
  }

  // Generate and send verification code
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await storage.createVerificationCode({
    phoneNumber: data.phoneNumber,
    code,
    type: 'password_reset',
    expiresAt,
  });

  const smsSent = await sendVerificationCode(data.phoneNumber, code, 'password_reset');
  if (!smsSent) {
    throw new Error('Failed to send verification code');
  }

  return { message: 'Password reset code sent' };
}

export async function resetPassword(data: ResetPassword) {
  const verificationCode = await storage.getValidVerificationCode(
    data.phoneNumber,
    data.code,
    'password_reset'
  );

  if (!verificationCode) {
    throw new Error('Invalid or expired verification code');
  }

  // Mark code as used
  await storage.markVerificationCodeUsed(verificationCode.id);

  // Get user and update password
  const user = await storage.getUserByPhoneNumber(data.phoneNumber);
  if (!user) {
    throw new Error('User not found');
  }

  const hashedNewPassword = await hashPassword(data.newPassword);
  await storage.updateUserPassword(user.id, hashedNewPassword);

  // Delete all existing sessions for this user
  await storage.deleteUserSessions(user.id);

  return { message: 'Password reset successfully' };
}

export async function logout(sessionId: string) {
  await storage.deleteSession(sessionId);
  return { message: 'Logged out successfully' };
}

export async function getCurrentUser(sessionId: string) {
  const session = await storage.getSessionById(sessionId);
  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  const user = await storage.getUserById(session.userId);
  return user || null;
}