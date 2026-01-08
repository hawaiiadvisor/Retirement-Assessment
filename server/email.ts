import { Resend } from 'resend';

const FROM_EMAIL = 'noreply@resend.dev';
const APP_NAME = 'Ready to Retire?';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured - emails will not be sent');
    return null;
  }
  return new Resend(apiKey);
}

export async function sendMagicLinkEmail(
  email: string,
  magicLink: string,
  isNewAssessment: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log(`[Email] Would send magic link to ${email}: ${magicLink}`);
      return { success: true };
    }
    
    const subject = isNewAssessment 
      ? `Your ${APP_NAME} Assessment Link`
      : `Access Your ${APP_NAME} Assessment`;
    
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${APP_NAME}</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin-top: 0;">
              ${isNewAssessment 
                ? 'Thank you for your purchase! Click the button below to access your Retirement Readiness Assessment.'
                : 'Click the button below to access your Retirement Readiness Assessment.'}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="background-color: #1e3a5f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Access My Assessment
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              This link will expire in 7 days. If you need a new link, visit our website and enter your email address.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">
              If you didn't request this email, you can safely ignore it.
              <br><br>
              This assessment is for educational purposes only and does not provide personalized financial advice.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}
