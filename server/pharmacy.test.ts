import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getPharmacies: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        name: "Pharmacie Test",
        address: "123 Rue Test",
        phone: "+237 690 123 456",
        email: "test@pharmacy.com",
        openingHours: JSON.stringify({ open: "08:00", close: "20:00" }),
        mapLink: "https://maps.google.com",
        isOnDuty: false,
      },
    ])
  ),
  getPharmacyById: vi.fn((id: number) =>
    Promise.resolve({
      id,
      name: "Pharmacie Test",
      address: "123 Rue Test",
      phone: "+237 690 123 456",
      email: "test@pharmacy.com",
      openingHours: JSON.stringify({ open: "08:00", close: "20:00" }),
      mapLink: "https://maps.google.com",
      isOnDuty: false,
    })
  ),
  setDutyPharmacy: vi.fn(() => Promise.resolve()),
  getMedications: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        name: "Paracétamol 500mg",
        dci: "Paracétamol",
        therapeuticCategory: "Analgésique",
        dosage: "500mg",
      },
    ])
  ),
  getMedicationById: vi.fn((id: number) =>
    Promise.resolve({
      id,
      name: "Paracétamol 500mg",
      dci: "Paracétamol",
      therapeuticCategory: "Analgésique",
      dosage: "500mg",
    })
  ),
  getStockEntries: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        medicationId: 1,
        pharmacyId: 1,
        status: "available",
        price: "1000",
      },
    ])
  ),
  getStockByMedication: vi.fn((id: number) =>
    Promise.resolve([
      {
        id: 1,
        medicationId: id,
        pharmacyId: 1,
        status: "available",
        price: "1000",
      },
    ])
  ),
  getStockByPharmacy: vi.fn((id: number) =>
    Promise.resolve([
      {
        id: 1,
        medicationId: 1,
        pharmacyId: id,
        status: "available",
        price: "1000",
      },
    ])
  ),
  updateStockEntry: vi.fn(() => Promise.resolve()),
}));

function createMockContext(user?: any): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("Pharmacy Router", () => {
  it("should list all pharmacies", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.pharmacy.list();

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Pharmacie Test");
  });

  it("should get pharmacy by id", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.pharmacy.getById(1);

    expect(result?.id).toBe(1);
    expect(result?.name).toBe("Pharmacie Test");
  });

  it("should set duty pharmacy as admin", async () => {
    const adminUser = {
      id: 1,
      openId: "admin",
      name: "Admin",
      email: "admin@test.com",
      role: "admin",
    };
    const caller = appRouter.createCaller(createMockContext(adminUser));
    const result = await caller.pharmacy.setDuty(1);

    expect(result.success).toBe(true);
  });

  it("should reject non-admin setting duty pharmacy", async () => {
    const regularUser = {
      id: 2,
      openId: "user",
      name: "User",
      email: "user@test.com",
      role: "user",
    };
    const caller = appRouter.createCaller(createMockContext(regularUser));

    expect(() => caller.pharmacy.setDuty(1)).rejects.toThrow();
  });
});

describe("Medication Router", () => {
  it("should list all medications", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.medication.list();

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Paracétamol 500mg");
  });

  it("should get medication by id", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.medication.getById(1);

    expect(result?.id).toBe(1);
    expect(result?.dci).toBe("Paracétamol");
  });

  it("should search medications", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.medication.search("Paracétamol");

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toContain("Paracétamol");
  });
});

describe("Stock Router", () => {
  it("should list all stocks", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.stock.list();

    expect(result).toHaveLength(1);
    expect(result[0]?.status).toBe("available");
  });

  it("should get stock by medication", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.stock.getByMedication(1);

    expect(result).toHaveLength(1);
    expect(result[0]?.medicationId).toBe(1);
  });

  it("should get stock by pharmacy", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.stock.getByPharmacy(1);

    expect(result).toHaveLength(1);
    expect(result[0]?.pharmacyId).toBe(1);
  });

  it("should update stock as admin", async () => {
    const adminUser = {
      id: 1,
      openId: "admin",
      name: "Admin",
      email: "admin@test.com",
      role: "admin",
    };
    const caller = appRouter.createCaller(createMockContext(adminUser));
    const result = await caller.stock.update({
      medicationId: 1,
      pharmacyId: 1,
      status: "low_stock",
      price: 1500,
    });

    expect(result.success).toBe(true);
  });

  it("should reject non-authenticated stock update", async () => {
    const caller = appRouter.createCaller(createMockContext());

    expect(() =>
      caller.stock.update({
        medicationId: 1,
        pharmacyId: 1,
        status: "low_stock",
      })
    ).rejects.toThrow();
  });
});

describe("Auth Router", () => {
  it("should login with correct credentials (admin)", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.auth.login({
      username: "admin",
      password: "admin123",
    });

    expect(result.user.role).toBe("admin");
    expect(result.token).toBeDefined();
  });

  it("should login with correct credentials (pharmacist)", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.auth.login({
      username: "pharmacist",
      password: "pass123",
    });

    expect(result.user.role).toBe("pharmacist");
    expect(result.token).toBeDefined();
  });

  it("should reject invalid credentials", async () => {
    const caller = appRouter.createCaller(createMockContext());

    expect(() =>
      caller.auth.login({
        username: "invalid",
        password: "wrong",
      })
    ).rejects.toThrow();
  });
});
