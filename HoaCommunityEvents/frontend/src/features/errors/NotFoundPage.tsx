import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section>
      <h2>Page Not Found</h2>
      <p>The page you requested does not exist.</p>
      <p>
        <Link to="/">Go Home</Link>
      </p>
    </section>
  );
}
