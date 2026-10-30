import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Ticket,
  Contractor,
  CoverageArea,
  TicketMessage,
  AuditLog,
  WhatsAppTemplate,
  User,
  UIConfiguration,
  ReportDropdownCategory
} from '../types/index.ts';
import { deduplicateTicketsInMemory, getDeterministicTicketId, normalizeWoNumber } from './woDeduplicationService';

// Collection path constants
export const COLLECTIONS = {
  TICKETS: 'tickets',
  USERS: 'users',
  CONTRACTORS: 'contractors',
  COVERAGE_AREAS: 'coverage_areas',
  MESSAGES: 'ticket_messages',
  AUDIT_LOGS: 'audit_logs',
  WA_TEMPLATES: 'wa_templates',
  APP_SETTINGS: 'appSettings',
  REPORT_DROPDOWN_CATEGORIES: 'report_dropdown_categories',
  HEALTH: 'system_health'
} as const;


// -------------------------------------------------------------
// Data Sanitizer (Removes undefined fields which Firestore rejects)
// -------------------------------------------------------------
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString();

  if (Array.isArray(obj)) {
    return (obj as any[])
      .filter(item => item !== undefined)
      .map(item => {
        if (item !== null && typeof item === 'object' && !(item instanceof Date)) {
          return sanitizeForFirestore(item);
        }
        if (item instanceof Date) return item.toISOString();
        return item;
      }) as any;
  }

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    if (val instanceof Date) {
      result[key] = val.toISOString();
    } else if (val !== null && typeof val === 'object') {
      if (Array.isArray(val)) {
        result[key] = (val as any[])
          .filter(item => item !== undefined)
          .map(item => {
            if (item !== null && typeof item === 'object' && !(item instanceof Date)) {
              return sanitizeForFirestore(item);
            }
            if (item instanceof Date) return item.toISOString();
            return item;
          });
      } else {
        result[key] = sanitizeForFirestore(val);
      }
    } else {
      result[key] = val;
    }
  }
  return result;
}

// -------------------------------------------------------------
// Real-time Subscriptions (onSnapshot)
// -------------------------------------------------------------
export interface FirestoreSubscriptionCallbacks {
  onTicketsChange?: (tickets: Ticket[]) => void;
  onContractorsChange?: (contractors: Contractor[]) => void;
  onCoverageAreasChange?: (areas: CoverageArea[]) => void;
  onMessagesChange?: (messages: TicketMessage[]) => void;
  onAuditLogsChange?: (logs: AuditLog[]) => void;
  onTemplatesChange?: (templates: WhatsAppTemplate[]) => void;
  onUsersChange?: (users: User[]) => void;
  onReportDropdownCategoriesChange?: (categories: ReportDropdownCategory[]) => void;
  onError?: (error: Error) => void;
}

export function subscribeToMoraJawsFirestore(callbacks: FirestoreSubscriptionCallbacks): () => void {
  const unsubs: Unsubscribe[] = [];

  // 1. Tickets Real-Time Listener
  if (callbacks.onTicketsChange) {
    try {
      const ticketsRef = collection(db, COLLECTIONS.TICKETS);
      const unsub = onSnapshot(
        ticketsRef,
        (snapshot) => {
          const rawTickets: Ticket[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Ticket;
            if (!data.id) data.id = docSnap.id;
            rawTickets.push(data);
          });
          const deduplicated = deduplicateTicketsInMemory(rawTickets);
          callbacks.onTicketsChange?.(deduplicated);
        },
        (error) => {
          console.warn('[Firestore] Tickets subscription warning:', error);
          try {
            handleFirestoreError(error, OperationType.LIST, COLLECTIONS.TICKETS);
          } catch (e: any) {
            callbacks.onError?.(e);
          }
        }
      );
      unsubs.push(unsub);
    } catch (err: any) {
      console.warn('[Firestore] Failed attaching tickets listener:', err);
    }
  }

  // 2. Contractors Real-Time Listener
  if (callbacks.onContractorsChange) {
    try {
      const contrRef = collection(db, COLLECTIONS.CONTRACTORS);
      const unsub = onSnapshot(
        contrRef,
        (snapshot) => {
          const contractors: Contractor[] = [];
          snapshot.forEach((docSnap) => {
            contractors.push(docSnap.data() as Contractor);
          });
          callbacks.onContractorsChange?.(contractors);
        },
        (error) => {
          console.warn('[Firestore] Contractors subscription warning:', error);
          try {
            handleFirestoreError(error, OperationType.LIST, COLLECTIONS.CONTRACTORS);
          } catch (e: any) {
            callbacks.onError?.(e);
          }
        }
      );
      unsubs.push(unsub);
    } catch (err: any) {
      console.warn('[Firestore] Failed attaching contractors listener:', err);
    }
  }

  // 3. Coverage Areas Real-Time Listener
  if (callbacks.onCoverageAreasChange) {
    try {
      const areasRef = collection(db, COLLECTIONS.COVERAGE_AREAS);
      const unsub = onSnapshot(
        areasRef,
        (snapshot) => {
          const areas: CoverageArea[] = [];
          snapshot.forEach((docSnap) => {
            areas.push(docSnap.data() as CoverageArea);
          });
          callbacks.onCoverageAreasChange?.(areas);
        },
        (error) => {
          console.warn('[Firestore] Areas subscription warning:', error);
          try {
            handleFirestoreError(error, OperationType.LIST, COLLECTIONS.COVERAGE_AREAS);
          } catch (e: any) {
            callbacks.onError?.(e);
          }
        }
      );
      unsubs.push(unsub);
    } catch (err: any) {
      console.warn('[Firestore] Failed attaching areas listener:', err);
    }
  }

  // 4. Ticket Messages (Live Chat) Real-Time Listener
  if (callbacks.onMessagesChange) {
    try {
      const msgRef = collection(db, COLLECTIONS.MESSAGES);
      const unsub = onSnapshot(
        msgRef,
        (snapshot) => {
          const messages: TicketMessage[] = [];
          snapshot.forEach((docSnap) => {
            messages.push(docSnap.data() as TicketMessage);
          });
          callbacks.onMessagesChange?.(messages);
        },
        (error) => {
          console.warn('[Firestore] Messages subscription warning:', error);
          try {
            handleFirestoreError(error, OperationType.LIST, COLLECTIONS.MESSAGES);
          } catch (e: any) {
            callbacks.onError?.(e);
          }
        }
      );
      unsubs.push(unsub);
    } catch (err: any) {
      console.warn('[Firestore] Failed attaching messages listener:', err);
    }
  }

  // 5. Audit Logs Real-Time Listener
  if (callbacks.onAuditLogsChange) {
    try {
      const auditRef = collection(db, COLLECTIONS.AUDIT_LOGS);
      const auditQuery = query(auditRef, orderBy('timestamp', 'desc'), limit(150));
      const unsub = onSnapshot(
        auditQuery,
        (snapshot) => {
          const logs: AuditLog[] = [];
          snapshot.forEach((docSnap) => {
            logs.push(docSnap.data() as AuditLog);
          });
          callbacks.onAuditLogsChange?.(logs);
        },
        (error) => {
          console.warn('[Firestore] Audit logs subscription warning:', error);
          try {
            handleFirestoreError(error, OperationType.LIST, COLLECTIONS.AUDIT_LOGS);
          } catch (e: any) {
            callbacks.onError?.(e);
          }
        }
      );
      unsubs.push(unsub);
    } catch (err: any) {
      console.warn('[Firestore] Failed attaching audit logs listener:', err);
    }
  }

  // 6. WhatsApp Templates Real-Time Listener
  if (callbacks.onTemplatesChange) {
    try {
      const tplRef = collection(db, COLLECTIONS.WA_TEMPLATES);
      const unsub = onSnapshot(
        tplRef,
        (snapshot) => {
          const tpls: WhatsAppTemplate[] = [];
          snapshot.forEach((docSnap) => {
            tpls.push(docSnap.data() as WhatsAppTemplate);
          });
          callbacks.onTemplatesChange?.(tpls);
        },
        (error) => {
          console.warn('[Firestore] Templates subscription warning:', error);
          try {
            handleFirestoreError(error, OperationType.LIST, COLLECTIONS.WA_TEMPLATES);
          } catch (e: any) {
            callbacks.onError?.(e);
          }
        }
      );
      unsubs.push(unsub);
    } catch (err: any) {
      console.warn('[Firestore] Failed attaching templates listener:', err);
    }
  }

  // 7. Users Real-Time Listener
  if (callbacks.onUsersChange) {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const unsub = onSnapshot(
        usersRef,
        (snapshot) => {
          const users: User[] = [];
          snapshot.forEach((docSnap) => {
            users.push(docSnap.data() as User);
          });
          callbacks.onUsersChange?.(users);
        },
        (error) => {
          console.warn('[Firestore] Users subscription warning:', error);
          try {
            handleFirestoreError(error, OperationType.LIST, COLLECTIONS.USERS);
          } catch (e: any) {
            callbacks.onError?.(e);
          }
        }
      );
      unsubs.push(unsub);
    } catch (err: any) {
      console.warn('[Firestore] Failed attaching users listener:', err);
    }
  }

  // 8. Report Dropdown Categories Real-Time Listener (stored in appSettings/report_dropdown_categories)
  if (callbacks.onReportDropdownCategoriesChange) {
    try {
      const dropDocRef = doc(db, COLLECTIONS.APP_SETTINGS, 'report_dropdown_categories');
      const unsub = onSnapshot(
        dropDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const cats = Array.isArray(data?.categories) ? (data.categories as ReportDropdownCategory[]) : [];
            if (cats.length > 0) {
              cats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
              callbacks.onReportDropdownCategoriesChange?.(cats);
              return;
            }
          }
          // Default baseline categories if not yet stored
          callbacks.onReportDropdownCategoriesChange?.(INITIAL_REPORT_DROPDOWN_CATEGORIES);
        },
        (error) => {
          console.warn('[Firestore] Report dropdown categories subscription notice:', error?.message || error);
          callbacks.onReportDropdownCategoriesChange?.(INITIAL_REPORT_DROPDOWN_CATEGORIES);
        }
      );
      unsubs.push(unsub);
    } catch (err: any) {
      console.warn('[Firestore] Failed attaching report dropdown categories listener:', err);
      callbacks.onReportDropdownCategoriesChange?.(INITIAL_REPORT_DROPDOWN_CATEGORIES);
    }
  }


  // Return master cleanup function
  return () => {
    unsubs.forEach(unsub => unsub());
  };
}

// -------------------------------------------------------------
// Ticket Mutations (Confirmed Writes)
// -------------------------------------------------------------
export async function saveTicketToFirestore(ticket: Ticket): Promise<void> {
  const targetId = ticket.id || getDeterministicTicketId(ticket.woNumber);
  const path = `${COLLECTIONS.TICKETS}/${targetId}`;
  try {
    const docRef = doc(db, COLLECTIONS.TICKETS, targetId);
    const sanitized = sanitizeForFirestore({ ...ticket, id: targetId });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function batchSaveTicketsToFirestore(tickets: Ticket[]): Promise<{ saved: number; failed: number }> {
  if (tickets.length === 0) return { saved: 0, failed: 0 };
  let saved = 0;
  let failed = 0;

  // Deduplicate before saving to avoid duplicate keys in the same batch
  const uniqueTickets = deduplicateTicketsInMemory(tickets);

  // Process in batches of 450 (Firestore limit is 500 per batch)
  const chunkSize = 450;
  for (let i = 0; i < uniqueTickets.length; i += chunkSize) {
    const chunk = uniqueTickets.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const t of chunk) {
      const targetId = t.id || getDeterministicTicketId(t.woNumber);
      const docRef = doc(db, COLLECTIONS.TICKETS, targetId);
      batch.set(docRef, sanitizeForFirestore({ ...t, id: targetId }), { merge: true });
    }

    try {
      await batch.commit();
      saved += chunk.length;
    } catch (err) {
      console.error('[Firestore] Batch commit failed, falling back to individual writes:', err);
      for (const t of chunk) {
        try {
          await saveTicketToFirestore(t);
          saved++;
        } catch {
          failed++;
        }
      }
    }
  }

  if (saved === 0 && failed > 0) {
    throw new Error(`Semua ${failed} tiket gagal disimpan ke Cloud Firestore.`);
  }

  return { saved, failed };
}

// -------------------------------------------------------------
// Global App Configuration & User Preferences (Permanent Storage)
// -------------------------------------------------------------
export async function saveGlobalAppSettingsToFirestore(settings: Record<string, any>): Promise<void> {
  const path = `${COLLECTIONS.APP_SETTINGS}/global`;
  try {
    const docRef = doc(db, COLLECTIONS.APP_SETTINGS, 'global');
    await setDoc(docRef, {
      ...sanitizeForFirestore(settings),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadGlobalAppSettingsFromFirestore(): Promise<Record<string, any> | null> {
  const path = `${COLLECTIONS.APP_SETTINGS}/global`;
  try {
    const docRef = doc(db, COLLECTIONS.APP_SETTINGS, 'global');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserPreferencesToFirestore(userId: string, preferences: Record<string, any>): Promise<void> {
  const path = `users/${userId}/preferences/settings`;
  try {
    const docRef = doc(db, 'users', userId, 'preferences', 'settings');
    await setDoc(docRef, {
      ...sanitizeForFirestore(preferences),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadUserPreferencesFromFirestore(userId: string): Promise<Record<string, any> | null> {
  const path = `users/${userId}/preferences/settings`;
  try {
    const docRef = doc(db, 'users', userId, 'preferences', 'settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// -------------------------------------------------------------
// UI Builder & Database Application Configuration (Firestore)
// -------------------------------------------------------------
export interface CloudUIConfigurationPayload {
  id?: string;
  config: UIConfiguration;
  navigationItems: any[];
  menuCategories: string[];
  updatedAt: string;
  updatedBy: string;
  app?: string;
  type?: string;
  version?: number;
}

export async function saveUIConfigurationToFirestore(payload: {
  config: UIConfiguration;
  navigationItems: any[];
  menuCategories: string[];
  updatedBy?: string;
}): Promise<{ success: boolean; updatedAt: string }> {
  const path = `${COLLECTIONS.APP_SETTINGS}/ui_configuration`;
  try {
    const docRef = doc(db, COLLECTIONS.APP_SETTINGS, 'ui_configuration');
    const updatedAt = new Date().toISOString();
    const dataToSave = sanitizeForFirestore({
      id: 'ui_configuration',
      config: payload.config,
      navigationItems: payload.navigationItems,
      menuCategories: payload.menuCategories,
      updatedAt,
      updatedBy: payload.updatedBy || 'Super Admin',
      app: 'MoraJaws',
      type: 'database_configuration_app',
      version: Date.now()
    });
    await setDoc(docRef, dataToSave, { merge: true });

    // Also mirror to global for backwards compatibility & root-level navigationSettings access
    try {
      const globalDoc = doc(db, COLLECTIONS.APP_SETTINGS, 'global');
      await setDoc(globalDoc, {
        uiConfig: payload.config,
        navigationItems: payload.navigationItems,
        menuCategories: payload.menuCategories,
        navigationSettings: payload.config?.navigationSettings || null,
        updatedAt,
        updatedBy: payload.updatedBy || 'Super Admin'
      }, { merge: true });
    } catch {}

    return { success: true, updatedAt };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function loadUIConfigurationFromFirestore(): Promise<CloudUIConfigurationPayload | null> {
  const path = `${COLLECTIONS.APP_SETTINGS}/ui_configuration`;
  try {
    const docRef = doc(db, COLLECTIONS.APP_SETTINGS, 'ui_configuration');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as CloudUIConfigurationPayload;
      return data;
    }
    // Fallback to global
    const globalRef = doc(db, COLLECTIONS.APP_SETTINGS, 'global');
    const gSnap = await getDoc(globalRef);
    if (gSnap.exists()) {
      const gData = gSnap.data();
      if (gData.uiConfig || gData.navigationItems) {
        const loadedConfig = gData.uiConfig || {};
        if (gData.navigationSettings && !loadedConfig.navigationSettings) {
          loadedConfig.navigationSettings = gData.navigationSettings;
        }
        return {
          config: loadedConfig,
          navigationItems: gData.navigationItems,
          menuCategories: gData.menuCategories || [],
          updatedAt: gData.updatedAt || new Date().toISOString(),
          updatedBy: gData.updatedBy || 'System'
        };
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function subscribeToUIConfiguration(callback: (data: CloudUIConfigurationPayload) => void): Unsubscribe {
  const docRef = doc(db, COLLECTIONS.APP_SETTINGS, 'ui_configuration');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as CloudUIConfigurationPayload);
    }
  }, (err) => {
    console.warn('[Firestore] UI Configuration subscription warning:', err);
  });
}

export async function deleteTicketFromFirestore(ticketId: string, woNumber?: string): Promise<void> {
  const path = `${COLLECTIONS.TICKETS}/${ticketId}`;
  try {
    const docRef = doc(db, COLLECTIONS.TICKETS, ticketId);
    await deleteDoc(docRef);

    // Also remove by deterministic ID if different to prevent any resurrection
    if (woNumber) {
      const detId = getDeterministicTicketId(woNumber);
      if (detId !== ticketId) {
        try {
          const detRef = doc(db, COLLECTIONS.TICKETS, detId);
          await deleteDoc(detRef);
        } catch {}
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function softDeleteTicketInFirestore(ticketId: string, deletedBy: string, reason: string): Promise<void> {
  const path = `${COLLECTIONS.TICKETS}/${ticketId}`;
  try {
    const docRef = doc(db, COLLECTIONS.TICKETS, ticketId);
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy,
      deletionReason: reason,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// Contractor & Coverage Area Mutations
// -------------------------------------------------------------
export async function saveContractorToFirestore(contractor: Contractor): Promise<void> {
  const path = `${COLLECTIONS.CONTRACTORS}/${contractor.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.CONTRACTORS, contractor.id);
    await setDoc(docRef, sanitizeForFirestore(contractor), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveCoverageAreaToFirestore(area: CoverageArea): Promise<void> {
  const path = `${COLLECTIONS.COVERAGE_AREAS}/${area.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.COVERAGE_AREAS, area.id);
    await setDoc(docRef, sanitizeForFirestore(area), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Live Chat Message Mutations
// -------------------------------------------------------------
export async function sendChatMessageToFirestore(msg: TicketMessage): Promise<void> {
  const path = `${COLLECTIONS.MESSAGES}/${msg.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.MESSAGES, msg.id);
    await setDoc(docRef, sanitizeForFirestore(msg));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// -------------------------------------------------------------
// Audit Log Mutations (Immutable Append)
// -------------------------------------------------------------
export async function addAuditLogToFirestore(log: AuditLog): Promise<void> {
  const path = `${COLLECTIONS.AUDIT_LOGS}/${log.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.AUDIT_LOGS, log.id);
    await setDoc(docRef, sanitizeForFirestore(log));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// -------------------------------------------------------------
// WhatsApp Template Mutations
// -------------------------------------------------------------
export async function saveTemplateToFirestore(template: WhatsAppTemplate): Promise<void> {
  const path = `${COLLECTIONS.WA_TEMPLATES}/${template.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.WA_TEMPLATES, template.id);
    await setDoc(docRef, sanitizeForFirestore(template), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTemplateFromFirestore(templateId: string): Promise<void> {
  const path = `${COLLECTIONS.WA_TEMPLATES}/${templateId}`;
  try {
    const docRef = doc(db, COLLECTIONS.WA_TEMPLATES, templateId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// User Profile Mutations (Passwords are NEVER stored in Firestore)
// -------------------------------------------------------------
export async function saveUserToFirestore(user: User): Promise<void> {
  const path = `${COLLECTIONS.USERS}/${user.id}`;
  try {
    // Strip sensitive authentication secrets per MoraJaws Security Policy
    const { passwordHash: _, ...safeUser } = user;
    if ('password' in (safeUser as any)) {
      delete (safeUser as any).password;
    }
    const docRef = doc(db, COLLECTIONS.USERS, user.id);
    await setDoc(docRef, sanitizeForFirestore(safeUser), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Report Dropdown Category Mutations (Report Status, Reason Report, Rootcause)
// -------------------------------------------------------------
export const INITIAL_REPORT_DROPDOWN_CATEGORIES: ReportDropdownCategory[] = [
  // 1. Report Status
  { id: 'rdc-st-1', categoryType: 'report_status', name: 'En Route', description: 'Teknisi dalam perjalanan menuju lokasi pelanggan', isActive: true, sortOrder: 1, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-st-2', categoryType: 'report_status', name: 'On Site', description: 'Teknisi tiba di lokasi pelanggan dan memulai pemeriksaan', isActive: true, sortOrder: 2, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-st-3', categoryType: 'report_status', name: 'Completed', description: 'Pekerjaan selesai dilakukan dan layanan aktif normal', isActive: true, sortOrder: 3, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-st-4', categoryType: 'report_status', name: 'Installed', description: 'Perangkat baru berhasil terpasang dan terkonfigurasi', isActive: true, sortOrder: 4, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-st-5', categoryType: 'report_status', name: 'Pending Technical', description: 'Pekerjaan tertunda karena kendala teknis atau redaman', isActive: true, sortOrder: 5, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-st-6', categoryType: 'report_status', name: 'Failed / Cancelled', description: 'Pekerjaan gagal atau dibatalkan oleh pelanggan', isActive: true, sortOrder: 6, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-st-7', categoryType: 'report_status', name: 'Assigned', description: 'Work Order telah ditugaskan kepada teknisi', isActive: true, sortOrder: 7, createdAt: '2026-01-01T00:00:00Z' },

  // 2. Reason Report
  { id: 'rdc-rs-1', categoryType: 'reason_report', name: 'Instalasi Selesai Sesuai Standar', description: 'Instalasi FTTH berhasil dengan uji coba internet lancar', isActive: true, sortOrder: 1, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rs-2', categoryType: 'reason_report', name: 'Redaman Optik Baik (-16 s/d -24 dBm)', description: 'Hasil ukur OPM memenuhi standar spesifikasi', isActive: true, sortOrder: 2, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rs-3', categoryType: 'reason_report', name: 'Perangkat ONT / Router Aktif Normal', description: 'Konfigurasi PPPoE dan WiFi beroperasi tanpa kendala', isActive: true, sortOrder: 3, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rs-4', categoryType: 'reason_report', name: 'Selesai Berhasil Diperbaiki', description: 'Troubleshoot gangguan berhasil dan koneksi pulih', isActive: true, sortOrder: 4, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rs-5', categoryType: 'reason_report', name: 'Kendala Redaman Tinggi / LOS', description: 'Redaman melebihi batas atau lampu indikator LOS merah', isActive: true, sortOrder: 5, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rs-6', categoryType: 'reason_report', name: 'Kabel Dropcore Putus / Terjepit', description: 'Kerusakan fisik kabel pada jalur tiang atau jalur indoor', isActive: true, sortOrder: 6, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rs-7', categoryType: 'reason_report', name: 'FAT / ODP Penuh atau Rusak', description: 'Port splitter pada FAT terisi penuh atau konektor rusak', isActive: true, sortOrder: 7, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rs-8', categoryType: 'reason_report', name: 'Pelanggan Meminta Reschedule', description: 'Pelanggan meminta penundaan jadwal ke hari lain', isActive: true, sortOrder: 8, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rs-9', categoryType: 'reason_report', name: 'Pelanggan Tidak di Tempat', description: 'Rumah kosong atau tidak ada perwakilan yang menerima', isActive: true, sortOrder: 9, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rs-10', categoryType: 'reason_report', name: 'Akses Rumah / Lokasi Terkendala', description: 'Izin komplek, portal ditutup, atau cuaca ekstrem', isActive: true, sortOrder: 10, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rs-11', categoryType: 'reason_report', name: 'Menunggu Material / Tim Tambahan', description: 'Kekurangan kabel panjang atau butuh tangga tinggi', isActive: true, sortOrder: 11, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rs-12', categoryType: 'reason_report', name: 'Pengerjaan Lapangan Sedang Berlangsung', description: 'Teknisi masih berada di titik tiang / rumah pelanggan', isActive: true, sortOrder: 12, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rs-13', categoryType: 'reason_report', name: 'Lainnya (Lihat Catatan Remarks)', description: 'Penyebab khusus yang dijelaskan pada catatan teknisi', isActive: true, sortOrder: 13, createdAt: '2026-01-01T00:00:00Z' },

  // 3. Rootcause
  { id: 'rdc-rc-1', categoryType: 'rootcause', name: 'Fiber Optic Putus', description: 'Kabel optik putus terkena pohon, truk, atau gesekan', isActive: true, sortOrder: 1, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rc-2', categoryType: 'rootcause', name: 'Redaman Tinggi / Macro Bend', description: 'Bending kabel terlalu tajam menyebabkan loss sinyal optik', isActive: true, sortOrder: 2, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rc-3', categoryType: 'rootcause', name: 'Konektor SC/UPC Rusak atau Kotor', description: 'Ujung ferrule konektor berdebu atau retak', isActive: true, sortOrder: 3, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rc-4', categoryType: 'rootcause', name: 'FAT / ODP Rusak', description: 'Adapter atau pigtail di dalam enclosure FAT bermasalah', isActive: true, sortOrder: 4, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rc-5', categoryType: 'rootcause', name: 'Port FAT Penuh', description: 'Semua port out splitter sudah terisi pelanggan lain', isActive: true, sortOrder: 5, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rc-6', categoryType: 'rootcause', name: 'ONT / Router Rusak', description: 'Perangkat pelanggan mati total, port LAN mati, atau loop', isActive: true, sortOrder: 6, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rc-7', categoryType: 'rootcause', name: 'Adaptor Daya Mati', description: 'Power supply adaptor 12V ONT terbakar / rusak', isActive: true, sortOrder: 7, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rc-8', categoryType: 'rootcause', name: 'Konfigurasi VLAN / PPPoE Error', description: 'Setting username login atau VLAN ID tidak cocok di OLT', isActive: true, sortOrder: 8, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'rdc-rc-9', categoryType: 'rootcause', name: 'Kendala Teknis Lapangan Lainnya', description: 'Masalah unik di lapangan yang memerlukan investigasi lanjut', isActive: true, sortOrder: 9, createdAt: '2026-01-01T00:00:00Z' }
];

export async function saveAllReportDropdownCategoriesToFirestore(categories: ReportDropdownCategory[]): Promise<void> {
  const path = `${COLLECTIONS.APP_SETTINGS}/report_dropdown_categories`;
  try {
    const docRef = doc(db, COLLECTIONS.APP_SETTINGS, 'report_dropdown_categories');
    await setDoc(docRef, {
      id: 'report_dropdown_categories',
      categories: sanitizeForFirestore(categories),
      updatedAt: new Date().toISOString(),
      updatedBy: 'System'
    }, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Error saving report dropdown categories to appSettings:', error);
  }
}

export async function saveReportDropdownCategoryToFirestore(category: ReportDropdownCategory): Promise<void> {
  const path = `${COLLECTIONS.APP_SETTINGS}/report_dropdown_categories`;
  try {
    const docRef = doc(db, COLLECTIONS.APP_SETTINGS, 'report_dropdown_categories');
    const snap = await getDoc(docRef);
    let categories: ReportDropdownCategory[] = [];
    if (snap.exists() && Array.isArray(snap.data()?.categories)) {
      categories = [...snap.data().categories];
    } else {
      categories = [...INITIAL_REPORT_DROPDOWN_CATEGORIES];
    }
    const idx = categories.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      categories[idx] = category;
    } else {
      categories.push(category);
    }
    await setDoc(docRef, {
      id: 'report_dropdown_categories',
      categories: sanitizeForFirestore(categories),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Error saving single report category:', error);
  }
}

export async function deleteReportDropdownCategoryFromFirestore(categoryId: string): Promise<void> {
  const path = `${COLLECTIONS.APP_SETTINGS}/report_dropdown_categories`;
  try {
    const docRef = doc(db, COLLECTIONS.APP_SETTINGS, 'report_dropdown_categories');
    const snap = await getDoc(docRef);
    if (snap.exists() && Array.isArray(snap.data()?.categories)) {
      const categories = snap.data().categories.filter((c: any) => c.id !== categoryId);
      await setDoc(docRef, {
        categories: sanitizeForFirestore(categories),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    console.warn('[Firestore] Error deleting report category:', error);
  }
}

export async function softDeleteReportDropdownCategoryInFirestore(categoryId: string, updatedBy?: string): Promise<void> {
  const path = `${COLLECTIONS.APP_SETTINGS}/report_dropdown_categories`;
  try {
    const docRef = doc(db, COLLECTIONS.APP_SETTINGS, 'report_dropdown_categories');
    const snap = await getDoc(docRef);
    if (snap.exists() && Array.isArray(snap.data()?.categories)) {
      const categories = snap.data().categories.map((c: any) => {
        if (c.id === categoryId) {
          return {
            ...c,
            isActive: false,
            isDeleted: true,
            updatedAt: new Date().toISOString(),
            updatedBy: updatedBy || 'System'
          };
        }
        return c;
      });
      await setDoc(docRef, {
        categories: sanitizeForFirestore(categories),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    console.warn('[Firestore] Error soft-deleting report category:', error);
  }
}

export async function seedReportDropdownCategoriesIfEmpty(): Promise<number> {
  try {
    const docRef = doc(db, COLLECTIONS.APP_SETTINGS, 'report_dropdown_categories');
    const snap = await getDoc(docRef);
    if (!snap.exists() || !snap.data()?.categories || snap.data()?.categories.length === 0) {
      console.log(`[Firestore] Seeding ${INITIAL_REPORT_DROPDOWN_CATEGORIES.length} report dropdown categories to appSettings...`);
      await setDoc(docRef, {
        id: 'report_dropdown_categories',
        categories: sanitizeForFirestore(INITIAL_REPORT_DROPDOWN_CATEGORIES),
        updatedAt: new Date().toISOString(),
        updatedBy: 'System'
      }, { merge: true });
      return INITIAL_REPORT_DROPDOWN_CATEGORIES.length;
    }
    return snap.data()?.categories?.length || 0;
  } catch (err) {
    console.warn('[Firestore] Seed report categories error:', err);
    return 0;
  }
}


// -------------------------------------------------------------
// Seed and Migration Helper
// -------------------------------------------------------------
export async function seedFirestoreIfEmpty(initialData: {
  tickets: Ticket[];
  contractors: Contractor[];
  coverageAreas: CoverageArea[];
  templates: WhatsAppTemplate[];
  users: User[];
}): Promise<{ seeded: boolean; counts: Record<string, number> }> {
  try {
    const ticketsSnap = await getDocs(collection(db, COLLECTIONS.TICKETS));
    const counts: Record<string, number> = {
      tickets: ticketsSnap.size,
      contractors: 0,
      coverageAreas: 0,
      templates: 0,
      users: 0
    };

    // If Firestore has no tickets yet, seed baseline tickets
    if (ticketsSnap.empty && initialData.tickets.length > 0) {
      console.log(`[Firestore] Seeding ${initialData.tickets.length} baseline tickets to Cloud Firestore...`);
      const { saved } = await batchSaveTicketsToFirestore(initialData.tickets);
      counts.tickets = saved;
    }

    // Check & seed contractors
    const contrSnap = await getDocs(collection(db, COLLECTIONS.CONTRACTORS));
    counts.contractors = contrSnap.size;
    if (contrSnap.empty && initialData.contractors.length > 0) {
      console.log(`[Firestore] Seeding ${initialData.contractors.length} contractors to Cloud Firestore...`);
      for (const c of initialData.contractors) {
        await saveContractorToFirestore(c);
      }
      counts.contractors = initialData.contractors.length;
    }

    // Check & seed coverage areas
    const areasSnap = await getDocs(collection(db, COLLECTIONS.COVERAGE_AREAS));
    counts.coverageAreas = areasSnap.size;
    if (areasSnap.empty && initialData.coverageAreas.length > 0) {
      for (const a of initialData.coverageAreas) {
        await saveCoverageAreaToFirestore(a);
      }
      counts.coverageAreas = initialData.coverageAreas.length;
    }

    // Check & seed templates
    const tplSnap = await getDocs(collection(db, COLLECTIONS.WA_TEMPLATES));
    counts.templates = tplSnap.size;
    if (tplSnap.empty && initialData.templates.length > 0) {
      for (const t of initialData.templates) {
        await saveTemplateToFirestore(t);
      }
      counts.templates = initialData.templates.length;
    }

    // Check & seed users
    const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    counts.users = usersSnap.size;
    if (usersSnap.empty && initialData.users.length > 0) {
      for (const u of initialData.users) {
        await saveUserToFirestore(u);
      }
      counts.users = initialData.users.length;
    }

    return { seeded: true, counts };
  } catch (err) {
    console.warn('[Firestore] Seed verification error:', err);
    return { seeded: false, counts: {} };
  }
}

export async function fetchAllTicketsFromFirestore(): Promise<Ticket[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.TICKETS));
    const raw: Ticket[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Ticket;
      if (!data.id) data.id = docSnap.id;
      raw.push(data);
    });
    return deduplicateTicketsInMemory(raw);
  } catch (err) {
    console.error('[Firestore] fetchAllTicketsFromFirestore failed:', err);
    throw err;
  }
}
