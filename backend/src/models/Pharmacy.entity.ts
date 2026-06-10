import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class Pharmacy {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column()
  quartier!: string;

  @Column()
  address!: string;

  @Column()
  phone!: string;

  @Column()
  hours!: string;

  @Column("real") // Use "real" for floating-point numbers in SQLite
  lat!: number;

  @Column("real") // Use "real" for floating-point numbers in SQLite
  lng!: number;
}
