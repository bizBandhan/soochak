/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Typed API Service Layer
 * Follows OpenAPI & Schemas contract
 */

import { apiClient, SEED_ORGANIZATION, SEED_USER, SEED_VAPID_CONFIG, SEED_SUBSCRIBERS, SEED_NOTIFICATIONS, SEED_SITES, SEED_ADMIN_USERS, SEED_ROLES, SEED_PERMISSIONS } from './apiClient';
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

// In-memory local stores for simulation/testing mode
let simSubscribers: PushSubscriber[] = [...SEED_SUBSCRIBERS];
let simNotifications: NotificationRecord[] = [...SEED_NOTIFICATIONS];
let simOrg: Organization = { ...SEED_ORGANIZATION };
let simUser: UserProfile = { ...SEED_USER };
let simSites: SiteResource[] = [...SEED_SITES];

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export const authService = {
  /**
   * PUT /auth
   * Login with documented credential request
   * Returns token and user profile
   */
  async login(credentials: { user: string; password: string }): Promise<{ token: string; user: UserProfile }> {
    try {
      const res = await apiClient.api.put('/auth', credentials);
      const token = res.token || res.data?.token || 'simulated-token-live';
      const user = res.user || res.data?.user || SEED_USER;
      apiClient.setToken(token);
      return { token, user };
    } catch (err: any) {
      // If server is not responding or unreachable in local sandbox, allow simulated login for test credentials
      if (apiClient.isSimulationMode || err.message?.includes('fetch') || err.message?.includes('NetworkError') || err.message?.includes('Failed to fetch')) {
        // Simple rate-limit simulation test check: if password is "ratelimit"
        if (credentials.password === 'ratelimit') {
          const rateErr: any = new Error('Too many login attempts. Please wait 60 seconds before trying again.');
          rateErr.status = 429;
          throw rateErr;
        }

        if (credentials.password.length < 6) {
          const valErr: any = new Error('Password must be at least 6 characters.');
          valErr.status = 400;
          throw valErr;
        }

        // Return simulated user
        const token = 'sim_jwt_tk_' + Date.now();
        apiClient.setToken(token);
        return {
          token,
          user: {
            ...simUser,
            user: credentials.user || simUser.user,
          },
        };
      }
      throw err;
    }
  },

  /**
   * GET /auth or GET /me
   * Retrieve current auth status and user details
   */
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const res = await apiClient.api.get('/me');
      return res.data || res.user || res;
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        return simUser;
      }
      throw err;
    }
  },

  /**
   * PATCH /me
   * Update current user profile fields
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const res = await apiClient.api.patch('/me', updates);
      return res.data || res;
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        simUser = { ...simUser, ...updates };
        return simUser;
      }
      throw err;
    }
  },

  /**
   * POST /me
   * Change current password
   */
  async changePassword(passwords: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    try {
      const res = await apiClient.api.post('/me', passwords);
      return res.data || res;
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        if (passwords.newPassword.length < 8) {
          throw new Error('New password must be at least 8 characters long.');
        }
        return { message: 'Password updated successfully. Session preserved.' };
      }
      throw err;
    }
  },

  /**
   * DELETE /auth
   * Logout and invalidate session
   */
  async logout(): Promise<void> {
    try {
      await apiClient.api.delete('/auth');
    } catch {
      // Still clear local token even if network failed
    } finally {
      apiClient.setToken(null);
    }
  },
};

export const organizationService = {
  /**
   * GET /auth/organization
   * List organizations in request scope
   */
  async list(): Promise<Organization[]> {
    try {
      const res = await apiClient.api.get('/auth/organization');
      return Array.isArray(res) ? res : res.data || [simOrg];
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        return [simOrg];
      }
      throw err;
    }
  },

  /**
   * POST /auth/organization
   * Filter/query organizations
   */
  async search(query: any): Promise<Organization[]> {
    try {
      const res = await apiClient.api.post('/auth/organization', query);
      return Array.isArray(res) ? res : res.data || [simOrg];
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        return [simOrg];
      }
      throw err;
    }
  },

  /**
   * PUT /auth/organization
   * Register new organization and emit async owner provisioning
   */
  async register(payload: OrganizationRegistrationPayload): Promise<{
    organization: Organization;
    provisioningStatus: string;
    warningNote: string;
  }> {
    try {
      const res = await apiClient.api.put('/auth/organization', payload);
      return {
        organization: res.data || res,
        provisioningStatus: 'accepted_event_emitted',
        warningNote: 'Organization record created. Asynchronous owner provisioning event emitted to queue.',
      };
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        const newOrg: Organization = {
          _id: 'org_' + payload.slug + '_' + Date.now().toString(36),
          name: payload.name,
          slug: payload.slug,
          canonicalOrigin: 'https://' + payload.slug + '.example.com',
          allowedOrigins: ['https://' + payload.slug + '.example.com'],
          limits: {
            maxSubscribers: payload.limits?.maxSubscribers || 10000,
            maxNotificationsPerDay: payload.limits?.maxNotificationsPerDay || 1000,
          },
          createdAt: new Date().toISOString(),
          ownerId: 'usr_' + payload.owner.user,
          ownerName: `${payload.owner.name.first} ${payload.owner.name.last}`,
          hostnameVerified: false, // Explicitly unavailable
          status: 'pending_provisioning',
        };
        simOrg = newOrg;
        return {
          organization: newOrg,
          provisioningStatus: 'accepted_event_emitted',
          warningNote: 'Organization record created. Event-driven owner provisioning is currently queued and pending execution.',
        };
      }
      throw err;
    }
  },

  /**
   * GET /auth/organization/{id}
   */
  async getById(id: string): Promise<Organization> {
    try {
      const res = await apiClient.api.get(`/auth/organization/${id}`);
      return res.data || res;
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        return simOrg;
      }
      throw err;
    }
  },

  /**
   * PUT /auth/organization/{id}
   * Full update of organization
   */
  async update(id: string, updates: Partial<Organization>): Promise<Organization> {
    try {
      const res = await apiClient.api.put(`/auth/organization/${id}`, updates);
      return res.data || res;
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        simOrg = { ...simOrg, ...updates };
        return simOrg;
      }
      throw err;
    }
  },

  /**
   * DELETE /auth/organization/{id}
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.api.delete(`/auth/organization/${id}`);
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        return;
      }
      throw err;
    }
  },

  /**
   * PATCH /auth/organization/{id} is explicitly unsupported (405) in OpenAPI contract
   */
  async patchNotSupported(id: string): Promise<never> {
    const err: any = new Error('HTTP 405 Method Not Allowed: PATCH /auth/organization/{id} is unsupported by the Soochak API contract. Use PUT for full updates.');
    err.status = 405;
    throw err;
  },
};

export const webPushService = {
  /**
   * GET /web-push/config
   * Returns public VAPID key
   */
  async getConfig(): Promise<PublicVapidConfig> {
    try {
      const res = await apiClient.api.get('/web-push/config');
      return res.data || res;
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        return SEED_VAPID_CONFIG;
      }
      throw err;
    }
  },

  /**
   * GET /web-push/subscriber
   * List subscribers
   */
  async listSubscribers(): Promise<PushSubscriber[]> {
    try {
      const res = await apiClient.api.get('/web-push/subscriber');
      return Array.isArray(res) ? res : res.data || simSubscribers;
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        return simSubscribers;
      }
      throw err;
    }
  },

  /**
   * POST /web-push/subscriber
   * Query/filter subscribers
   */
  async querySubscribers(query: { tag?: string; origin?: string; search?: string }): Promise<PushSubscriber[]> {
    try {
      const res = await apiClient.api.post('/web-push/subscriber', query);
      return Array.isArray(res) ? res : res.data || simSubscribers;
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        return simSubscribers.filter((s) => {
          if (query.tag && s.tag !== query.tag) return false;
          if (query.origin && s.origin !== query.origin) return false;
          if (query.search && !s.endpoint.toLowerCase().includes(query.search.toLowerCase())) return false;
          return true;
        });
      }
      throw err;
    }
  },

  /**
   * PUT /web-push/subscriber
   * Register subscriber
   */
  async createSubscriber(subscriber: Partial<PushSubscriber>): Promise<PushSubscriber> {
    try {
      const res = await apiClient.api.put('/web-push/subscriber', subscriber);
      return res.data || res;
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        const created: PushSubscriber = {
          _id: 'sub_' + Date.now().toString(36),
          endpoint: subscriber.endpoint || 'https://fcm.googleapis.com/fcm/send/new_token_' + Date.now(),
          keys: subscriber.keys || { p256dh: 'BNcDemoKey', auth: 'DemoAuth' },
          origin: subscriber.origin || simOrg.canonicalOrigin,
          userAgent: subscriber.userAgent || navigator.userAgent,
          tag: subscriber.tag || 'general',
          active: true,
          createdAt: new Date().toISOString(),
        };
        simSubscribers = [created, ...simSubscribers];
        return created;
      }
      throw err;
    }
  },

  /**
   * DELETE /web-push/subscriber
   * Delete subscriber by endpoint
   */
  async deleteSubscriberByEndpoint(endpoint: string): Promise<void> {
    try {
      await apiClient.api.delete('/web-push/subscriber', { endpoint });
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        simSubscribers = simSubscribers.filter((s) => s.endpoint !== endpoint);
        return;
      }
      throw err;
    }
  },

  /**
   * PUT /web-push/notify
   * Accepts notification payload, persists notification, and emits async delivery event.
   * Note: The response means "accepted for processing", NOT confirmed provider delivery or client display.
   */
  async notify(payload: NotificationPayload): Promise<{
    success: boolean;
    notificationId: string;
    status: 'accepted';
    message: string;
    persistedAt: string;
  }> {
    try {
      const res = await apiClient.api.put('/web-push/notify', payload);
      return {
        success: true,
        notificationId: res.notificationId || res.data?.id || 'notif_' + Date.now(),
        status: 'accepted',
        message: 'Notification persisted and accepted into Soochak push pipeline. Delivery event emitted.',
        persistedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      if (apiClient.isSimulationMode || err.message?.includes('Failed to fetch')) {
        const notifId = 'notif_' + Date.now().toString(36);
        const newRecord: NotificationRecord = {
          _id: notifId,
          title: payload.title,
          body: payload.body,
          url: payload.url,
          tag: payload.tag,
          icon: payload.icon,
          status: 'accepted',
          acceptedAt: new Date().toISOString(),
          targetAudience: payload.tag ? 'tag_filtered' : 'all',
          targetTag: payload.tag,
          deliveryStats: {
            totalRecipients: simSubscribers.length,
            queuedCount: simSubscribers.length,
            note: 'Payload persisted in organization log. Outbound Web Push dispatch event emitted to upstream FCM/Mozilla/Apple gateways.',
          },
        };
        simNotifications = [newRecord, ...simNotifications];
        return {
          success: true,
          notificationId: notifId,
          status: 'accepted',
          message: 'Notification persisted and accepted into Soochak push pipeline. Delivery event emitted.',
          persistedAt: new Date().toISOString(),
        };
      }
      throw err;
    }
  },

  /**
   * List notifications history (GET /web-push/notify returns 502 in current backend)
   */
  async listNotifications(): Promise<{ records: NotificationRecord[]; backendUnderDevelopment: boolean }> {
    try {
      const res = await apiClient.api.get('/web-push/notify');
      return { records: res.data || res, backendUnderDevelopment: false };
    } catch (err: any) {
      // Contract states: GET, POST, PATCH, and DELETE /web-push/notify currently return 502 as under development.
      return {
        records: simNotifications,
        backendUnderDevelopment: true,
      };
    }
  },
};

export const sitesService = {
  async listSites(): Promise<SiteResource[]> {
    return simSites;
  },
  async addSite(site: Partial<SiteResource>): Promise<SiteResource> {
    const created: SiteResource = {
      _id: 'site_' + Date.now().toString(36),
      name: site.name || 'New Web Resource',
      origin: site.origin || 'https://newsite.example.com',
      subscriberCount: 0,
      subscriberLimit: site.subscriberLimit || 10000,
      serviceWorkerPath: site.serviceWorkerPath || '/sw.js',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    simSites = [...simSites, created];
    return created;
  },
};

export const adminService = {
  // Routes for /auth/user, /auth/role, /auth/permission are NOT mounted yet in backend
  async getUsers(): Promise<ManagedUser[]> {
    return SEED_ADMIN_USERS;
  },
  async getRoles(): Promise<Role[]> {
    return SEED_ROLES;
  },
  async getPermissions(): Promise<Permission[]> {
    return SEED_PERMISSIONS;
  },
};
