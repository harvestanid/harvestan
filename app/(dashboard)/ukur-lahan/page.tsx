import UkurLahanContent from "./ukur-content";

export default async function UkurLahanPage({
  searchParams,
}: {
  searchParams: Promise<{ penggarap_id?: string }>;
}) {
  const { penggarap_id } = await searchParams;

  return <UkurLahanContent penggarapIdFromURL={penggarap_id || null} />;
}
