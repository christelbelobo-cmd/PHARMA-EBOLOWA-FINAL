import { Medication } from "@/types";

export const MEDICATIONS: Medication[] = [
  { id: "paracetamol-500", name: "Paracétamol 500 mg", dci: "Paracétamol", form: "Comprimé", category: "Antalgique" },
  { id: "paracetamol-sirop", name: "Paracétamol sirop", dci: "Paracétamol", form: "Sirop", category: "Antalgique" },
  { id: "ibuprofene-400", name: "Ibuprofène 400 mg", dci: "Ibuprofène", form: "Comprimé", category: "Anti-inflammatoire" },
  { id: "aspirine-500", name: "Aspirine 500 mg", dci: "Acide acétylsalicylique", form: "Comprimé", category: "Antalgique" },
  { id: "amoxicilline-500", name: "Amoxicilline 500 mg", dci: "Amoxicilline", form: "Gélule", category: "Antibiotique" },
  { id: "amoxicilline-clav", name: "Amoxicilline + Ac. clavulanique", dci: "Amoxicilline/clavulanate", form: "Comprimé", category: "Antibiotique" },
  { id: "azithromycine-250", name: "Azithromycine 250 mg", dci: "Azithromycine", form: "Comprimé", category: "Antibiotique" },
  { id: "ciprofloxacine-500", name: "Ciprofloxacine 500 mg", dci: "Ciprofloxacine", form: "Comprimé", category: "Antibiotique" },
  { id: "metronidazole-250", name: "Métronidazole 250 mg", dci: "Métronidazole", form: "Comprimé", category: "Antibiotique" },
  { id: "act-arthemeter", name: "Coartem (Artéméther + Luméfantrine)", dci: "Artéméther/Luméfantrine", form: "Comprimé", category: "Antipaludique" },
  { id: "artesunate-inj", name: "Artésunate injectable", dci: "Artésunate", form: "Injectable", category: "Antipaludique" },
  { id: "quinine-300", name: "Quinine 300 mg", dci: "Quinine", form: "Comprimé", category: "Antipaludique" },
  { id: "sp-fansidar", name: "Sulfadoxine + Pyriméthamine", dci: "Sulfadoxine/Pyriméthamine", form: "Comprimé", category: "Antipaludique" },
  { id: "oms-sro", name: "Sels de réhydratation orale (SRO)", dci: "SRO", form: "Sachet", category: "Gastro" },
  { id: "omeprazole-20", name: "Oméprazole 20 mg", dci: "Oméprazole", form: "Gélule", category: "Gastro" },
  { id: "metoclopramide", name: "Métoclopramide", dci: "Métoclopramide", form: "Comprimé", category: "Gastro" },
  { id: "loperamide", name: "Lopéramide", dci: "Lopéramide", form: "Gélule", category: "Gastro" },
  { id: "vitamine-c", name: "Vitamine C 500 mg", dci: "Acide ascorbique", form: "Comprimé", category: "Vitamines" },
  { id: "fer-folate", name: "Fer + Acide folique", dci: "Fer/Acide folique", form: "Comprimé", category: "Vitamines" },
  { id: "multivitamines", name: "Multivitamines", dci: "Multivitamines", form: "Comprimé", category: "Vitamines" },
  { id: "cetirizine-10", name: "Cétirizine 10 mg", dci: "Cétirizine", form: "Comprimé", category: "Respiratoire" },
  { id: "salbutamol-spray", name: "Salbutamol inhalateur", dci: "Salbutamol", form: "Aérosol", category: "Respiratoire" },
  { id: "amlodipine-5", name: "Amlodipine 5 mg", dci: "Amlodipine", form: "Comprimé", category: "Cardiologie" },
  { id: "captopril-25", name: "Captopril 25 mg", dci: "Captopril", form: "Comprimé", category: "Cardiologie" },
  { id: "metformine-500", name: "Metformine 500 mg", dci: "Metformine", form: "Comprimé", category: "Diabète" },
  { id: "glibenclamide-5", name: "Glibenclamide 5 mg", dci: "Glibenclamide", form: "Comprimé", category: "Diabète" },
  { id: "diclofenac-50", name: "Diclofénac 50 mg", dci: "Diclofénac", form: "Comprimé", category: "Anti-inflammatoire" },
  { id: "betadine", name: "Povidone iodée (Bétadine)", dci: "Povidone iodée", form: "Solution", category: "Dermatologie" },
  { id: "creme-antifongique", name: "Crème antifongique", dci: "Clotrimazole", form: "Crème", category: "Dermatologie" },
  { id: "albendazole-400", name: "Albendazole 400 mg", dci: "Albendazole", form: "Comprimé", category: "Autre" },
];

export const getMedication = (id: string): Medication | undefined =>
  MEDICATIONS.find((m) => m.id === id);
