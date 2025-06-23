import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: to,
    });
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCode(phoneNumber: string, code: string, type: string): Promise<boolean> {
  const messages = {
    register: `Your disc golf account verification code is: ${code}. This code expires in 10 minutes.`,
    login: `Your disc golf login code is: ${code}. This code expires in 10 minutes.`,
    password_reset: `Your disc golf password reset code is: ${code}. This code expires in 10 minutes.`,
  };

  const message = messages[type as keyof typeof messages] || `Your verification code is: ${code}`;
  return await sendSMS(phoneNumber, message);
}