import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class Medication {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  dci: string;

  @Column()
  form: string;

  @Column()
  category: string;
}

