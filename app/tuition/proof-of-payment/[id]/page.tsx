import ProofViewer from "./client";

export default async function Page(
  props: PageProps<"/tuition/proof-of-payment/[id]">,
) {
  const { id } = await props.params;
  const { name } = await props.searchParams;

  return (
    <ProofViewer
      id={id}
      name={typeof name === "string" ? name : "繳費證明.pdf"}
    />
  );
}
