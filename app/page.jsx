import VideoIntro from '../components/VideoIntro';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      {/* ── Hero section ── */}
      <VideoIntro nextSectionId="about" />

      {/* ── Placeholder next section (scroll target) ── */}
      <section id="about" className={styles.about}>
        <div className={styles.aboutInner}>
          <p className={styles.aboutLabel}>About</p>
          <h2 className={styles.aboutHeading}>Crafting experiences<br />at the edge of code &amp; design.</h2>
          <p className={styles.aboutBody}>
            A creative technologist building immersive digital worlds — where engineering
            precision meets artistic vision. Available for select projects worldwide.
          </p>
        </div>
      </section>
    </main>
  );
}
