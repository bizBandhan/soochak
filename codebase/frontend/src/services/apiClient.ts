/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Centralized API Client
 * Built on API from react-api-state
 */

import { API } from 'react-api-state';
import type {
  Organization,
  OrganizationRegistrationPayload,
  UserProfile,
  PushSubscriber,
  NotificationPayload,
  NotificationRecord,
  PublicVapidConfig,
  SiteResource,
  ManagedUser,
  Role,
  Permission,
} from '../types';

// Configurable API base URL (defaults to /api/v1 as per OpenAPI contract)
export const DEFAULT_API_BASE =
  import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Key for storing auth token in browser storage
const TOKEN_STORAGE_KEY = 'soochak_auth_token';
const API_MODE_STORAGE_KEY = 'soochak_api_mode'; // 'connected' | 'simulation'

export class SoochakApiClient {
  public api: API;
  public baseUrl: string;
  private token: string | null = null;
  public isSimulationMode: boolean = false;

  constructor(baseUrl: string = DEFAULT_API_BASE) {
    this.baseUrl = baseUrl;
    this.api = new API(baseUrl);

    // Check if token was previously saved
    try {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (savedToken) {
        this.setToken(savedToken);
      }
      const savedMode = localStorage.getItem(API_MODE_STORAGE_KEY);
      this.isSimulationMode = savedMode === 'simulation';
    } catch {
      // storage unavailable (e.g. strict sandbox)
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    this.api.Token = token;
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // ignore storage error
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public setSimulationMode(enabled: boolean) {
    this.isSimulationMode = enabled;
    try {
      localStorage.setItem(API_MODE_STORAGE_KEY, enabled ? 'simulation' : 'connected');
    } catch {
      // ignore
    }
  }

  public setBaseUrl(newUrl: string) {
    this.baseUrl = newUrl;
    this.api = new API(newUrl);
    if (this.token) {
      this.api.Token = this.token;
    }
  }
}

// Global singleton instance
export const apiClient = new SoochakApiClient();

// Seeded data for testing and local development simulation
export const SEED_ORGANIZATION: Organization = {
  _id: 'org_bizbandhan_prod',
  name: 'BizBandhan Technologies',
  slug: 'bizbandhan-tech',
  canonicalOrigin: 'https://bizbandhan.com',
  allowedOrigins: ['https://bizbandhan.com', 'https://app.bizbandhan.com', 'https://dev.bizbandhan.com'],
  limits: {
    maxSubscribers: 100000,
    maxNotificationsPerDay: 5000,
  },
  createdAt: '2026-03-15T09:30:00.000Z',
  updatedAt: '2026-10-20T14:20:00.000Z',
  ownerId: 'usr_om_tiwari',
  ownerName: 'Om Prakash Tiwari',
  hostnameVerified: false, // Explicitly false / unavailable
  status: 'active',
};

export const SEED_USER: UserProfile = {
  _id: 'usr_om_tiwari',
  user: 'optiwari',
  name: {
    first: 'Om Prakash',
    last: 'Tiwari',
  },
  email: 'optiwari.india@gmail.com',
  phone: '+91 98765 43210',
  sex: 'male',
  dob: '1992-06-15',
  timezone: 'Asia/Kolkata',
  profilePicture: '',
  organizationId: 'org_bizbandhan_prod',
  roles: ['owner', 'administrator'],
  createdAt: '2026-03-15T09:30:00.000Z',
};

export const SEED_VAPID_CONFIG: PublicVapidConfig = {
  publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgD zk9wXmK9uV5-k8LhV8VqBv9gN_vP1z-e5P2vTzM34=',
  version: 'RFC 8292 Standard',
  contactEmail: 'security@bizbandhan.com',
};

export const SEED_SUBSCRIBERS: PushSubscriber[] = [
  {
    _id: 'sub_001',
    endpoint: 'https://fcm.googleapis.com/fcm/send/eR5k9_SoochakProd_TokenA1',
    keys: {
      p256dh: 'BNcRdreALRFXTkOOUHK18WK25ypqS9Da89B',
      auth: '5r3HkQ89VlaM1',
    },
    origin: 'https://bizbandhan.com',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0',
    tag: 'product_updates',
    active: true,
    createdAt: '2026-10-25T11:20:00.000Z',
  },
  {
    _id: 'sub_002',
    endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/gAAAAABne...',
    keys: {
      p256dh: 'BOD0wXjN-L8l-4Z-W4e7T9B2k4xL0',
      auth: 'K7vR41mNp9',
    },
    origin: 'https://bizbandhan.com',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
    tag: 'developer_announcements',
    active: true,
    createdAt: '2026-10-26T08:14:00.000Z',
  },
  {
    _id: 'sub_003',
    endpoint: 'https://web.push.apple.com/QIx61o-871B9N_ApplePushIdToken...',
    keys: {
      p256dh: 'BPl49Q2mV5xN0rZ1wX8_AppleVapidKey',
      auth: 'M3vT99Lo0a',
    },
    origin: 'https://app.bizbandhan.com',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    tag: 'critical_alerts',
    active: true,
    createdAt: '2026-10-27T16:45:00.000Z',
  },
  {
    _id: 'sub_004',
    endpoint: 'https://fcm.googleapis.com/fcm/send/fN9k2_SoochakAndroid_P9',
    keys: {
      p256dh: 'BCz71W8kP2vM4lR0qT9',
      auth: 'Z4bN88pQ2',
    },
    origin: 'https://bizbandhan.com',
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) Chrome/131.0.0.0 Mobile Safari/537.36',
    tag: 'product_updates',
    active: true,
    createdAt: '2026-10-28T09:10:00.000Z',
  },
];

export const SEED_NOTIFICATIONS: NotificationRecord[] = [
  {
    _id: 'notif_001',
    title: 'Platform Maintenance Notice',
    body: 'Scheduled gateway enhancements will occur tonight at 02:00 UTC. Push deliveries will queue seamlessly.',
    url: 'https://bizbandhan.com/status',
    tag: 'maintenance',
    status: 'accepted',
    acceptedAt: '2026-10-27T14:00:00.000Z',
    targetAudience: 'all',
    deliveryStats: {
      totalRecipients: 4280,
      queuedCount: 4280,
      note: 'Accepted by Soochak ingestion pipeline; delivery events emitted to upstream push service.',
    },
  },
  {
    _id: 'notif_002',
    title: 'New API Features in v1.4',
    body: 'Explore high-throughput batch notify endpoints and fine-grained subscriber tags in your dashboard.',
    url: 'https://bizbandhan.com/changelog',
    tag: 'product_updates',
    status: 'accepted',
    acceptedAt: '2026-10-28T10:15:00.000Z',
    targetAudience: 'tag_filtered',
    targetTag: 'product_updates',
    deliveryStats: {
      totalRecipients: 1840,
      queuedCount: 1840,
      note: 'Accepted for processing; provider fan-out in progress.',
    },
  },
];

export const SEED_SITES: SiteResource[] = [
  {
    _id: 'site_001',
    name: 'BizBandhan Marketing Site',
    origin: 'https://bizbandhan.com',
    subscriberCount: 3410,
    subscriberLimit: 50000,
    serviceWorkerPath: '/sw.js',
    status: 'active',
    createdAt: '2026-03-20T10:00:00.000Z',
  },
  {
    _id: 'site_002',
    name: 'BizBandhan Web App Console',
    origin: 'https://app.bizbandhan.com',
    subscriberCount: 870,
    subscriberLimit: 25000,
    serviceWorkerPath: '/worker.js',
    status: 'active',
    createdAt: '2026-04-12T15:30:00.000Z',
  },
];

export const SEED_ADMIN_USERS: ManagedUser[] = [
  {
    _id: 'usr_om_tiwari',
    user: 'optiwari',
    name: 'Om Prakash Tiwari',
    email: 'optiwari.india@gmail.com',
    roles: ['Owner', 'Administrator'],
    status: 'active',
    lastActive: 'Just now',
  },
  {
    _id: 'usr_sarah_chen',
    user: 'schen',
    name: 'Sarah Chen',
    email: 'sarah.chen@bizbandhan.com',
    roles: ['Operator'],
    status: 'active',
    lastActive: '2 hours ago',
  },
  {
    _id: 'usr_alex_dev',
    user: 'alexm',
    name: 'Alex Mercer',
    email: 'alex.m@bizbandhan.com',
    roles: ['Developer'],
    status: 'invited',
    lastActive: 'Pending invite acceptance',
  },
];

export const SEED_ROLES: Role[] = [
  {
    _id: 'role_owner',
    name: 'Organization Owner',
    description: 'Full administrative control, billing, domain management, and ownership transfer.',
    permissions: ['org:*', 'push:*', 'subscribers:*', 'users:*', 'settings:*'],
    isSystem: true,
    createdAt: '2026-03-15T09:30:00.000Z',
  },
  {
    _id: 'role_operator',
    name: 'Push Operator',
    description: 'Can compose notifications, view subscriber metrics, and inspect delivery outcomes.',
    permissions: ['push:compose', 'push:read', 'subscribers:read'],
    isSystem: true,
    createdAt: '2026-03-15T09:30:00.000Z',
  },
  {
    _id: 'role_developer',
    name: 'Integration Developer',
    description: 'Access to public VAPID keys, site integration scripts, and subscriber API diagnostics.',
    permissions: ['push:config:read', 'subscribers:*', 'sites:read'],
    isSystem: true,
    createdAt: '2026-03-15T09:30:00.000Z',
  },
];

export const SEED_PERMISSIONS: Permission[] = [
  { _id: 'perm_01', key: 'push:notify', name: 'Emit Notifications', description: 'Trigger web push dispatch to subscriber endpoints', resource: 'web-push', action: 'create' },
  { _id: 'perm_02', key: 'push:config:read', name: 'View VAPID Config', description: 'Read public VAPID key and configuration', resource: 'web-push', action: 'read' },
  { _id: 'perm_03', key: 'subscribers:manage', name: 'Manage Subscribers', description: 'Query, register, and delete push subscriptions', resource: 'subscribers', action: 'manage' },
  { _id: 'perm_04', key: 'org:settings:update', name: 'Update Org Settings', description: 'Update profile and limits', resource: 'organization', action: 'update' },
  { _id: 'perm_05', key: 'users:manage', name: 'Administer Users', description: 'Invite, assign roles, and revoke member access', resource: 'users', action: 'manage' },
];
