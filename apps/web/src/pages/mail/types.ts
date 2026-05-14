export interface MailThread {
  id: string;
  subject: string;
  participants: string[];
  patientId: string | null;
  patientName: string | null;
  lastEmailAt: string;
  unreadCount: number;
  isArchived: boolean;
  isStarred: boolean;
  snippet: string;
  lastFrom: string;
}

export interface MailAttachment {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface MailMessage {
  id: string;
  threadId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  fromAddress: string;
  fromName: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  isRead: boolean;
  sentAt: string;
  attachments: MailAttachment[];
}

export interface MailboxInfo {
  id: string;
  address: string;
  displayName: string;
}

export interface ThreadsResponse {
  mailbox: MailboxInfo;
  threads: MailThread[];
}

export interface ThreadDetailResponse {
  thread: MailThread;
  messages: MailMessage[];
}
