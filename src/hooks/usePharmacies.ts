import { useQuery } from "@tanstack/react-query";
import { Pharmacy } from "@/types"; // Assuming Pharmacy type is defined here or similar

const fetchPharmacies = async (): Promise<Pharmacy[]> => {
  const response = await fetch("http://localhost:5000/api/pharmacies");
  if (!response.ok) {
    throw new Error("Failed to fetch pharmacies");
  }
  return response.json();
};

export function usePharmacies() {
  return useQuery<Pharmacy[], Error>({
    queryKey: ["pharmacies"],
    queryFn: fetchPharmacies,
  });
}
