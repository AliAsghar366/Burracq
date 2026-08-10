import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="container not-found">
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </section>
  );
}
