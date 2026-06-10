import { useQuery } from "@tanstack/react-query";
import { Medication } from "@/types"; // Assuming Medication type is defined here or similar

const fetchMedications = async (): Promise<Medication[]> => {
  const response = await fetch("http://localhost:5000/api/medications");
  if (!response.ok) {
    throw new Error("Failed to fetch medications");
  }
  return response.json();
};

export function useMedications() {
  return useQuery<Medication[], Error>({
    queryKey: ["medications"],
    queryFn: fetchMedications,
  });
}
