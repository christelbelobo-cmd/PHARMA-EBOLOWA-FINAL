import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class Pharmacy {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  quartier: string;

  @Column()
  address: string;

  @Column()
  phone: string;

  @Column()
  hours: string;

  @Column("decimal", { precision: 10, scale: 7 })
  lat: number;

  @Column("decimal", { precision: 10, scale: 7 })
  lng: number;
}

