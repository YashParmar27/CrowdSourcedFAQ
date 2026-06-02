import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FAQ from './models/FAQ.js';
import Question from './models/Question.js';

dotenv.config();

const seedFAQs = [
  {
    question: 'What is Samagama.in?',
    answer: 'Samagama.in is a comprehensive platform that provides various digital services including web development, hosting solutions, and technical consulting for businesses of all sizes.',
    category: 'general',
    status: 'published'
  },
  {
    question: 'What services does Samagama.in offer?',
    answer: 'Samagama.in offers a wide range of services including: Website Development, Cloud Hosting, Domain Registration, Email Solutions, SSL Certificates, SEO Optimization, and 24/7 Technical Support.',
    category: 'services',
    status: 'published'
  },
  {
    question: 'How can I contact Samagama.in support?',
    answer: 'You can reach our support team through multiple channels: 1) Email at support@samagama.in, 2) Phone at +91-XXXXXXXXXX, 3) Live chat on our website, or 4) Submit a ticket through your dashboard.',
    category: 'support',
    status: 'published'
  },
  {
    question: 'What is the uptime guarantee for hosting services?',
    answer: 'We guarantee 99.9% uptime for all hosting plans. In the rare event that we fall below this threshold, you will receive service credits proportional to the downtime experienced.',
    category: 'hosting',
    status: 'published'
  },
  {
    question: 'How do I register a domain with Samagama.in?',
    answer: 'To register a domain: 1) Visit our website and use the domain search tool, 2) Enter your desired domain name, 3) Select your preferred extension (.com, .in, .org, etc.), 4) Complete the checkout process. Domain registration is simple and takes only a few minutes.',
    category: 'domains',
    status: 'published'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept multiple payment methods including: Credit/Debit Cards (Visa, MasterCard, American Express), Net Banking, UPI, Bank Transfers, and popular digital wallets. All transactions are secure and encrypted.',
    category: 'billing',
    status: 'published'
  },
  {
    question: 'Can I upgrade my hosting plan later?',
    answer: 'Yes, you can upgrade your hosting plan at any time through your dashboard. The upgrade is seamless with no downtime, and you will only pay the prorated difference for the remaining billing period.',
    category: 'hosting',
    status: 'published'
  },
  {
    question: 'Do you provide SSL certificates?',
    answer: 'Yes, we offer free SSL certificates with all hosting plans. We also provide premium SSL certificates with extended validation (EV) for businesses requiring maximum security and trust indicators.',
    category: 'security',
    status: 'published'
  },
  {
    question: 'What is your refund policy?',
    answer: 'We offer a 30-day money-back guarantee on all hosting plans. If you are not satisfied with our services within the first 30 days, you can request a full refund. Domain registration fees are non-refundable once processed.',
    category: 'billing',
    status: 'published'
  },
  {
    question: 'How do I get started with Samagama.in services?',
    answer: 'Getting started is easy: 1) Create a free account on our website, 2) Choose the service you need, 3) Complete the registration or purchase, 4) Our team will guide you through the setup process. For enterprise customers, we offer personalized onboarding assistance.',
    category: 'general',
    status: 'published'
  }
];

const seedQuestions = [
  { text: 'What services are available on Samagama.in?', category: 'general', status: 'new' },
  { text: 'How to contact support team?', category: 'support', status: 'new' },
  { text: 'What hosting plans do you offer?', category: 'hosting', status: 'new' },
  { text: 'Is there a free trial available?', category: 'billing', status: 'new' },
  { text: 'How to upgrade my account?', category: 'account', status: 'new' },
  { text: 'Do you offer custom domain registration?', category: 'domains', status: 'new' },
  { text: 'What payment options are accepted?', category: 'billing', status: 'new' },
  { text: 'How secure is my data with Samagama.in?', category: 'security', status: 'new' },
  { text: 'Can I get a refund if not satisfied?', category: 'billing', status: 'new' },
  { text: 'What is the response time for support tickets?', category: 'support', status: 'new' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await FAQ.deleteMany({});
    await Question.deleteMany({});
    console.log('Cleared existing data');

    await FAQ.insertMany(seedFAQs);
    console.log(`Inserted ${seedFAQs.length} FAQs`);

    await Question.insertMany(seedQuestions);
    console.log(`Inserted ${seedQuestions.length} questions`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();