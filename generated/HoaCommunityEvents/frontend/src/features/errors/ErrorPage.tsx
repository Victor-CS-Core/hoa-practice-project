import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

export function ErrorPage() {
  const error = useRouteError();

  let title = 'Unexpected Error';
  let message = 'Something went wrong while loading this page.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    if (typeof error.data === 'string' && error.data.trim()) {
      message = error.data;
    }
  } else if (error instanceof Error && error.message.trim()) {
    message = error.message;
  }

  return (
    <section>
      <h2>{title}</h2>
      <p>{message}</p>
      <p>
        <Link to="/">Go Home</Link>
      </p>
    </section>
  );
}
