const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendTicketEmail({ email, fullName, ticketType, ticketId, pdfBuffer }) {
    console.log(`[EMAIL-SERVICE] Attempting to send email to ${email} for ticket ${ticketId}`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('[EMAIL-SERVICE] Missing SMTP credentials in environment variables');
        throw new Error('Email configuration missing');
    }

    const mailOptions = {
        from: `"Achievers Summit" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🎟️ Your Achievers Summit 2026 Ticket Is Ready!',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #1a1a1a; padding: 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; font-style: italic;">ACHIEVERS SUMMIT <span style="color: #ff8c00;">2026</span></h1>
                </div>
                
                <div style="padding: 40px; background-color: #ffffff; color: #333333;">
                    <h2 style="color: #1a1a1a; margin-top: 0;">Hello ${fullName},</h2>
                    <p style="line-height: 1.6; font-size: 16px;">Thank you for registering for <strong>Achievers Summit 2026</strong>.</p>
                    <p style="line-height: 1.6; font-size: 16px;">We are delighted to confirm your participation at this prestigious leadership and innovation summit taking place at <strong>Victoria Island, Lagos</strong>.</p>
                    <p style="line-height: 1.6; font-size: 16px;">Your personalized ticket has been successfully generated and attached to this email as a PDF document.</p>
                    
                    <div style="background-color: #f9f9f9; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #ff8c00;">
                        <h3 style="margin-top: 0; color: #1a1a1a; text-transform: uppercase; font-size: 14px; letter-spacing: 2px;">Ticket Summary</h3>
                        <p style="margin: 8px 0; font-size: 15px;"><strong>Ticket Category:</strong> ${ticketType}</p>
                        <p style="margin: 8px 0; font-size: 15px;"><strong>Ticket ID:</strong> ${ticketId}</p>
                        <p style="margin: 8px 0; font-size: 15px;"><strong>Event Date:</strong> 31 March – 1 April 2026</p>
                        <p style="margin: 8px 0; font-size: 15px;"><strong>Venue:</strong> Victoria Island, Lagos</p>
                    </div>
                </div>
                
                <div style="padding: 30px; background-color: #1a1a1a; text-align: center; color: #999; font-size: 12px;">
                    <p style="margin: 0 0 10px 0;">Achievers Summit Team</p>
                </div>
            </div>
        `,
        attachments: [
            {
                filename: `Achievers_Summit_2026_Ticket_${ticketId}.pdf`,
                content: pdfBuffer,
            }
        ]
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('[EMAIL-SERVICE] Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('[EMAIL-SERVICE] SMTP Error details:', error);
        throw error;
    }
}

module.exports = { sendTicketEmail };
