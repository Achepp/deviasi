export type UserRole = "Admin" | "Operator";
export type UserStatus = "Aktif" | "Nonaktif";
export type ProductStatus = "Aktif" | "Nonaktif";

export interface User {
  user_id: string;
  nama: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  password_hash?: string;
}

export interface MasterProduk {
  batch: string;
  nama_produk: string;
  status: ProductStatus;
  keterangan: string;
}

export interface HasilTimbangan {
  id: string;
  operator_id: string;
  operator: string;
  nama_produk: string;
  batch: string;
  no_mesin: string;
  no_timbangan: string;
  metode_kemas: string;
  lower: number;
  upper: number;
  jam: string; // ISO / Asia/Jakarta formatted
  timbang_1?: number | null;
  timbang_2?: number | null;
  timbang_3?: number | null;
  timbang_4?: number | null;
  timbang_5?: number | null;
  timbang_6?: number | null;
  timbang_7?: number | null;
  timbang_8?: number | null;
  timbang_9?: number | null;
  timbang_10?: number | null;
  timbang_11?: number | null;
  timbang_12?: number | null;
  timbang_13?: number | null;
  timbang_14?: number | null;
  timbang_15?: number | null;
}

export interface WeighingCalculation {
  count: number;
  average: number;
  min: number;
  max: number;
  inRangeCount: number;
  outRangeCount: number;
  values: {
    index: number;
    value: number;
    inRange: boolean;
  }[];
}

export interface DashboardStats {
  totalSessions: number;
  totalMeasurements: number;
  totalBatches: number;
  inRangeMeasurements: number;
  outRangeMeasurements: number;
  complianceRate: number; // percentage
}

export interface AuthSession {
  userId: string;
  nama: string;
  email: string;
  role: UserRole;
}
