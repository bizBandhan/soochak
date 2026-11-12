import {
  BellRing,
  Globe2,
  Mail,
  MousePointerClick,
  Newspaper,
  Send,
} from 'lucide-react';
import {
  IndustryLandingPage,
  type IndustryLandingConfig,
} from '../components/marketing/IndustryLandingPage';

const creatorsLandingConfig: IndustryLandingConfig = {
  vertical: 'creators',
  eyebrow: 'BUILT FOR CREATORS, REPORTERS & PUBLISHERS',
  title: 'Bypass the algorithm. Own your audience relationship.',
  description:
    "Send browser alerts when your new video drops, your newsletter publishes, or breaking news breaks—straight to your fans' screens.",
  cta: 'Launch Your Creator Widget',
  optInNote: 'Fans opt in from your website. No app installation needed.',
  notification: {
    title: '🔴 New Video Dropped: Inside the Tech Stack',
    body: 'Watch now before anyone else. Tap to open YouTube.',
    website: 'your-creator-site.com',
    heading: 'A message from your channel',
    source: 'Soochak · Creator Updates',
    audience: 'Example alert for opted-in fans',
    footer: 'No app download. Share updates directly with your audience.',
  },
  painPointsIntro: {
    eyebrow: 'Less noise. More connection.',
    title: 'Keep your audience in the loop, on your terms.',
    description: 'Share new content and timely stories with fans who choose to hear from you.',
  },
  painPoints: [
    {
      title: 'Algorithm Suppression',
      problem: "Platforms don't show every new post to all your subscribers.",
      solution: 'Send browser alerts directly to fans who have opted in on your site.',
      icon: BellRing,
    },
    {
      title: 'Buried Email Newsletters',
      problem: 'Newsletters compete for attention in crowded inboxes.',
      solution: 'Share a visual push alert with a link to your latest content.',
      icon: Mail,
    },
    {
      title: 'Slow Breaking News Distribution',
      problem: 'Developing stories can get lost in fast-moving feeds.',
      solution: 'Send an update to opted-in readers as a story develops.',
      icon: Newspaper,
    },
  ],
  stepsEyebrow: 'How it works for creators',
  steps: [
    {
      title: 'Add the lightweight client',
      description: "Add Soochak's lightweight client script to your blog, personal site, or landing page.",
      icon: Globe2,
    },
    {
      title: 'Let fans opt in',
      description: "Fans click 'Allow' once to subscribe to your updates.",
      icon: MousePointerClick,
    },
    {
      title: 'Share your latest link',
      description: 'Use your Soochak dashboard to broadcast a link whenever you publish new content.',
      icon: Send,
    },
  ],
  closingDescription: 'Give your audience a direct way to hear about your latest content in the browser they already use.',
};

export const CreatorsLandingPage = () => (
  <IndustryLandingPage config={creatorsLandingConfig} />
);
