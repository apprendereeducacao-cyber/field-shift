import { getDefaultSiteId, getRotations, getCrops, getCoverCrops } from "@/lib/supabase-data";
import RotacoesClient from "./RotacoesClient";

export default async function Rotacoes() {
  const siteId = await getDefaultSiteId();
  const [{ strategies, scoring_methodology }, crops, coverCrops] = await Promise.all([
    getRotations(siteId),
    getCrops(),
    getCoverCrops(),
  ]);

  return (
    <RotacoesClient
      rotations={strategies}
      rotationsMeta={scoring_methodology}
      crops={crops}
      coverCrops={coverCrops}
    />
  );
}
