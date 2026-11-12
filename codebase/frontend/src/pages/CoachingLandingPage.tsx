import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  Globe2,
  MousePointerClick,
  Send,
} from 'lucide-react';
import {
  IndustryLandingPage,
  type IndustryLandingConfig,
} from '../components/marketing/IndustryLandingPage';

const coachingLandingConfig: IndustryLandingConfig = {
  vertical: 'coaching',
  eyebrow: 'BUILT FOR LOCAL EDUCATION & INSTITUTES',
  title: 'Never let your students miss a class change or exam update again.',
  description:
    "Send instant push alerts straight to parents' and students' phone or desktop screens in 1 click—no app downloads or group chat spam required.",
  cta: 'Get Started Free',
  optInNote: 'Parents and students opt in from your website. No app installation needed.',
  notification: {
    title: '⚠️ Physics Batch Rescheduled',
    body: "Today's batch at 5 PM has been moved to 7 PM due to rain.",
    website: 'your-institute.in',
    heading: 'A message from your institute',
    source: 'Soochak · Institute Updates',
    audience: 'Sent to opted-in parents and students',
    footer: 'No app download. No scrolling through a busy group chat.',
  },
  painPointsIntro: {
    eyebrow: 'Less chasing. Clearer updates.',
    title: 'A calmer way to keep every batch in the loop.',
    description: 'Replace repeated forwards and missed messages with timely updates from your institute.',
  },
  stepsEyebrow: 'How it works for tutors',
  closingDescription: 'Give parents and students a direct way to hear from your institute—right in the browser they already use.',
  painPoints: [
    {
      title: 'WhatsApp Group Noise',
      problem: 'Messages get buried under chat, forwards, and unrelated group conversations.',
      solution: 'Send a direct browser notification to parents and students who opted in.',
      icon: BellRing,
    },
    {
      title: 'Rescheduling Chaos',
      problem: 'Last-minute class changes can leave students travelling to the wrong time or place.',
      solution: 'Broadcast a schedule update to enrolled devices from one dashboard action.',
      icon: AlertTriangle,
    },
    {
      title: 'Missed Fee & Exam Dates',
      problem: 'Important deadlines are easy to forget when reminders disappear in a busy chat.',
      solution: "Send fee and exam reminders directly to parents' and students' screens.",
      icon: CalendarClock,
    },
  ],
  steps: [
    {
      title: 'Add the lightweight widget',
      description: "Add Soochak's lightweight client script to your institute's website.",
      icon: Globe2,
    },
    {
      title: 'Let families opt in',
      description: "Parents and students click 'Allow' once when they visit your site.",
      icon: MousePointerClick,
    },
    {
      title: 'Write and send',
      description: 'Type your update in the Soochak dashboard and hit send.',
      icon: Send,
    },
  ],
};

export const CoachingLandingPage = () => (
  <IndustryLandingPage config={coachingLandingConfig} />
);
