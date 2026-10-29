/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Soochak by BizBandhan — Auth & Organization Context
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { UserProfile, Organization, OrganizationRegistrationPayload } from '../types';
import { authService, organizationService } from '../services/apiAdapters';
import { apiClient, SEED_ORGANIZATION, SEED_USER } from '../services/apiClient';

interface AuthContextType {
  user: UserProfile | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSimulationMode: boolean;
  setSimulationMode: (enabled: boolean) => void;
  login: (credentials: { user: string; password: string }) => Promise<{ token: string; user: UserProfile }>;
  registerOrganization: (payload: OrganizationRegistrationPayload) => Promise<{
    organization: Organization;
    provisioningStatus: string;
    warningNote: string;
  }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  changePassword: (passwords: { currentPassword: string; newPassword: string }) => Promise<{ message: string }>;
  reloadOrg: () => Promise<void>;
  updateOrg: (updates: Partial<Organization>) => Promise<Organization>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [token, setToken] = useState<string | null>(apiClient.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulationMode, setIsSimulationModeState] = useState<boolean>(apiClient.isSimulationMode);

  const setSimulationMode = useCallback((enabled: boolean) => {
    apiClient.setSimulationMode(enabled);
    setIsSimulationModeState(enabled);
  }, []);

  const reloadOrg = useCallback(async () => {
    try {
      const orgs = await organizationService.list();
      if (orgs.length > 0) {
        setOrganization(orgs[0]);
      } else {
        setOrganization(SEED_ORGANIZATION);
      }
    } catch {
      setOrganization(SEED_ORGANIZATION);
    }
  }, []);

  const initAuth = useCallback(async () => {
    setIsLoading(true);
    const existingToken = apiClient.getToken();
    if (existingToken) {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setToken(existingToken);
        await reloadOrg();
      } catch {
        // Fallback to active demo state so operator doesn't get blocked
        setUser(SEED_USER);
        setOrganization(SEED_ORGANIZATION);
      }
    } else {
      // For immediate preview convenience, start with signed-in operator session
      // (User can also test explicit Logout and Login flow)
      setUser(SEED_USER);
      setOrganization(SEED_ORGANIZATION);
      setToken('seed-operator-token');
      apiClient.setToken('seed-operator-token');
    }
    setIsLoading(false);
  }, [reloadOrg]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (credentials: { user: string; password: string }) => {
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      setUser(result.user);
      setToken(result.token);
      await reloadOrg();
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const registerOrganization = async (payload: OrganizationRegistrationPayload) => {
    setIsLoading(true);
    try {
      const result = await organizationService.register(payload);
      setOrganization(result.organization);
      // Owner provisioning is asynchronous event-driven, but set local owner identity
      const ownerUser: UserProfile = {
        _id: 'usr_' + payload.owner.user,
        user: payload.owner.user,
        name: payload.owner.name,
        email: payload.owner.email,
        phone: payload.owner.phone,
        sex: payload.owner.sex,
        dob: payload.owner.dob,
        timezone: payload.owner.timezone || 'UTC',
        organizationId: result.organization._id,
        roles: ['owner'],
      };
      setUser(ownerUser);
      setToken('sim_token_registered_' + Date.now());
      apiClient.setToken('sim_token_registered_' + Date.now());
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = await authService.updateProfile(updates);
    setUser(updated);
    return updated;
  };

  const changePassword = async (passwords: { currentPassword: string; newPassword: string }) => {
    return await authService.changePassword(passwords);
  };

  const updateOrg = async (updates: Partial<Organization>) => {
    if (!organization) throw new Error('No active organization');
    const updated = await organizationService.update(organization._id, updates);
    setOrganization(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isSimulationMode,
        setSimulationMode,
        login,
        registerOrganization,
        logout,
        updateProfile,
        changePassword,
        reloadOrg,
        updateOrg,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
