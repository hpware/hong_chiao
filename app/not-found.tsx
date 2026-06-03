export default function NotFound({ error }: { error: Error }) {
  return (
    <div className="flex flex-col justify-center text-center absolute inset-0">
      <h1 className="text-4xl">404</h1>
    </div>
  );
}
