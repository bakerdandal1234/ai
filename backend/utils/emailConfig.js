const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

// Create transporter function
async function createTransporter() {
    try {
        const accessToken = await oauth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_FROM,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
                accessToken: accessToken.token
            }
        });

        return transporter;
    } catch (error) {
        console.error('Error creating transporter:', error);
        throw error;
    }
}

// Send verification email
async function sendEmail(email, path, verificationToken) {
    try {
        const transporter = await createTransporter();
        const verificationUrl = `${process.env.APP_URL}/${path}/${verificationToken}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: path === 'verify-email' ? 'Verify Your Email Address' : 'Reset Your Password',
            html: `
            <h1>${path === 'verify-email' ? 'Verify Your Email Address' : 'Reset Your Password'}</h1>
            <p>Please click the link below to ${path === 'verify-email' ? 'verify your email address' : 'reset your password'}:</p>
            <a href="${verificationUrl}">${path === 'verify-email' ? 'Verify Email' : 'Reset Password'}</a>
            <p>This link will expire in 24 hours.</p>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result);
        return result;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

async function sendVerificationEmail(email, verificationToken) {
    return sendEmail(email, 'verify-email', verificationToken);
}

// Send reset password email
async function sendResetPasswordEmail(email, resetToken) {
    try {
        await sendEmail(email, 'reset-password', resetToken);
        console.log('Reset password email sent successfully');
    } catch (error) {
        console.error('Error sending reset password email:', error);
        throw error;
    }
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
