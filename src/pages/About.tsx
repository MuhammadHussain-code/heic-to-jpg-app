import { Link } from "../lib/router";

export function About(): React.ReactElement {
  return (
    <div className="page-doc">
      <h1>About SnapForge</h1>
      <p className="lede">
        SnapForge is a browser-native suite of image utilities — built for people
        who don't want to upload their personal photos to a stranger's server just
        to get a JPG out of their iPhone.
      </p>

      <section>
        <h2>The model</h2>
        <p>
          We make money two ways: tasteful contextual ads on the free tier, and a
          paid Pro plan with higher limits and the more advanced tools. We never
          sell your data because we never see it — every conversion happens on your
          device. There's no upload endpoint to leak from.
        </p>
      </section>

      <section>
        <h2>How it works</h2>
        <p>
          When you drop a file, your browser decodes it with native APIs
          (<code>createImageBitmap</code>, the Canvas 2D context, and for HEIC,
          a WASM decoder downloaded once and cached). The output is written back
          out as a Blob and handed to a download anchor — no network round-trip.
        </p>
        <p>
          Want to verify? Open DevTools → Network, switch to "Fetch/XHR", and run
          a conversion. You'll see <em>nothing</em>.
        </p>
      </section>

      <section>
        <h2>The roadmap</h2>
        <ul>
          <li>AVIF input/output</li>
          <li>On-device background remover (WebGPU)</li>
          <li>Lossless PNG → WebP recompression</li>
          <li>Batch rename templates</li>
          <li>API for Team plans</li>
        </ul>
      </section>

      <section>
        <h2>Get in touch</h2>
        <p>
          Bug reports, ideas, complaints, fan mail — send them to{" "}
          <a href="mailto:hello@muhammad-hussain.com">hello@muhammad-hussain.com</a>{" "}
          or open an issue on our <Link to="/contact">contact page</Link>.
        </p>
      </section>
    </div>
  );
}
