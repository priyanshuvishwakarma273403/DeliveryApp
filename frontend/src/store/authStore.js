import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. Role Permission Definitions with Inheritance
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    'MENU_READ', 'MENU_CREATE', 'MENU_UPDATE', 'MENU_DELETE',
    'INVENTORY_READ', 'INVENTORY_UPDATE', 'ORDER_UPDATE', 'REFUND_APPROVAL',
    'COUPON_MANAGEMENT', 'ANALYTICS_ACCESS', 'DRIVER_MANAGEMENT', 'CUSTOMER_MANAGEMENT',
    'RESTAURANT_APPROVAL', 'SUPPORT_TICKET_MANAGEMENT', 'PLATFORM_CONFIGURATION',
    'ROLE_CHANGE', 'PERMISSION_CHANGE', 'AUDIT_LOG_READ'
  ],
  PLATFORM_ADMIN: [
    'MENU_READ', 'MENU_CREATE', 'MENU_UPDATE', 'MENU_DELETE',
    'INVENTORY_READ', 'ANALYTICS_ACCESS', 'CUSTOMER_MANAGEMENT',
    'RESTAURANT_APPROVAL', 'SUPPORT_TICKET_MANAGEMENT', 'PLATFORM_CONFIGURATION',
    'AUDIT_LOG_READ'
  ],
  RESTAURANT_OWNER: [
    'MENU_READ', 'MENU_CREATE', 'MENU_UPDATE', 'MENU_DELETE',
    'INVENTORY_READ', 'INVENTORY_UPDATE', 'ORDER_UPDATE', 'REFUND_APPROVAL',
    'COUPON_MANAGEMENT', 'ANALYTICS_ACCESS', 'DRIVER_MANAGEMENT'
  ],
  BRANCH_MANAGER: [
    'MENU_READ', 'INVENTORY_READ', 'INVENTORY_UPDATE', 'ORDER_UPDATE',
    'ANALYTICS_ACCESS'
  ],
  KITCHEN_STAFF: [
    'MENU_READ', 'INVENTORY_READ', 'ORDER_UPDATE'
  ],
  CASHIER: [
    'MENU_READ', 'ORDER_UPDATE', 'REFUND_APPROVAL'
  ],
  DELIVERY_PARTNER: [
    'ORDER_UPDATE', 'DRIVER_MANAGEMENT'
  ],
  SUPPORT_EXECUTIVE: [
    'CUSTOMER_MANAGEMENT', 'SUPPORT_TICKET_MANAGEMENT', 'MENU_READ'
  ],
  MODERATOR: [
    'CUSTOMER_MANAGEMENT', 'SUPPORT_TICKET_MANAGEMENT'
  ],
  CUSTOMER: [
    'MENU_READ'
  ]
};

// 2. Helper to get device info dynamically
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';

  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Macintosh')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone')) os = 'iOS';

  return {
    browser,
    os,
    device: /Mobile|Android|iPhone/i.test(userAgent) ? 'Mobile' : 'Desktop',
    ip: '192.168.1.45', // Simulated
    location: 'Delhi, India' // Simulated
  };
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Enterprise Data Stores
      users: [
        { id: 'usr-1', email: 'superadmin@foodiq.com', username: 'superadmin', name: 'Super Admin', phone: '+91 9999999999', role: 'SUPER_ADMIN', active: true, verified: true },
        { id: 'usr-2', email: 'admin@foodiq.com', username: 'admin', name: 'Platform Admin', phone: '+91 8888888888', role: 'PLATFORM_ADMIN', active: true, verified: true },
        { id: 'usr-3', email: 'owner@foodiq.com', username: 'owner', name: 'Restaurant Owner', phone: '+91 7777777777', role: 'RESTAURANT_OWNER', active: true, verified: true },
        { id: 'usr-4', email: 'manager@foodiq.com', username: 'manager', name: 'Branch Manager', phone: '+91 6666666666', role: 'BRANCH_MANAGER', active: true, verified: true },
        { id: 'usr-5', email: 'kitchen@foodiq.com', username: 'kitchen', name: 'Kitchen Staff', phone: '+91 5555555555', role: 'KITCHEN_STAFF', active: true, verified: true },
        { id: 'usr-6', email: 'cashier@foodiq.com', username: 'cashier', name: 'Cashier', phone: '+91 4444444444', role: 'CASHIER', active: true, verified: true },
        { id: 'usr-7', email: 'rider@foodiq.com', username: 'rider', name: 'Delivery Partner', phone: '+91 3333333333', role: 'DELIVERY_PARTNER', active: true, verified: true },
        { id: 'usr-8', email: 'support@foodiq.com', username: 'support', name: 'Support Executive', phone: '+91 2222222222', role: 'SUPPORT_EXECUTIVE', active: true, verified: true },
        { id: 'usr-9', email: 'moderator@foodiq.com', username: 'moderator', name: 'Moderator', phone: '+91 1111111111', role: 'MODERATOR', active: true, verified: true },
        { id: 'usr-10', email: 'customer@foodiq.com', username: 'customer', name: 'Premium Customer', phone: '+91 9876543210', role: 'CUSTOMER', active: true, verified: true }
      ],
      sessions: [],
      securityLogs: [],
      lockedAccounts: {}, // email -> lockUntilTimestamp
      failedLogins: {}, // email -> count
      passwordHistory: {}, // email -> list of used passwords

      // Core Actions
      login: (userData, token) => {
        const devInfo = getDeviceInfo();
        const newSession = {
          id: `sess-${Date.now()}`,
          loginTime: new Date().toISOString(),
          ...devInfo,
          isActive: true
        };

        set((state) => {
          // Add to current sessions
          const updatedSessions = [newSession, ...state.sessions].slice(0, 15);
          
          // Log success
          const logEntry = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: userData.id,
            username: userData.username || userData.name,
            email: userData.email,
            role: userData.role,
            action: 'LOGIN_SUCCESS',
            status: 'SUCCESS',
            details: `Logged in using device: ${devInfo.device} (${devInfo.browser} on ${devInfo.os})`,
            ...devInfo
          };

          return {
            user: userData,
            token: token,
            isAuthenticated: true,
            sessions: updatedSessions,
            securityLogs: [logEntry, ...state.securityLogs].slice(0, 100),
            // Reset failed counter
            failedLogins: { ...state.failedLogins, [userData.email.toLowerCase()]: 0 }
          };
        });
      },

      logout: () => {
        const currentUser = get().user;
        const devInfo = getDeviceInfo();

        set((state) => {
          const logEntry = currentUser ? {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            username: currentUser.username || currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            action: 'LOGOUT',
            status: 'SUCCESS',
            details: 'Signed out of session',
            ...devInfo
          } : null;

          return {
            user: null,
            token: null,
            isAuthenticated: false,
            sessions: [], // Clear local active sessions
            securityLogs: logEntry ? [logEntry, ...state.securityLogs].slice(0, 100) : state.securityLogs
          };
        });
      },

      updateUser: (userData) => set((state) => {
        const logEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: state.user?.id,
          username: state.user?.username || state.user?.name,
          email: state.user?.email,
          role: state.user?.role,
          action: 'PROFILE_UPDATE',
          status: 'SUCCESS',
          details: 'Updated profile fields: ' + Object.keys(userData).join(', '),
          ...getDeviceInfo()
        };

        return {
          user: { ...state.user, ...userData },
          securityLogs: [logEntry, ...state.securityLogs].slice(0, 100)
        };
      }),

      // Security Logging & Intrusion Prevention
      addSecurityLog: (log) => set((state) => ({
        securityLogs: [{
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          ...getDeviceInfo(),
          ...log
        }, ...state.securityLogs].slice(0, 100)
      })),

      registerUser: (newUser) => set((state) => {
        const generatedUser = {
          id: `usr-${Date.now()}`,
          ...newUser,
          active: true,
          verified: false
        };

        const logEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: generatedUser.id,
          username: generatedUser.username || generatedUser.name,
          email: generatedUser.email,
          role: generatedUser.role,
          action: 'REGISTRATION',
          status: 'SUCCESS',
          details: `Registered account as role: ${generatedUser.role}`,
          ...getDeviceInfo()
        };

        return {
          users: [...state.users, generatedUser],
          securityLogs: [logEntry, ...state.securityLogs].slice(0, 100)
        };
      }),

      incrementFailedLogins: (email) => set((state) => {
        const lowered = email.toLowerCase();
        const currentCount = (state.failedLogins[lowered] || 0) + 1;
        const updatedFailed = { ...state.failedLogins, [lowered]: currentCount };
        let updatedLocks = { ...state.lockedAccounts };

        const logEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          email: email,
          role: 'UNKNOWN',
          action: 'LOGIN_FAILURE',
          status: 'FAILED',
          details: `Failed login attempt #${currentCount} for email: ${email}`,
          ...getDeviceInfo()
        };

        // If exceeded 5 failures, lock account for 60 seconds
        if (currentCount >= 5) {
          const lockTime = Date.now() + 60 * 1000;
          updatedLocks[lowered] = lockTime;
          logEntry.action = 'ACCOUNT_LOCKED';
          logEntry.details = `Account locked due to 5 consecutive login failures.`;
          logEntry.status = 'WARNING';
        }

        return {
          failedLogins: updatedFailed,
          lockedAccounts: updatedLocks,
          securityLogs: [logEntry, ...state.securityLogs].slice(0, 100)
        };
      }),

      unlockAccount: (email) => set((state) => {
        const lowered = email.toLowerCase();
        const updatedLocks = { ...state.lockedAccounts };
        delete updatedLocks[lowered];

        const updatedFailed = { ...state.failedLogins };
        updatedFailed[lowered] = 0;

        return {
          lockedAccounts: updatedLocks,
          failedLogins: updatedFailed
        };
      }),

      terminateSession: (sessionId) => set((state) => {
        const filtered = state.sessions.filter(s => s.id !== sessionId);
        const logEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: state.user?.id,
          username: state.user?.username || state.user?.name,
          email: state.user?.email,
          role: state.user?.role,
          action: 'SESSION_TERMINATED',
          status: 'SUCCESS',
          details: `Terminated active session: ${sessionId}`,
          ...getDeviceInfo()
        };

        return {
          sessions: filtered,
          securityLogs: [logEntry, ...state.securityLogs].slice(0, 100)
        };
      }),

      terminateAllOtherSessions: () => set((state) => {
        const active = state.sessions.filter(s => s.isActive && s.id.startsWith('sess-'));
        const current = active.length > 0 ? [active[0]] : [];
        const logEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: state.user?.id,
          username: state.user?.username || state.user?.name,
          email: state.user?.email,
          role: state.user?.role,
          action: 'ALL_SESSIONS_TERMINATED',
          status: 'SUCCESS',
          details: 'Revoked all other active sessions',
          ...getDeviceInfo()
        };

        return {
          sessions: current,
          securityLogs: [logEntry, ...state.securityLogs].slice(0, 100)
        };
      }),

      // Admin Tools for Management
      adminUpdateUserRole: (userId, newRole) => set((state) => {
        const updatedUsers = state.users.map(u => u.id === userId ? { ...u, role: newRole } : u);
        const targetUser = state.users.find(u => u.id === userId);

        const logEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: state.user?.id,
          username: state.user?.username || state.user?.name,
          email: state.user?.email,
          role: state.user?.role,
          action: 'ROLE_CHANGE',
          status: 'SUCCESS',
          details: `Changed role of user ${targetUser?.email} to ${newRole}`,
          ...getDeviceInfo()
        };

        return {
          users: updatedUsers,
          securityLogs: [logEntry, ...state.securityLogs].slice(0, 100)
        };
      }),

      adminToggleUserStatus: (userId) => set((state) => {
        const targetUser = state.users.find(u => u.id === userId);
        const updatedUsers = state.users.map(u => u.id === userId ? { ...u, active: !u.active } : u);

        const logEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: state.user?.id,
          username: state.user?.username || state.user?.name,
          email: state.user?.email,
          role: state.user?.role,
          action: targetUser?.active ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
          status: 'SUCCESS',
          details: `Admin changed status of ${targetUser?.email} to ${targetUser?.active ? 'INACTIVE' : 'ACTIVE'}`,
          ...getDeviceInfo()
        };

        return {
          users: updatedUsers,
          securityLogs: [logEntry, ...state.securityLogs].slice(0, 100)
        };
      }),

      adminDeleteUser: (userId) => set((state) => {
        const targetUser = state.users.find(u => u.id === userId);
        const filtered = state.users.filter(u => u.id !== userId);

        const logEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: state.user?.id,
          username: state.user?.username || state.user?.name,
          email: state.user?.email,
          role: state.user?.role,
          action: 'USER_DELETED',
          status: 'SUCCESS',
          details: `Deleted account for: ${targetUser?.email}`,
          ...getDeviceInfo()
        };

        return {
          users: filtered,
          securityLogs: [logEntry, ...state.securityLogs].slice(0, 100)
        };
      })
    }),
    {
      name: 'auth-storage',
    }
  )
);
