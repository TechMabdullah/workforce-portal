import { z } from "zod";

export const attendanceCreateSchema = z.object({
  workerId: z.string().min(1),
  geoCoordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  locationName: z.string().min(1),
  verificationPhotoUrl: z.string().optional(),
});

export const orderCreateSchema = z.object({
  assignedWorkerId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().datetime().or(z.string().min(1)), // ISO string
  attachmentUrls: z.array(z.string()).optional().default([]),
});

export const inventoryCreateSchema = z.object({
  sku: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  quantity: z.number().int().min(0),
  unitPrice: z.number().min(0),
  category: z.string().optional().default(""),
  reorderThreshold: z.number().int().min(0).default(5),
});

export const ledgerTransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["LOAN", "REPAYMENT", "CREDIT_PURCHASE"]),
  note: z.string().max(500).optional().default(""),
});