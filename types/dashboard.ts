export interface AdminUser {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface WebsiteUser {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_onboarded: boolean;
  grade: string | null;
  school_board: string | null;
  created_at: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  s3_url: string;
  content_type: string;
  board: string;
  standard: string;
  subject: string;
  state: string;
  ingest_status: "pending" | "queued" | "processing" | "completed" | "failed";
  celery_task_id: string | null;
  uploaded_at: string;
  ingested_at: string | null;
}
