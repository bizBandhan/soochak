/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Typed API Service Layer
 * Follows OpenAPI & Schemas contract
 */

import { apiClient } from './apiClient';
import type {
  Organization,
  OrganizationRegistrationPayload,
  OrganizationRegistrationResult,
  UserProfile,
  PushSubscriber,
  NotificationPayload,
  NotificationRecord,
  NotificationProviderSummary,
  PublicVapidConfig,
  SiteResource,
  ManagedUser,
  Role,
  Permission,
} from '../types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeCurrentUser = (response: unknown): UserProfile => {
  const payload =
    isRecord(response) && 'data' in response ? response.data : response;
  const user = isRecord(payload) && 'user' in payload ? payload.user : payload;

  if (!isRecord(user)) {
    throw new Error('The /me response did not include user details.');
  }

  const id =
    typeof user._id === 'string' ? user._id :
    typeof user.id === 'string' ? user.id :
    null;
  const email = typeof user.email === 'string' ? user.email : null;

  if (!id || !email || (isRecord(payload) && payload.authenticated === false)) {
    throw new Error('The /me response did not include valid user details.');
  }

  const name = user.name;
  const fullName = typeof name === 'string' ? name.trim() : '';
  const nameParts = fullName ? fullName.split(/\s+/) : [];
  const nameRecord = isRecord(name) ? name : {};
  const first =
    typeof nameRecord.first === 'string' ? nameRecord.first :
    nameParts[0] || email.split('@')[0];
  const last =
    typeof nameRecord.last === 'string' ? nameRecord.last :
    nameParts.slice(1).join(' ');

  return {
    _id: id,
    user: typeof user.user === 'string' ? user.user : email,
    name: { first, last },
    email,
    phone: typeof user.phone === 'string' ? user.phone : undefined,
    sex: typeof user.sex === 'string' && ['male', 'female', 'other'].includes(user.sex.toLowerCase())
      ? (user.sex.toLowerCase() as UserProfile['sex'])
      : undefined,
    dob: typeof user.dob === 'string' ? user.dob : undefined,
    timezone: typeof user.timezone === 'string' ? user.timezone : undefined,
    profilePicture: typeof user.profilePicture === 'string' ? user.profilePicture : undefined,
    organizationId: typeof user.organizationId === 'string' ? user.organizationId : undefined,
    roles: Array.isArray(user.roles) && user.roles.every((role) => typeof role === 'string')
      ? user.roles
      : typeof user.role === 'string' ? [user.role] : undefined,
    createdAt: typeof user.createdAt === 'string' ? user.createdAt : undefined,
    updatedAt: typeof user.updatedAt === 'string' ? user.updatedAt : undefined,
  };
};

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
  async login(credentials: { user: string; password: string }): Promise<{ token: string | null; user: UserProfile }> {
    const res = await apiClient.api.put('/auth', credentials);
    apiClient.setToken(null);
    return { token: null, user: normalizeCurrentUser(res) };
  },

  /**
   * GET /me
   * Retrieve current auth status and user details
   */
  async getCurrentUser(): Promise<UserProfile> {
    const response: unknown = await apiClient.api.get('/me');
    return normalizeCurrentUser(response);
  },

  /**
   * PATCH /me
   * Update current user profile fields
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await apiClient.api.patch('/me', updates);
    return normalizeCurrentUser(res);
  },

  /**
   * POST /me
   * Change current password
   */
  async changePassword(passwords: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const res = await apiClient.api.post('/me', passwords);
    if (res?.status !== 'success') throw new Error('The server did not confirm the password update.');
    return { message: res.message || 'Password updated successfully.' };
  },

  /**
   * DELETE /auth
   * Logout and invalidate session
   */
  async logout(): Promise<void> {
    await apiClient.api.delete('/auth');
    apiClient.setToken(null);
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
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.data)) return res.data;
      throw new Error('The server did not return an organization list.');
    } catch (err: any) { throw err; }
  },

  /**
   * POST /auth/organization
   * Filter/query organizations
   */
  async search(query: any): Promise<Organization[]> {
    try {
      const res = await apiClient.api.post('/auth/organization', query);
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.data)) return res.data;
      throw new Error('The server did not return an organization list.');
    } catch (err: any) { throw err; }
  },

  /**
   * PUT /auth/organization
   * Register new organization and emit async owner provisioning
   */
  async register(payload: OrganizationRegistrationPayload): Promise<OrganizationRegistrationResult> {
    try {
      const res = await apiClient.api.put('/auth/organization', payload);
      let responseData: unknown = res;
      for (let depth = 0; depth < 2 && isRecord(responseData) && 'data' in responseData; depth += 1) {
        responseData = responseData.data;
      }
      const organizationData =
        isRecord(responseData) && 'organization' in responseData
          ? responseData.organization
          : responseData;
      if (!isRecord(organizationData)) {
        throw new Error('The registration response did not include the created workspace.');
      }
      const id = typeof organizationData._id === 'string' ? organizationData._id : '';
      const name = typeof organizationData.name === 'string' ? organizationData.name : '';
      const slug = typeof organizationData.slug === 'string' ? organizationData.slug : '';
      const workspaceHost =
        typeof organizationData.workspaceHost === 'string' ? organizationData.workspaceHost : '';
      const workspaceUrl =
        typeof organizationData.workspaceUrl === 'string' ? organizationData.workspaceUrl : '';
      if (!id || !name || !slug || !workspaceHost || !workspaceUrl) {
        throw new Error('The registration response did not include valid organization and workspace details.');
      }
      return {
        organization: { _id: id, name, slug },
        workspaceHost,
        workspaceUrl,
        provisioningStatus: 'owner_provisioned',
        warningNote: 'Your personal workspace is ready. Sign in on its hostname using the credentials you just created.',
      };
    } catch (err: any) {
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
    const res: unknown = await apiClient.api.get('/web-push/config');
    const payload: unknown = isRecord(res) && 'data' in res ? res.data : res;
    if (typeof payload !== 'string' || !payload) {
      const message = isRecord(res) && typeof res.message === 'string' && res.message
        ? res.message : 'The server did not return a valid public VAPID key.';
      throw new Error(message);
    }
    return { publicKey: payload };
  },

  /**
   * GET /web-push/subscriber
   * List subscribers
   */
  async listSubscribers(): Promise<PushSubscriber[]> {
    try {
      const res = await apiClient.api.get('/web-push/subscriber');
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.data)) return res.data;
      throw new Error('The server did not return a subscriber list.');
    } catch (err: any) {
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
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.data)) return res.data;
      throw new Error('The server did not return a subscriber list.');
    } catch (err: any) {
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
      throw err;
    }
  },

  /**
   * DELETE /web-push/subscriber/{id}
   * Delete subscriber by id
   */
  async deleteSubscriber(id: string): Promise<void> {
    try {
      await apiClient.api.delete(`/web-push/subscriber/${encodeURIComponent(id)}`);
    } catch (err: any) {
      throw err;
    }
  },

  /**
   * PUT /web-push/notify
   * Persists the notification and starts in-process provider dispatch.
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
      if (!res?.data?._id || !res.data.createdAt) {
        throw new Error('The server did not return a valid notification record.');
      }
      return {
        success: true,
        notificationId: res.data._id,
        status: 'accepted',
        message: 'Notification saved and provider dispatch started. Check notification history for provider outcomes.',
        persistedAt: res.data.createdAt,
      };
    } catch (err: any) {
      throw err;
    }
  },

  /**
   * List persisted notification records.
   */
  async listNotifications(): Promise<{ records: NotificationRecord[]; backendUnderDevelopment: boolean }> {
    try {
      const res = await apiClient.api.get('/web-push/notify');
      const records: unknown = Array.isArray(res) ? res : res.data;
      if (!Array.isArray(records)) throw new Error('The server did not return notification records.');
      return {
        records: records.map((record: unknown) => {
          if (!isRecord(record) || typeof record._id !== 'string' || typeof record.title !== 'string'
            || typeof record.body !== 'string' || typeof record.url !== 'string'
            || typeof record.createdAt !== 'string') {
            throw new Error('The server returned an invalid notification record.');
          }
          return {
            _id: record._id, title: record.title, body: record.body, url: record.url,
            tag: typeof record.tag === 'string' ? record.tag : undefined,
            acceptedAt: record.createdAt, status: 'accepted' as const, targetAudience: 'all' as const,
          };
        }),
        backendUnderDevelopment: false,
      };
    } catch (err: any) {
      throw err;
    }
  },
  async notificationStatus(id: string): Promise<NotificationProviderSummary> {
    const response: unknown = await apiClient.api.get(`/web-push/notify/${encodeURIComponent(id)}/status`);
    const data = isRecord(response) ? response.data : undefined;
    if (!isRecord(data) || typeof data.available !== 'boolean') {
      throw new Error('The server did not return valid provider status.');
    }
    if (!data.available) return { available: false };
    const fields = ['total', 'queued', 'attempted', 'accepted', 'failed', 'expired', 'unknown'] as const;
    if (fields.some((key) => {
      const value = data[key];
      return typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0;
    })) {
      throw new Error('The server returned invalid provider status counts.');
    }
    return {
      available: true,
      total: Number(data.total), queued: Number(data.queued), attempted: Number(data.attempted),
      accepted: Number(data.accepted), failed: Number(data.failed), expired: Number(data.expired), unknown: Number(data.unknown),
    };
  },
};

export const sitesService = {
  async listSites(): Promise<SiteResource[]> {
    const response: unknown = await apiClient.api.get('/web-push/site');
    const data = isRecord(response) ? response.data : undefined;
    if (!Array.isArray(data)) {
      throw new Error(isRecord(response) && typeof response.message === 'string' ? response.message : 'Failed to load sites.');
    }
    return data;
  },
  async addSite(site: Pick<SiteResource, 'name' | 'origin' | 'serviceWorkerPath'>): Promise<SiteResource> {
    const response: unknown = await apiClient.api.put('/web-push/site', site);
    const data = isRecord(response) ? response.data : undefined;
    if (!isRecord(data) || typeof data._id !== 'string' || typeof data.name !== 'string'
        || typeof data.origin !== 'string' || typeof data.serviceWorkerPath !== 'string'
        || typeof data.createdAt !== 'string') {
      throw new Error(isRecord(response) && typeof response.message === 'string' ? response.message : 'Failed to save site.');
    }
    return { _id: data._id, name: data.name, origin: data.origin, serviceWorkerPath: data.serviceWorkerPath, createdAt: data.createdAt };
  },
  async deleteSite(id: string): Promise<void> {
    const response: unknown = await apiClient.api.delete(`/web-push/site/${encodeURIComponent(id)}`);
    if (!isRecord(response) || response.status !== 'success') {
      throw new Error(isRecord(response) && typeof response.message === 'string' ? response.message : 'Failed to remove site.');
    }
  },
};
