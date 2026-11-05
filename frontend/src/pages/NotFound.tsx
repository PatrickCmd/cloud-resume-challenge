import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-24">
    <p className="text-sm font-medium uppercase tracking-wider text-primary">404</p>
    <h1 className="text-3xl font-bold tracking-tight text-foreground">Page not found</h1>
    <p className="max-w-[60ch] text-muted-foreground">The page you asked for does not exist or has moved.</p>
    <Link to="/" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
      Back to the home page
    </Link>
  </div>
);

export default NotFound;
