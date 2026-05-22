import { Link } from "../lib/router";

export function NotFound(): React.ReactElement {
  return (
    <div className="page-doc page-404">
      <h1>404 — page not found</h1>
      <p>
        That route doesn't exist. <Link to="/">Go home</Link> or pick a tool below.
      </p>
      <ul>
        <li><Link to="/tool/heic-to-jpg">HEIC → JPG</Link></li>
        <li><Link to="/tool/image-converter">Image Converter</Link></li>
        <li><Link to="/tool/compress">Compress</Link></li>
        <li><Link to="/tool/resize">Resize</Link></li>
      </ul>
    </div>
  );
}
