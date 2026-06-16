import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { dataImportRouter } from "./dataImport";
import { sdk } from "./_core/sdk"; 

// Imports Drizzle propres pour l'authentification locale
import { users } from "../drizzle/schema"; 
import { eq, or } from "drizzle-orm";

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
      .mutation(async ({ input, ctx }) => {
        // 1. Gestion des comptes de démo en dur pour le développement rapide
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

        // 2. Authentification Hybride via la Base de Données
        const dbInstance = await db.getDb();
        if (!dbInstance) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "La base de données n'est pas disponible.",
          });
        }

        // CORRECTION : Recherche flexible sur 'name' ou 'username' s'il existe pour éviter le conflit
        // @ts-ignore - au cas où 'username' n'est pas encore généré dans le type Drizzle strict
        const conditions = [eq(users.name, input.username)];
        if ('username' in users) {
          // @ts-ignore
          conditions.push(eq(users.username, input.username));
        }

        const foundUsers = await dbInstance
          .select()
          .from(users)
          .where(or(...conditions))
          .limit(1);

        const dbUser = foundUsers[0];

        // 3. Validation des identifiants locaux
        if (!dbUser || dbUser.password !== input.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Identifiants invalides (Nom d'utilisateur ou mot de passe incorrect)",
          });
        }

        // 4. Génération et injection du Session Token (Alignement Express/OAuth)
        // @ts-ignore
        const userIdentifier = dbUser.openId || `local-${dbUser.id}`;
        // @ts-ignore
        const displayName = dbUser.username || dbUser.name || "Utilisateur Local";

        const sessionToken = await sdk.createSessionToken(userIdentifier, {
          name: displayName,
          expiresInMs: ONE_YEAR_MS,
        });

        // Déposer le cookie officiel de session dans Express
        if (ctx.res && ctx.req) {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { 
            ...cookieOptions, 
            maxAge: ONE_YEAR_MS 
          });
        }

        // 5. Retour des informations utilisateur formatées pour le client React
        return {
          token: sessionToken,
          user: {
            id: dbUser.id,
            // @ts-ignore
            username: dbUser.name || dbUser.username,
            role: dbUser.role, 
            pharmacyId: dbUser.pharmacyId,
          },
        };
      }),

    // Nouvelle route appelée par ton panneau Admin pour créer les comptes en DB
     register: protectedProcedure
      .input(
        z.object({
          username: z.string(),
          password: z.string(),
          role: z.enum(["pharmacist", "admin"]),
          pharmacyId: z.number().nullable(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Action réservée aux administrateurs." 
          });
        }

        // Appel de la fonction ajoutée dans ton db.ts
        await db.createLocalUser({
          username: input.username,
          password: input.password,
          role: input.role,
          pharmacyId: input.pharmacyId,
        });

        return { success: true };
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
