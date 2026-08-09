import { redirect } from "next/navigation";

export default function Page() {
  redirect(
    process.env.NODE_ENV === "development"
      ? "/_appassets/favicons/dev.svg"
      : "/_appassets/favicons/prod.svg",
  );
}
