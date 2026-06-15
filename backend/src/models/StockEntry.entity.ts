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
    type: "enum",
    enum: AvailabilityStatus,
    default: AvailabilityStatus.OUT,
  })
  status!: AvailabilityStatus;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price!: number | null;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}

