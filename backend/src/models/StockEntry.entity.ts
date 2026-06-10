import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Pharmacy } from "./Pharmacy.entity";
import { Medication } from "./Medication.entity";

export enum AvailabilityStatus {
  AVAILABLE = "available",
  LOW = "low",
  ON_ORDER = "on_order",
  OUT = "out",
}

@Entity()
export class StockEntry {
  @PrimaryColumn()
  medicationId!: string;

  @PrimaryColumn()
  pharmacyId!: string;

  @ManyToOne(() => Medication, { onDelete: "CASCADE" })
  @JoinColumn({ name: "medicationId" })
  medication!: Medication;

  @ManyToOne(() => Pharmacy, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pharmacyId" })
  pharmacy!: Pharmacy;

  @Column({
    type: "text",
    enum: [AvailabilityStatus.AVAILABLE, AvailabilityStatus.LOW, AvailabilityStatus.ON_ORDER, AvailabilityStatus.OUT],
    default: AvailabilityStatus.OUT,
  })
  status!: AvailabilityStatus;

  @Column({ type: "real", nullable: true })
  price!: number | null;

  @Column({ type: "datetime" })
  updatedAt!: string;
}
