import { getStore, mutate } from "./db";
import type { Mastery, Role, StudentProfile, Store, User } from "./types";

/** Thin read helpers over the store. Feature code should prefer these over touching the store directly. */

export function getUserById(id: string): User | undefined {
  return getStore().users.find((u) => u.id === id);
}

export function getStudentProfile(studentId: string): StudentProfile | undefined {
  return getStore().studentProfiles.find((p) => p.studentId === studentId);
}

export function listDemoAccounts(): User[] {
  return getStore().users.filter((u) => u.demo);
}

export function listUsersByRole(role: Role): User[] {
  return getStore().users.filter((u) => u.role === role);
}

export interface AuthenticatedAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/**
 * Add a verified Supabase account to AURA's existing learning store on first sign-in.
 * The curriculum, mastery engine and demo data remain deliberately local to this prototype;
 * this only gives a real account its own blank, ready-to-learn state.
 */
export function ensureAccountInStore(store: Store, account: AuthenticatedAccount): User {
  let user = store.users.find((candidate) => candidate.id === account.id);
  if (!user) {
    user = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      ...(account.role === "student" ? { grade: 9 } : {}),
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
  } else if (!user.demo) {
    // A role is set when the account is first provisioned and never changed from browser metadata.
    user.name = account.name;
    user.email = account.email;
  }

  if (account.role === "student") {
    if (!store.studentProfiles.some((profile) => profile.studentId === account.id)) {
      const profile: StudentProfile = {
        studentId: account.id,
        onboarded: false,
        learningPace: 70,
        confidence: 70,
        engagement: 70,
        interests: [],
        classId: "self-guided",
      };
      store.studentProfiles.push(profile);
    }
    for (const topic of store.topics) {
      if (!store.mastery.some((row) => row.studentId === account.id && row.topicId === topic.id)) {
        const row: Mastery = {
          studentId: account.id,
          topicId: topic.id,
          score: 0,
          attempts: 0,
          accuracy: 0,
          lastActivity: null,
          level: 1,
          levelChangedAt: new Date().toISOString(),
        };
        store.mastery.push(row);
      }
    }
  }
  return user;
}

/** Persist a verified external account before entering the role-protected AURA experience. */
export function ensureAuthenticatedAccount(account: AuthenticatedAccount): User {
  return mutate((store) => ensureAccountInStore(store, account));
}
