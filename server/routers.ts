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

    // Route d'initialisation d'urgence pour le premier admin
    initializeAdmin: publicProcedure.mutation(async () => {
      try {
        await db.createLocalUser({
          username: 'admin_ebolowa',
          password: 'ChangeMe2026!',
          role: 'admin',
          pharmacyId: null,
        });
        return { success: true, message: "Compte admin créé : admin_ebolowa / ChangeMe2026!" };
      } catch (error) {
        // Si l'utilisateur existe déjà, on renvoie quand même un succès informatif
        return { success: true, message: "Le compte admin existe déjà ou a été mis à jour." };
      }
    }),
    
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
        // 1. Authentification Hybride via la Base de Données (Comptes locaux et démo en base)

        const dbInstance = await db.getDb();
        if (!dbInstance) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "La base de données n'est pas disponible.",
          });
        }

        // Recherche flexible sur 'username' ou 'name'
        const foundUsers = await dbInstance
          .select()
          .from(users)
          .where(or(
            eq(users.username, input.username),
            eq(users.name, input.username)
          ))
          .limit(1);

        const dbUser = foundUsers[0];

        // 3. Validation des identifiants locaux
        if (!dbUser || dbUser.password !== input.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Identifiants invalides (Nom d'utilisateur ou mot de passe incorrect)",
          });
        }

        // 4. Vérifier que le compte est actif
        if (!dbUser.isActive) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Ce compte a été désactivé. Contactez l'administrateur.",
          });
        }

        // 5. Génération et injection du Session Token (Alignement Express/OAuth)
        const userIdentifier = dbUser.openId || `local-${dbUser.id}`;
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

        // 6. Retour des informations utilisateur formatées pour le client React
        return {
          token: sessionToken,
          user: {
            id: dbUser.id,
            username: dbUser.username || dbUser.name,
            role: dbUser.role, 
            pharmacyId: dbUser.pharmacyId,
          },
        };
      }),

    // Route pour créer/enregistrer un nouvel utilisateur (Admin uniquement)
    register: protectedProcedure
      .input(
        z.object({
          username: z.string().min(3, "L'identifiant doit contenir au moins 3 caractères"),
          password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
          role: z.enum(["pharmacist", "admin"]),
          pharmacyId: z.number().nullable(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Vérifier que l'utilisateur est admin
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Action réservée aux administrateurs." 
          });
        }

        try {
          // Appel de la fonction de création d'utilisateur
          await db.createLocalUser({
            username: input.username,
            password: input.password,
            role: input.role,
            pharmacyId: input.pharmacyId,
          });

          return { 
            success: true,
            message: `Le compte '${input.username}' a été créé avec succès`
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erreur lors de la création du compte";
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: errorMessage,
          });
        }
      }),

    // Route pour activer/désactiver un compte utilisateur
    toggleUserStatus: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          isActive: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Vérifier que l'utilisateur est admin
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Action réservée aux administrateurs." 
          });
        }

        try {
          await db.toggleUserActive(input.userId, input.isActive);
          return { 
            success: true,
            message: input.isActive ? "Compte activé" : "Compte désactivé"
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erreur lors de la modification du compte";
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: errorMessage,
          });
        }
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Action réservée aux administrateurs." 
        });
      }
      return db.getUsers();
    }),

    delete: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Vérifier que l'utilisateur est admin
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Action réservée aux administrateurs." 
          });
        }

        try {
          await db.deleteUser(input.userId);
          return { 
            success: true,
            message: "Utilisateur supprimé avec succès"
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression de l'utilisateur";
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: errorMessage,
          });
        }
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
