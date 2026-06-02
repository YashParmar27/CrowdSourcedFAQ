import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FAQ from './models/FAQ.js';
import Question from './models/Question.js';

dotenv.config();

const seedFAQs = [
  {
    question: 'What is Vicharanashala?',
    answer: 'Vicharanashala (Vicharanashala Lab for Education Design or VLED) is a research and design laboratory at IIT Ropar. It focuses on creating evidence-based, technology-driven learning solutions, including gamified systems, peer assessment tools, and personalized learning pathways for educational scale.',
    category: 'general',
    status: 'published'
  },
  {
    question: 'What is the ViBe platform developed by the lab?',
    answer: 'ViBe is a Unified Educational Platform designed by Vicharanashala. It aims to enhance student engagement and interactive learning through built-in smart checks, quizzes, peer evaluation systems, and interactive progress dashboards.',
    category: 'projects',
    status: 'published'
  },
  {
    question: 'What is the "AI Vicharana Shala" initiative?',
    answer: 'AI Vicharana Shala is an immersive, hands-on program in Artificial Intelligence. It provides students and professionals with practical training in building and deploying AI applications, improving AI literacy and engineering skills.',
    category: 'programs',
    status: 'published'
  },
  {
    question: 'How can I contact the Vicharanashala lab?',
    answer: 'For official inquiries, research collaborations, or program questions, you can contact the lab by emailing the administrators directly at dled@iitrpr.ac.in.',
    category: 'contact',
    status: 'published'
  },
  {
    question: 'What is the MMTTP Faculty Development Program?',
    answer: 'The MMTTP program is a faculty training initiative run by Vicharanashala. Its purpose is to upskill degree college teachers in AI literacy, enabling them to integrate AI tools and modern pedagogical techniques into their teaching and academic research.',
    category: 'programs',
    status: 'published'
  },
  {
    question: 'Who is eligible to apply for internships at Vicharanashala?',
    answer: 'Students, software engineers, and research aspirants interested in Educational Technology, AI integration, and systems design are eligible to apply. Internships focus on building educational tools and platforms under research supervision.',
    category: 'careers',
    status: 'published'
  },
  {
    question: 'What technologies are used in Vicharanashala projects?',
    answer: 'The lab uses a modern web stack including React.js, Node.js, MongoDB, Python, and Generative AI SDKs (like Google Gemini) to build scalable, interactive educational platforms.',
    category: 'technology',
    status: 'published'
  }
];

const seedQuestions = [
  { text: 'What is Vicharanashala?', category: 'general', status: 'new' },
  { text: 'How do I apply for an internship at Vicharanashala?', category: 'careers', status: 'new' },
  { text: 'Who can I email for collaboration inquiries?', category: 'contact', status: 'new' },
  { text: 'What does ViBe platform do?', category: 'projects', status: 'new' },
  { text: 'Are there any courses on AI conducted by the lab?', category: 'programs', status: 'new' }
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