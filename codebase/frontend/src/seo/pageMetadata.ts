import { industryLandingPages } from '../pages/IndustryLandingPages';
import { PUBLIC_SITE_URL } from '../constants/site';

export { PUBLIC_SITE_URL } from '../constants/site';

export interface PageSeoMetadata {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  indexable: boolean;
}

const publicPages: PageSeoMetadata[] = [
  {
    path: '/',
    title: 'Soochak Web Push Notifications for Websites | BizBandhan',
    description: 'Soochak helps businesses send timely browser notifications to people who choose to hear from their website.',
    keywords: [
      'web push notifications',
      'browser push notifications',
      'website notifications',
      'web push platform',
      'push notifications for websites',
      'Soochak',
    ],
    indexable: true,
  },
  {
    path: '/login',
    title: 'Sign in to Soochak',
    description: 'Sign in to your Soochak workspace to manage website push notifications.',
    keywords: ['Soochak login', 'Web Push dashboard sign in'],
    indexable: false,
  },
  {
    path: '/register',
    title: 'Create a Soochak Web Push Workspace | BizBandhan',
    description: 'Create a Soochak workspace to connect your website with browser push notifications.',
    keywords: [
      'Web Push workspace',
      'browser notifications for businesses',
      'website push notification service',
      'Soochak registration',
    ],
    indexable: true,
  },
  {
    path: '/landing/coaching',
    title: 'Web Push Notifications for Coaching Institutes | Soochak',
    description: 'Share class changes, exam reminders, and institute updates with students and families who opt in.',
    keywords: [
      'coaching institute notifications',
      'tuition class updates',
      'student exam reminders',
      'parent notifications',
      'Web Push for education',
    ],
    indexable: true,
  },
  {
    path: '/landing/creators',
    title: 'Web Push for Creators and Publishers | Soochak',
    description: 'Share new videos, stories, and publisher updates with fans who choose to hear from you.',
    keywords: [
      'Web Push for creators',
      'creator audience notifications',
      'publisher notifications',
      'new video alerts',
      'website audience engagement',
    ],
    indexable: true,
  },
  ...industryLandingPages.map((page) => {
    const industryKeywords: Record<string, string[]> = {
      retailers: [
        'retail Web Push notifications',
        'retail browser notifications',
        'new arrival alerts',
        'store update notifications',
        'customer notifications',
      ],
      jobs: [
        'job portal notifications',
        'job alert notifications',
        'recruitment updates',
        'application deadline reminders',
        'Web Push for recruiters',
      ],
      events: [
        'event website notifications',
        'event reminders',
        'ticket release alerts',
        'event schedule updates',
        'Web Push for event organizers',
      ],
      schools: [
        'school website notifications',
        'school announcements',
        'exam timetable alerts',
        'parent notifications',
        'Web Push for schools',
      ],
      saas: [
        'SaaS product notifications',
        'product announcement alerts',
        'maintenance notifications',
        'community updates',
        'Web Push for SaaS',
      ],
    };
    const titles: Record<string, string> = {
      retailers: 'Web Push Notifications for Retailers | Soochak',
      jobs: 'Web Push Job Alerts for Portals and Recruiters | Soochak',
      events: 'Web Push Notifications for Events | Soochak',
      schools: 'Web Push Notifications for Schools and Colleges | Soochak',
      saas: 'Web Push for SaaS Products and Communities | Soochak',
    };

    return {
      path: `/landing/${page.vertical}`,
      title: titles[page.vertical] ?? `${page.title} | Soochak`,
      description: page.description,
      keywords: industryKeywords[page.vertical] ?? ['Web Push notifications', page.vertical],
      indexable: true,
    };
  }),
];

export const privatePageMetadata: PageSeoMetadata[] = [
  {
    path: '/',
    title: 'Workspace Overview | Soochak',
    description: 'Manage your Soochak workspace, website subscribers, and Web Push notifications.',
    keywords: ['Soochak dashboard', 'workspace overview'],
    indexable: false,
  },
  {
    path: '/notifications',
    title: 'Notification History | Soochak',
    description: 'Review notification history and provider outcomes for your Soochak workspace.',
    keywords: ['notification history', 'Web Push delivery status', 'Soochak dashboard'],
    indexable: false,
  },
  {
    path: '/notifications/compose',
    title: 'Compose a Notification | Soochak',
    description: 'Compose and send a Web Push notification from your Soochak workspace.',
    keywords: ['compose push notification', 'send Web Push', 'Soochak dashboard'],
    indexable: false,
  },
  {
    path: '/subscribers',
    title: 'Push Subscribers | Soochak',
    description: 'Manage browser push subscribers associated with your Soochak workspace.',
    keywords: ['push subscribers', 'browser subscriptions', 'Soochak dashboard'],
    indexable: false,
  },
  {
    path: '/sites',
    title: 'Sites and Allowed Origins | Soochak',
    description: 'Manage allowed website origins and integration resources for your workspace.',
    keywords: ['website origins', 'Web Push integration', 'Soochak dashboard'],
    indexable: false,
  },
  {
    path: '/config',
    title: 'Push Configuration | Soochak',
    description: 'View Web Push configuration for your Soochak workspace.',
    keywords: ['Web Push configuration', 'VAPID configuration', 'Soochak dashboard'],
    indexable: false,
  },
  {
    path: '/administration',
    title: 'Users, Roles, and Permissions | Soochak',
    description: 'View user, role, and permission administration for your Soochak workspace.',
    keywords: ['workspace user administration', 'roles and permissions', 'Soochak dashboard'],
    indexable: false,
  },
  {
    path: '/settings',
    title: 'Organization Settings | Soochak',
    description: 'Manage settings for your Soochak organization workspace.',
    keywords: ['organization settings', 'Soochak workspace settings'],
    indexable: false,
  },
  {
    path: '/profile',
    title: 'Profile and Security | Soochak',
    description: 'Manage your Soochak account profile and security settings.',
    keywords: ['account profile', 'account security', 'Soochak dashboard'],
    indexable: false,
  },
];

const fallbackPage: PageSeoMetadata = {
  path: '',
  title: 'Page Not Found | Soochak',
  description: 'The requested Soochak page could not be found.',
  keywords: ['Soochak'],
  indexable: false,
};

const normalizePath = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

export const publicPageMetadata = publicPages;

export function getPageMetadata(pathname: string, isAuthenticated: boolean): PageSeoMetadata {
  const path = normalizePath(pathname);
  if (isAuthenticated) {
    const privatePage = privatePageMetadata.find((page) => page.path === path);
    if (privatePage) return privatePage;
  }
  return publicPages.find((page) => page.path === path) ?? fallbackPage;
}

export function createPageStructuredData(metadata: PageSeoMetadata, pageUrl: string) {
  const webpage = {
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    isPartOf: { '@id': `${PUBLIC_SITE_URL}/#website` },
    inLanguage: 'en',
  };

  if (metadata.path !== '/' || !metadata.indexable) {
    return {
      '@context': 'https://schema.org',
      ...webpage,
      about: { '@id': `${PUBLIC_SITE_URL}/#software` },
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${PUBLIC_SITE_URL}/#organization`,
        name: 'Soochak by BizBandhan',
        url: PUBLIC_SITE_URL,
        logo: `${PUBLIC_SITE_URL}/icon.svg`,
      },
      {
        '@type': 'WebSite',
        '@id': `${PUBLIC_SITE_URL}/#website`,
        name: 'Soochak by BizBandhan',
        url: PUBLIC_SITE_URL,
        publisher: { '@id': `${PUBLIC_SITE_URL}/#organization` },
        inLanguage: 'en',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${PUBLIC_SITE_URL}/#software`,
        name: 'Soochak',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web browser',
        url: PUBLIC_SITE_URL,
        description: metadata.description,
        publisher: { '@id': `${PUBLIC_SITE_URL}/#organization` },
      },
      { ...webpage, about: { '@id': `${PUBLIC_SITE_URL}/#software` } },
    ],
  };
}

export function serializeStructuredData(metadata: PageSeoMetadata, pageUrl: string): string {
  return JSON.stringify(createPageStructuredData(metadata, pageUrl))
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}
