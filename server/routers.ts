import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { dataImportRouter } from "./dataImport";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input }) => {
        // Demo credentials
        if (input.username === "admin" && input.password === "admin123") {
          return {
            token: "demo-admin-token",
            user: {
              username: "admin",
              role: "admin",
              pharmacyId: null,
            },
          };
        }
        if (input.username === "pharmacist" && input.password === "pass123") {
          return {
            token: "demo-pharmacist-token",
            user: {
              username: "pharmacist",
              role: "pharmacist",
              pharmacyId: 1,
            },
          };
        }
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Identifiants invalides",
        });
      }),
  }),

  pharmacy: router({
    list: publicProcedure.query(() => db.getPharmacies()),
    getById: publicProcedure.input(z.number()).query(({ input }) => db.getPharmacyById(input)),
    setDuty: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.setDutyPharmacy(input);
        return { success: true };
      }),
  }),

  medication: router({
    list: publicProcedure.query(() => db.getMedications()),
    getById: publicProcedure.input(z.number()).query(({ input }) => db.getMedicationById(input)),
    search: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        const meds = await db.getMedications();
        const query = input.toLowerCase();
        return meds.filter(
          (m) =>
            m.name.toLowerCase().includes(query) ||
            (m.dci && m.dci.toLowerCase().includes(query))
        );
      }),
  }),

  stock: router({
    list: publicProcedure.query(() => db.getStockEntries()),
    getByMedication: publicProcedure
      .input(z.number())
      .query(({ input }) => db.getStockByMedication(input)),
    getByPharmacy: publicProcedure
      .input(z.number())
      .query(({ input }) => db.getStockByPharmacy(input)),
    update: protectedProcedure
      .input(
        z.object({
          medicationId: z.number(),
          pharmacyId: z.number(),
          status: z.enum(["available", "low_stock", "on_order", "out_of_stock"]),
          price: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin" && ctx.user?.role !== "pharmacist") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        if (ctx.user?.role === "pharmacist" && ctx.user?.pharmacyId !== input.pharmacyId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.updateStockEntry(input.medicationId, input.pharmacyId, {
          status: input.status,
          price: input.price ? input.price.toString() : undefined,
        });
        return { success: true };
      }),
  }),

  dataImport: dataImportRouter,
});

export type AppRouter = typeof appRouter;
