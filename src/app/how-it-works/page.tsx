export default function HowItWorksPage() {
  return (
    <main className="page narrow">
      <h1 className="title">How it works</h1>
      <p className="prose muted">
        This page is still being written. In short: Jev never sees a pixel. It reads a description of the canvas and picks a gesture, a place, a medium and a colour from fixed lists. Code turns each pick into brush strokes.
      </p>
      <p className="prose muted">
        Jev answers every question with a probability for each option, not a single answer. <strong>Top pick</strong> always takes the option with the highest probability. <strong>Weighted pick</strong> draws one option at random with those probabilities as weights, so an option Jev gave 30% is chosen about three times in ten. Top pick is steadier and more repetitive; weighted pick is livelier and shows more of what Jev considered.
      </p>
    </main>
  );
}
