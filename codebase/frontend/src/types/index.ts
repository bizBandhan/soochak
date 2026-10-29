/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Type Definitions
 */

export type EndpointStatus = 'connected' | 'planned' | 'unavailable' | 'accepted';

export interface UserProfile {
  _id: string;
  user: string;
  name: {
    first: string;
    last: string;
  };
  email: string;
  phone?: string;
  sex?: 'male' | 'female' | 'other';
  dob?: string;
  timezone?: string;
  profilePicture?: string;
  organizationId?: string;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationLimits {
  maxSubscribers: number;
  maxNotificationsPerDay: number;
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  canonicalOrigin: string;
  allowedOrigins?: string[];
  limits?: OrganizationLimits;
  createdAt: string;
  updatedAt?: string;
  ownerId?: string;
  ownerName?: string;
  hostnameVerified: boolean; // Planned/unavailable backend verification
  status: 'active' | 'pending_provisioning' | 'suspended';
}

export interface OrganizationRegistrationPayload {
  name: string;
  slug: string;
  limits?: Partial<OrganizationLimits>;
  owner: {
    user: string;
    name: {
      first: string;
      last: string;
    };
    sex: 'male' | 'female' | 'other';
    dob: string;
    email: string;
    phone?: string;
    timezone?: string;
    profilePicture?: string;
    password: string;
  };
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriber {
  _id: string;
  endpoint: string;
  keys: PushSubscriptionKeys;
  expirationTime?: number | null;
  origin?: string;
  userAgent?: string;
  tag?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
  icon?: string;
}

export interface NotificationRecord {
  _id: string;
  title: string;
  body: string;
  url: string;
  tag?: string;
  icon?: string;
  status: 'accepted' | 'delivered' | 'failed';
  acceptedAt: string;
  targetAudience: 'all' | 'tag_filtered' | 'single';
  targetTag?: string;
  deliveryStats?: {
    totalRecipients: number;
    queuedCount: number;
    note: string;
  };
}

export interface PublicVapidConfig {
  publicKey: string;
  version?: string;
  contactEmail?: string;
}

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
}

export interface Permission {
  _id: string;
  key: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface ManagedUser {
  _id: string;
  user: string;
  name: string;
  email: string;
  roles: string[];
  status: 'active' | 'invited' | 'disabled';
  lastActive?: string;
}

export interface SiteResource {
  _id: string;
  name: string;
  origin: string;
  subscriberCount: number;
  subscriberLimit: number;
  serviceWorkerPath: string;
  status: 'active' | 'verifying' | 'unverified';
  createdAt: string;
}
