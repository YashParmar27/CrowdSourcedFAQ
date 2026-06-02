import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const formatIST = (date) => {
  return new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};

const emails = {
  faqCreated: (data) => ({
    subject: `📝 New FAQ Created: ${data.faq.question}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New FAQ Created</h2>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Question:</strong> ${data.faq.question}</p>
          <p><strong>Answer:</strong> ${data.faq.answer}</p>
          <p><strong>Category:</strong> ${data.faq.category}</p>
          <p><strong>Status:</strong> ${data.faq.status}</p>
          <p><strong>Created By:</strong> ${data.user_name} (${data.user_email})</p>
          <p><strong>AI Generated:</strong> ${data.faq.is_ai_generated ? '🤖 Yes' : '❌ No'}</p>
          <p><strong>Source Questions:</strong> ${data.faq.source_questions?.length || 0}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Time (IST): ${formatIST(data.timestamp)}
        </p>
      </div>
    `
  }),

  faqApproved: (data) => ({
    subject: `✅ FAQ Approved: ${data.faq.question}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">FAQ Approved</h2>
        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Question:</strong> ${data.faq.question}</p>
          <p><strong>Category:</strong> ${data.faq.category}</p>
          <p><strong>Approved By:</strong> ${data.user_name} (${data.user_email})</p>
          <p><strong>AI Generated:</strong> ${data.faq.is_ai_generated ? '🤖 Yes' : '❌ No'}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Time (IST): ${formatIST(data.timestamp)}
        </p>
      </div>
    `
  }),

  faqPublished: (data) => ({
    subject: `🎉 FAQ Published: ${data.faq.question}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">FAQ Published!</h2>
        <div style="background: #ede9fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Question:</strong> ${data.faq.question}</p>
          <p><strong>Answer:</strong> ${data.faq.answer}</p>
          <p><strong>Category:</strong> ${data.faq.category}</p>
          <p><strong>Views:</strong> ${data.faq.views || 0}</p>
          <p><strong>Published By:</strong> ${data.user_name} (${data.user_email})</p>
          <p><strong>AI Generated:</strong> ${data.faq.is_ai_generated ? '🤖 Yes' : '❌ No'}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Time (IST): ${formatIST(data.timestamp)}
        </p>
      </div>
    `
  }),

  faqRejected: (data) => ({
    subject: `❌ FAQ Rejected: ${data.faq.question}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">FAQ Rejected</h2>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Question:</strong> ${data.faq.question}</p>
          <p><strong>Category:</strong> ${data.faq.category}</p>
          <p><strong>Rejected By:</strong> ${data.user_name} (${data.user_email})</p>
          <p><strong>Previous Status:</strong> ${data.faq.status}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Time (IST): ${formatIST(data.timestamp)}
        </p>
      </div>
    `
  }),

  faqDeleted: (data) => ({
    subject: `🗑️ FAQ Deleted: ${data.faq.question}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6b7280;">FAQ Deleted</h2>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Question:</strong> ${data.faq.question}</p>
          <p><strong>Category:</strong> ${data.faq.category}</p>
          <p><strong>Status at Deletion:</strong> ${data.faq.status}</p>
          <p><strong>Deleted By:</strong> ${data.user_name} (${data.user_email})</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Time (IST): ${formatIST(data.timestamp)}
        </p>
      </div>
    `
  }),

  questionSubmitted: (data) => ({
    subject: `❓ New Question Submitted: ${data.question.text.substring(0, 50)}...`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0891b2;">New Question Received</h2>
        <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Question:</strong> ${data.question.text}</p>
          <p><strong>Category:</strong> ${data.question.category}</p>
          <p><strong>Source:</strong> ${data.question.source}</p>
          <p><strong>Submitted By:</strong> ${data.user_name || 'Guest'} (${data.user_email || 'N/A'})</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Time (IST): ${formatIST(data.timestamp)}
        </p>
      </div>
    `
  }),

  aiSuggestion: (data) => ({
    subject: `🤖 AI Suggested FAQ: ${data.suggestion.question.substring(0, 50)}...`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">AI FAQ Suggestion</h2>
        <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Suggested Question:</strong> ${data.suggestion.question}</p>
          <p><strong>Suggested Answer:</strong> ${data.suggestion.answer}</p>
          <p><strong>Source Questions:</strong> ${data.source_count} questions grouped</p>
          <p><strong>Generated By:</strong> Google Gemini AI</p>
          <p><strong>Triggered By:</strong> ${data.user_name} (${data.user_email})</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Time (IST): ${formatIST(data.timestamp)}
        </p>
      </div>
    `
  }),

  questionApproved: (data) => ({
    subject: `✅ Your Question Was Approved: ${data.question.text.substring(0, 50)}...`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Great News! Your Question Was Approved</h2>
        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hello ${data.user_name},</p>
          <p>Your submitted question has been <strong>approved</strong> by our team!</p>
          <p style="margin-top: 15px;"><strong>Your Question:</strong></p>
          <p style="background: #fff; padding: 10px; border-radius: 6px; border-left: 4px solid #059669;">${data.question.text}</p>
          <p style="margin-top: 15px;"><strong>Category:</strong> ${data.question.category}</p>
          <p><strong>Next Step:</strong> Our team is now working on creating an FAQ from your question. You'll be notified when it's published!</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Time (IST): ${formatIST(data.timestamp)}
        </p>
      </div>
    `
  }),

  questionRejected: (data) => ({
    subject: `❌ Your Question Was Not Approved: ${data.question.text.substring(0, 50)}...`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Your Question Update</h2>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hello ${data.user_name},</p>
          <p>Unfortunately, your submitted question was <strong>not approved</strong> at this time.</p>
          <p style="margin-top: 15px;"><strong>Your Question:</strong></p>
          <p style="background: #fff; padding: 10px; border-radius: 6px; border-left: 4px solid #dc2626;">${data.question.text}</p>
          <p style="margin-top: 15px;"><strong>Category:</strong> ${data.question.category}</p>
          <p style="margin-top: 15px; color: #6b7280;"><em>Reason: This may be due to duplication, unclear phrasing, or it may require more details. Feel free to submit a revised question!</em></p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Time (IST): ${formatIST(data.timestamp)}
        </p>
      </div>
    `
  }),

  questionReviewing: (data) => ({
    subject: `👀 Your Question Is Being Reviewed: ${data.question.text.substring(0, 50)}...`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0891b2;">Your Question Is Under Review</h2>
        <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hello ${data.user_name},</p>
          <p>Good news! Your submitted question is now being <strong>actively reviewed</strong> by our team.</p>
          <p style="margin-top: 15px;"><strong>Your Question:</strong></p>
          <p style="background: #fff; padding: 10px; border-radius: 6px; border-left: 4px solid #0891b2;">${data.question.text}</p>
          <p style="margin-top: 15px;"><strong>Category:</strong> ${data.question.category}</p>
          <p style="margin-top: 15px;"><strong>Status:</strong> Our team is examining your question and will create a comprehensive FAQ from it soon.</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Time (IST): ${formatIST(data.timestamp)}
        </p>
      </div>
    `
  }),

  questionConvertedToFAQ: (data) => ({
    subject: `🎉 Great! Your Question Became an FAQ: ${data.question.text.substring(0, 50)}...`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Your Question Is Now an FAQ!</h2>
        <div style="background: #ede9fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hello ${data.user_name},</p>
          <p>Excellent news! Your question has been converted into an <strong>FAQ</strong> and is awaiting publication!</p>
          <p style="margin-top: 15px;"><strong>Your Question:</strong></p>
          <p style="background: #fff; padding: 10px; border-radius: 6px; border-left: 4px solid #7c3aed;">${data.question.text}</p>
          ${data.faq_answer ? `<p style="margin-top: 10px;"><strong>Generated Answer:</strong></p><p style="background: #f3f4f6; padding: 10px; border-radius: 6px;">${data.faq_answer}</p>` : ''}
          <p style="margin-top: 15px;"><strong>Status:</strong> Your FAQ is now in the queue and will be published shortly!</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Time (IST): ${formatIST(data.timestamp)}
        </p>
      </div>
    `
  }),

  faqPublishedUser: (data) => ({
    subject: `🎉 Your Question Is Now LIVE as an FAQ!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669; font-size: 24px;">🚀 Your Question Is Now Live!</h2>
        <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 25px; border-radius: 12px; margin: 20px 0;">
          <p style="font-size: 16px;">Hello ${data.user_name},</p>
          <p style="font-size: 16px; margin-top: 10px;">We're thrilled to inform you that <strong>your question has been published as an FAQ</strong> and is now visible to everyone!</p>
          
          <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="margin: 0 0 10px 0;"><strong style="color: #2563eb; font-size: 18px;">Q:</strong> <span style="font-size: 16px;">${data.faq.question}</span></p>
            <p style="margin: 0; padding-top: 10px; border-top: 1px solid #e5e7eb;"><strong style="color: #059669; font-size: 18px;">A:</strong> <span style="font-size: 16px; color: #4b5563;">${data.faq.answer}</span></p>
          </div>
          
          <p style="margin-top: 20px;"><strong>Category:</strong> ${data.faq.category}</p>
          ${data.faq.views > 0 ? `<p><strong>Views:</strong> ${data.faq.views}</p>` : ''}
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Thank you for contributing to our FAQ community! Your question helps others find answers.</p>
        </div>
        
        <p style="color: #6b7280; font-size: 12px;">
          Time (IST): ${formatIST(data.timestamp)}
        </p>
      </div>
    `
  }),

  welcome: (data) => ({
    subject: `🎉 Welcome to FAQ Generator, ${data.username}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">Welcome to FAQ Generator!</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">You're now part of an amazing community</p>
        </div>
        
        <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; margin: 0 0 20px 0;">Hello <strong style="color: #3b82f6;">${data.username}</strong>,</p>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 25px 0;">
            Thank you for joining <strong>FAQ Generator</strong>! We're excited to have you on board. Here's what you can do:
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">🚀 Getting Started:</h3>
            <ul style="color: #4b5563; line-height: 2; margin: 0; padding-left: 20px;">
              <li><strong>Submit Questions</strong> - Ask anything and our team will create FAQs</li>
              <li><strong>Track Status</strong> - See if your questions are approved/reviewed</li>
              <li><strong>View FAQs</strong> - Browse published FAQs on our homepage</li>
              <li><strong>Dashboard</strong> - Monitor all your questions and their status</li>
            </ul>
          </div>
          
          <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: bold; font-size: 16px;">Your Journey Starts Now!</p>
            <a href="${data.client_url}" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Submit Your First Question</a>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 14px;">📧 Your Account:</h3>
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Email:</strong> ${data.email}</p>
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Role:</strong> ${data.role}</p>
            <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Joined:</strong> ${formatIST(data.created_at)}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 25px 0 10px 0;">
            If you have any questions, feel free to reach out to our support team.
          </p>
          
          <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            Best regards,<br>
            <strong>The FAQ Generator Team</strong><br>
            <a href="${data.client_url}" style="color: #3b82f6;">${data.client_url}</a>
          </p>
        </div>
      </div>
    `
  })
};

export const sendEmail = async (type, data, options = {}) => {
  if (!process.env.SMTP_HOST) {
    console.log('SMTP not configured, skipping email notification');
    return false;
  }

  try {
    const emailData = emails[type](data);
    const toEmail = options.to || process.env.ADMIN_EMAIL;
    
    await transporter.sendMail({
      from: `"FAQ Generator" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: emailData.subject,
      html: emailData.html
    });
    console.log(`Email notification sent: ${type} to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return false;
  }
};

export const sendUserNotification = async (user, notificationData, emailType, emailData) => {
  try {
    if (user.email) {
      await sendEmail(emailType, { ...emailData, user_name: user.username }, { to: user.email });
    }
    return true;
  } catch (error) {
    console.error('User notification failed:', error.message);
    return false;
  }
};

export default transporter;
