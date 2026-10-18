const STEPS = [
  'לחצו על ״התחל״ כדי להתחיל משחק חדש.',
  'צפו ברצף הצבעים המוצג.',
  'חזרו על הרצף באותו סדר.',
  'בכל שלב נוסף צבע אחד והמהירות עולה.',
  'נסו להגיע עד שלב 10!',
];

export function createAboutView(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'view view--about';
  section.setAttribute('aria-labelledby', 'about-title');

  section.innerHTML = `
    <h1 id="about-title" class="title">משחק הזיכרון סיימון</h1>

    <section class="about-block" aria-labelledby="about-game">
      <h2 id="about-game" class="h2">על המשחק</h2>
      <p class="body">
        משחק זיכרון קלאסי שבו עליך לצפות ברצף צבעים ולחזור עליו באותו סדר.
        בכל שלב נוסף צבע אחד, והמהירות עולה בהדרגה.
      </p>
    </section>

    <section class="card" aria-labelledby="about-steps">
      <h2 id="about-steps" class="h2">הוראות המשחק</h2>
      <ol class="steps">
        ${STEPS.map((step) => `<li class="steps__item">${step}</li>`).join('')}
      </ol>
    </section>

    <hr class="divider" />

    <section class="about-block" aria-labelledby="about-creator">
      <h2 id="about-creator" class="h3">יוצרת האפליקציה</h2>
      <p class="body">אוה סוקולובסקי</p>
    </section>
  `;

  return section;
}
