# תוכנית — Milestone 4: PWA, Offline ופרסום

**מטרה:** להפוך את המשחק לאפליקציה שאפשר להתקין ולהפעיל גם בלי אינטרנט (אחרי טעינה ראשונה), ולפרסם אותו אוטומטית ב-GitHub Pages בכל Push ל-`main`.

## 1. מה נכנס ומה לא

**נכנס:**
- Manifest + Service Worker (`vite-plugin-pwa`, `generateSW`, `registerType: 'prompt'`) ששומר בזיכרון המטמון את כל קבצי האפליקציה.
- אייקונים מקומיים לאפליקציה.
- כפתור ״התקן אפליקציה״: ב-Android/Chrome רק כשהדפדפן מציע התקנה ישירה; ב-iPhone כפתור שפותח חלונית הסבר (אין התקנה ישירה באייפון).
- `base` של Vite ל-GitHub Pages, ו-start_url / scope תואמים.
- GitHub Actions: typecheck ← בדיקות ← build ← פריסה ל-GitHub Pages.
- הודעת עדכון עדינה (בלי מסך חדש) שלא מרעננת משחק פעיל.
- רשימת בדיקות ידניות ל-iPhone/Safari ול-Android/Chrome.

**לא נכנס:** שמירת התקדמות, Backend, Analytics, מסך שלישי, שינוי בלוגיקת המשחק (`engine`, `presenter`, `audio` לא משתנים; ב-`pause.ts` רק מתווספת הסיבה `install`).

## 2. החלטות מימוש

- **כתובת האתר ו-base:** ה-remote הוא `kottuzik/simon-game` ← הכתובת `https://kottuzik.github.io/simon-game/` ← `base: '/simon-game/'`. ב-`npm run dev` גם כן `/simon-game/` (כדי שהכל יהיה זהה לפרודקשן; הכתובת המקומית תהיה `http://localhost:5173/simon-game/`). **צריך לעדכן את שורת "הרצה (dev)" ב-CLAUDE.md** — אשאל אותך לפני כן. אם שם ה-repo ישתנה, משנים רק את הקבוע בראש `vite.config.ts`.
- **Manifest:** שם ״משחק הזיכרון סיימון״, `short_name` ״סיימון״, `lang: 'he'`, `dir: 'rtl'`, `display: 'standalone'`, `start_url` ו-`scope` = `/simon-game/` (יחסי ל-base), `theme_color` ו-`background_color` `#F8F8F8` (כמו ב-`index.html` הקיים), `orientation: 'portrait'` לא נכפה (אין דרישה).
- **אייקונים:** אין כרגע קובצי אייקון בפרויקט. אצור אייקון פשוט של לוח Simon (ארבעה רבעים בצבעי ה-Style Guide על רקע כהה) כ-SVG אחד, ומתוכו PNG בגדלים 192, 512, 512-maskable (עם שוליים בטוחים) ו-180 ל-Apple Touch Icon. ההמרה נעשית פעם אחת במחשב (כלי חד-פעמי, לא תלות קבועה בפרויקט) והקבצים נשמרים ב-`public/`. הם מקומיים לחלוטין ונכללים ב-Precache. **זו הנקודה היחידה שבה אצטרך שתאשר/תחליף עיצוב** — אם יש לך אייקון משלך, אשתמש בו במקום.
- **Service Worker / Precache:** `workbox.globPatterns` מכסה `html, js, css, svg, png, woff2, webmanifest`. הגופנים (`@fontsource`) נארזים אוטומטית ע"י Vite ולכן ייכנסו; יש לוודא בבדיקה שקבצי ה-woff2 של Heebo/Inter אכן ב-Precache (אחרת העברית תיראה אחרת Offline). `navigateFallback: 'index.html'` — אפליקציה של מסך אחד ללא נתיבים עמוקים. אין Runtime caching לרשת (אין בקשות רשת).
- **רישום ועדכון (`src/pwa.ts`):** `registerSW` מ-`virtual:pwa-register` עם `onNeedRefresh`. כשיש גרסה חדשה: מציגים שורת הודעה קטנה ״יש גרסה חדשה״ + כפתור ״רענן״ (טקסט עברי, מעל/ליד אזור הפעולות, `role="status"`), שמפעילה את העדכון **רק בלחיצה**. לא מרעננים אוטומטית (ארכיטקטורה סעיף 1 סיכון 3). אם המשחק במצב `idle` — אותה שורה, ללא רענון אוטומטי. בלי מסך חדש.
- **כפתור התקנה (`src/install.ts`):**
  - מאזין ל-`beforeinstallprompt`: `preventDefault()`, שומר את האירוע, מציג את הכפתור. בלחיצה: `event.prompt()` ומחכה ל-`userChoice`, ואז מסתיר.
  - מאזין ל-`appinstalled` ומסתיר. אם האפליקציה כבר רצה ב-`display-mode: standalone` — הכפתור לא מוצג.
  - **iPhone:** האירוע אינו קיים, ולכן מזהים iOS לפי User Agent (כולל iPad שמזדהה כ-Macintosh עם מגע), ומציגים את הכפתור אם `navigator.standalone` אינו true. לחיצה פותחת `dialog` מעל המסך (לא מסך חדש) עם הכותרת ״התקנת האפליקציה באייפון״ וצעדים: 1. לחצי על כפתור השיתוף  2. בחרי ״הוסף למסך הבית״  3. לחצי ״הוסף״. בדפדפן שאינו Safari (Chrome וכו׳) מתווספת שורה: ״פתחי את האתר ב-Safari כדי להתקין״. כפתור ״סגירה״ ו-Esc סוגרים. החלונית משהה את המשחק דרך `pause` (סיבה חדשה `install`), כמו חלונית האישור. הטקסט הסופי של הצעדים בעברית פשוטה ייכתב בבנייה.
  - הכפתור: Secondary עם אייקון Install ~24px (כמו כפתור ההשתקה), טקסט ״התקן אפליקציה״, מגע ≥ 44px, `hidden` כברירת מחדל. ממוקם בקבוצת הפעולות המשניות במסך המשחק, לפי `DESIGN.md`. ההתקנה הישירה ב-Android אינה משפיעה על מצב המשחק; רק חלונית ההסבר של iPhone משהה אותו.
- **index.html:** הוספת `<link rel="apple-touch-icon">` ו-`<meta name="apple-mobile-web-app-capable">` (עוזר ל-iPhone להציג כאפליקציה מלאה אחרי הוספה למסך הבית); `theme-color` קיים. נתיבי נכסים יחסיים ל-base (Vite מטפל).
- **GitHub Actions (`.github/workflows/deploy.yml`):**
  - טריגר: `push` ל-`main`; בנוסף `pull_request` להרצת בדיקות בלבד (בלי פריסה).
  - הרשאות מינימליות: `contents: read`, `pages: write`, `id-token: write`.
  - Job `build`: checkout ← setup-node (LTS, cache npm) ← `npm ci` ← `npm run typecheck` ← `npm run test` ← `npm run build` ← `actions/upload-pages-artifact` על `dist` (רק ב-push).
  - Job `deploy` (תלוי ב-`build`, רק ב-push ל-`main`): `actions/deploy-pages` עם `environment: github-pages`.
  - `concurrency` כדי שפריסות לא יתנגשו. כשל בבדיקות/Build ← אין פריסה.
  - גרסאות ה-Actions: לבדוק בתיעוד הרשמי (Context7/GitHub Docs) את הגרסאות העדכניות לפני הכתיבה.
- **תלויות חדשות:** רק `vite-plugin-pwa` (devDependency, גרסה תואמת ל-Vite 8 — לוודא תאימות בתיעוד לפני התקנה; אם אין תאימות, אעצור ואשאל) ו-`workbox-window` אם התוסף דורש אותו. נעילה ב-`package-lock.json`. סוג `virtual:pwa-register` מתווסף ל-`tsconfig` (`vite-plugin-pwa/client`).

## 3. קבצים

**ליצור:**
```
public/icon.svg                  מקור האייקון
public/pwa-192x192.png, pwa-512x512.png, pwa-maskable-512x512.png, apple-touch-icon.png
src/pwa.ts                       רישום Service Worker + הודעת עדכון ידנית
src/install.ts                   לוגיקת beforeinstallprompt / appinstalled (פונקציה טהורה ככל האפשר, לבדיקה)
src/install.test.ts             בדיקות Vitest: הכפתור מוסתר כברירת מחדל, מוצג אחרי האירוע, מוסתר אחרי התקנה / ב-standalone
.github/workflows/deploy.yml
```

**לשנות:**
```
vite.config.ts            base + VitePWA(...)
package.json / lock       vite-plugin-pwa
tsconfig.json             types של vite-plugin-pwa/client
index.html                apple-touch-icon + meta
src/main.ts               קריאה ל-pwa.ts
src/views/game.ts         כפתור ״התקן אפליקציה״ + שורת עדכון (שינוי מינימלי)
src/styles/components.css סגנון לכפתור ההתקנה ולשורת העדכון
.gitignore                רק אם נוצר קובץ זמני חדש (dev-dist וכד')
spec/MILESTONES.md        🟡 בסיום הבנייה
CLAUDE.md                 כתובת dev (בהסכמתך)
spec/ARCHITECTURE.md      ADR אחד: base path והאייקונים (אם יוחלט)
```

## 4. שלבי בנייה

1. התקנת `vite-plugin-pwa` (אחרי בדיקת תאימות ל-Vite 8) והגדרת `base` + Manifest.
2. יצירת האייקונים והוספתם ל-`public/`.
3. `src/install.ts` + בדיקות + כפתור ב-UI.
4. `src/pwa.ts` + הודעת עדכון.
5. `index.html` ועדכון CSS.
6. `.github/workflows/deploy.yml`.
7. `npm run typecheck`, `npm run test`, `npm run build` ← `npm run preview`: בדיקה בדפדפן המובנה — Manifest תקין, Service Worker פעיל, כל הנכסים (כולל גופנים ואייקונים) ב-Precache, ניתוב `/simon-game/` ורענון, מצב Offline מדומה (ניתוק רשת אחרי טעינה), והצלילים/שני המסכים עובדים.
8. סימון 🟡 ב-`MILESTONES.md` וסיכום.

## 5. מה אתה (המשתמשת) צריכה לעשות — אדריך צעד אחר צעד

1. **ב-GitHub:** ה-repo חייב להיות **ציבורי** (ב-GitHub Free זה תנאי ל-Pages).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. אחרי שתבקשי "דחוף שינויים לגיטהאב", ה-Workflow ירוץ לבד; אעקוב אחרי התוצאה בעזרתך, והכתובת תהיה `https://kottuzik.github.io/simon-game/`.
4. בדיקות במכשירים אמיתיים (iPhone/Safari ו-Android/Chrome) — אני לא יכולה לבצע אותן; אתן רשימה פשוטה.

הדחיפה עצמה (commit/push) תיעשה רק בבקשתך, ולא לפני אישור.

## 6. מיפוי ל-Definition of Done

| תנאי | איך נבדק |
|---|---|
| Push ל-`main` מפעיל בדיקות + Build, ורק Build תקין נפרס | קובץ ה-Workflow (`needs`), וצפייה בהרצה בפועל אחרי הדחיפה |
| האתר נפתח ב-HTTPS בלי שגיאות נכסים, גם אחרי רענון; רענון = משחק חדש | `preview` מקומי עם base; אחרי הפריסה — פתיחה בפועל |
| Offline אחרי טעינה: שני מסכים + צלילים | ניתוק רשת בדפדפן המובנה + בדיקה במכשיר (טיסה) |
| כפתור התקנה: Android כשזמינה התקנה ישירה; iPhone — כפתור עם הסבר, מוסתר אחרי התקנה | Vitest (זיהוי iOS/standalone) + בדיקה ידנית במכשירים |
| בדיקה ב-iPhone וב-Android | **ידנית על ידך** — רשימה תימסר; אסמן במפורש מה לא נבדק |
| אין שמירת התקדמות / Backend / DB / Auth / AI | סקירת קוד; Service Worker רק לקובצי אפליקציה |

## 7. סיכונים

- תאימות `vite-plugin-pwa` לגרסת Vite 8 — נבדק לפני ההתקנה.
- גופנים שלא נכנסים ל-Precache — נבדק ברשימת ה-Precache של הבנייה.
- Android/Chrome מציג את הצעת ההתקנה רק אחרי קריטריונים מסוימים (HTTPS, Manifest, SW, ולפעמים אינטראקציה) — לכן בדיקת ההתקנה האמיתית אפשרית רק לאחר הפריסה.
