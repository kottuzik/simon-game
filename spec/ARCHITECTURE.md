# ARCHITECTURE — משחק הזיכרון סיימון

**תאריך מחקר:** 18.10.2026  
**מסמך מקור:** `PRD.md`  
**היקף:** אתר Mobile First בעברית, שני מסכים, PWA ו־Offline; Frontend בלבד.

## 1. Technology Stack שנבחר

| רכיב | טכנולוגיה | תפקיד |
|---|---|---|
| ממשק | HTML5 סמנטי, CSS3, TypeScript | הצגת לוח Simon, ניווט, מצבי משחק ונגישות |
| Build ושרת פיתוח | Vite | פיתוח מקומי, ניהול נכסים ויצירת Build סטטי |
| PWA | `vite-plugin-pwa` עם Workbox (`generateSW`) | יצירת Web App Manifest, Service Worker ו־Precache של קבצים חיוניים |
| שמע | Web Audio API מובנה בדפדפן | יצירת ארבעה צלילים ייחודיים בהצגת הרצף ובלחיצות השחקן, ללא קובצי שמע חיצוניים |
| בדיקות לוגיקה | Vitest | בדיקות אוטומטיות לרצפים, מעבר מצבים, טעויות והשהיה |
| בדיקות דפדפן | בדיקה ידנית במכשירי iPhone/Safari ו־Android/Chrome | אימות מגע, PWA, Offline, שמע, מחזור חיים ונראות |
| ניהול קוד | Git + GitHub Repository | מקור אמת יחיד לקוד ולמסמכי המוצר |
| CI/CD | GitHub Actions | בדיקות, Build ופריסה אוטומטית בעקבות Push ל־`main` |
| Hosting | GitHub Pages עם HTTPS | הגשת קובצי HTML/CSS/JS סטטיים ו־PWA |

**לא נדרשים:** React, Vue, Backend, Database, Authentication, API חיצוני, Cloud Storage, שירות AI או שירות Hosting נוסף.

### נימוקי הבחירה

- **Frontend:** נשקלו Vanilla TypeScript, React ו־Vue. למשחק של שני מסכים, עם State מקומי וללא מידע מרוחק, TypeScript ללא UI Framework מקטין תלות, Bundle ומורכבות. DOM APIs ו־CSS מספיקים. React ו־Vue הן חלופות בשלות, אך אינן נותנות כאן יתרון מהותי.
- **Build:** נשקלו Vite, Parcel והגשה ללא Build. Vite מספק סביבת פיתוח פשוטה, TypeScript, נכסים סטטיים ותיעוד ייעודי ל־GitHub Pages; לכן נבחר.
- **PWA:** נשקלו Service Worker ידני, `vite-plugin-pwa` ופתרון PWA המותאם ל־Framework. התוסף מפחית שגיאות Precache ומתחבר ישירות ל־Vite. יש לנעול גרסאות Dependencies תואמות בקובץ Lock.
- **שמע:** נשקלו Web Audio API, קובצי MP3 מקומיים וספריית שמע חיצונית. Web Audio API מאפשר ארבעה צלילים קצרים ללא בקשות רשת או ספרייה נוספת. הגדרת התדרים והמשך המדויקים היא החלטת מימוש, לא דרישת מוצר חדשה.
- **Hosting:** נשקלו GitHub Pages, Cloudflare Pages ו־Vercel. GitHub Pages מתאים במיוחד לפרויקט סטטי קטן, עם GitHub Actions ו־HTTPS, וללא עלות צפויה בתוכנית החינמית בגבולות השימוש.
- **בדיקות:** Vitest תואם ל־Vite ומאפשר בדיקת לוגיקה טהורה. בדיקות PWA והתנהגות שמע מחייבות בנוסף אימות בדפדפנים אמיתיים.

### סיכונים ומגבלות

1. **iPhone/Safari:** אין להסתמך על `beforeinstallprompt`. אין התקנה ישירה מאתר ב־iPhone; מציגים שם כפתור ״התקן אפליקציה״ שפותח חלונית הסבר (שיתוף ← הוסף למסך הבית), רק כשהאפליקציה אינה במצב standalone. זיהוי iPhone/iPad נעשה לפי User Agent (כולל iPadOS המזוהה כ־Macintosh עם מגע) ולכן הוא הערכה, לא ודאות. ב־Android/Chrome מציגים את הכפתור רק לאחר קבלת אירוע התקנה נתמך, ולאחר התקנה מסתירים אותו.
2. **Offline:** זמינות Offline מתחילה רק לאחר שהאפליקציה והנכסים הדרושים נשמרו בהצלחה ב־Cache. אין להבטיח זאת אם טעינה ראשונה נקטעה או המשתמש מחק נתוני אתר. מחיקת Cache בידי מערכת ההפעלה עשויה לחייב טעינה מחודשת ברשת.
3. **עדכוני PWA:** עדכון Service Worker לא ירענן אוטומטית משחק פעיל; אחרת יופר האילוץ שרענון מאפס התקדמות. להשתמש באסטרטגיית `prompt` ולהפעיל גרסה חדשה רק לאחר הסכמת המשתמש לרענון או בטעינה הבאה; הודעת עדכון היא התנהגות תחזוקה, לא מסך מוצר נוסף.
4. **GitHub Pages:** מגבלות שימוש, פריסה וגודל חלות; בפרויקט זה צפויים קבצים קטנים. GitHub Pages אינו מתאים לשמירת מידע סודי או ל־Backend. ב־GitHub Free נדרש Repository ציבורי לפרסום Pages.
5. **שמע:** מדיניות Autoplay בדפדפנים מחייבת התחלת/חידוש `AudioContext` בעקבות מחוות משתמש. אם שמע אינו זמין, המשחק נשאר פעיל ללא צליל.
6. **תמיכת דפדפנים:** לבדוק גרסאות Safari/Chrome במכשירים הרלוונטיים; לא להבטיח תמיכה בגרסאות ישנות שלא נבדקו.

## 2. ארכיטקטורת המערכת

### 2.1 מבנה כללי

```text
GitHub Repository
       │ Push ל-main
       ▼
GitHub Actions ── Tests + Typecheck + Build ──► GitHub Pages (HTTPS)
                                                   │
                                                   ▼
                                             Mobile Browser / PWA
                                                   │
                 ┌─────────────────────────────────┼───────────────────────────────┐
                 ▼                                 ▼                               ▼
             UI + Navigation                  Game Controller                PWA Service Worker
                 │                                 │                               │
          Simon Board + About       Sequence / State / Scheduler / Audio       Precached assets
```

כל לוגיקת המשחק מתבצעת בדפדפן. אין קריאות לשרת אפליקטיבי, API או Database. GitHub Pages מגיש את הקבצים הסטטיים בלבד.

### 2.2 חלוקה ל־Modules ואחריות

| Module | אחריות |
|---|---|
| `App / Navigation` | שני Views בלבד: ״משחק״ ו״אודות״; ניווט ללא טעינת דף מחדש כדי לשמור מצב משחק בזיכרון |
| `Game Engine` | יצירת רצף אקראי, בדיקת כל לחיצה, עשרת השלבים, ניצחון/כישלון והתקדמות |
| `Game State` | מקור אמת יחיד ל־Phase, שלב, רצף, אינדקס לחיצה, השתקה ומצב השהיה |
| `Sequence Presenter` | הדלקת צבעים לפי הסדר, קצב מדורג, חסימת לחיצות, ביטול Timers והצגה מחדש אחרי השהיה |
| `Simon Board` | ארבעה רבעי עיגול לחיצים; הצגה ויזואלית רק בעת הצגת רצף המערכת; התבהרות קצרה בלחיצת שחקן |
| `Audio` | צליל ייחודי לכל צבע בהארת הרצף ובלחיצת משתמש, בכפוף להשתקה ולזמינות Web Audio |
| `Lifecycle` | `visibilitychange` ו־`pagehide` לפי הצורך; השהיה וחידוש בטוחים ללא התקדמות ברקע |
| `PWA / Install` | Manifest, Service Worker, Offline Cache, זיהוי אפשרות התקנה והפעלת Prompt נתמך |
| `About View` | הוראות משחק, הסבר ושם היוצרת ״אוה סוקולובסקי״ |

מומלץ להפריד לוגיקת משחק טהורה ממניפולציות DOM ומ־Timers, כדי לאפשר בדיקות אוטומטיות ללא דפדפן. אין צורך ב־State Management Library או Router חיצוני.

### 2.3 Data Model וזיכרון

כל הנתונים נשמרים **בזיכרון JavaScript של הדף בלבד**, ללא `localStorage`, `sessionStorage`, IndexedDB או Database. אחסון Cache של קובצי PWA אינו שמירת מצב משחק.

| ישות / שדה | סוג ומשמעות |
|---|---|
| `Color` | Union של `blue`, `red`, `green`, `yellow` |
| `sequence` | מערך `Color[]`, באורך 1–10 |
| `level` | מספר שלם 1–10 במהלך משחק |
| `inputIndex` | מיקום הלחיצה הבאה ברצף, 0 עד אורך הרצף |
| `phase` | `idle`, `showing`, `playerTurn`, `levelComplete`, `won`, `lost` |
| `isMuted` | Boolean של השתקת הצלילים; ברירת מחדל תוגדר במימוש כ־`false` (הנחה טכנית) |
| `isPaused` / `pauseReason` | מצב השהיה וסיבתו: מעבר לאודות או הסתרת האפליקציה |
| `view` | `game` או `about` |
| `presentationGeneration` | מזהה פנימי לביטול פעולות הצגה ישנות לאחר השהיה, איפוס או ניווט |

אין ישות User ואין קשרי Database. בעת Refresh כל הנתונים נוצרים מחדש. במעבר ל״אודות״ אין Unmount או אובדן State של Game Engine.

### 2.4 כללי Game Engine ומכונת מצבים

```text
idle --״התחל״--> showing --> playerTurn
                                 │
                         לחיצה שגויה ──► lost
                                 │
                         רצף הושלם
                                 ▼
                    levelComplete (שלבים 1–9)
                                 │ ״לשלב הבא״
                                 ▼
                              showing

                    השלמת שלב 10 ──► won
                    won / lost --״שחק שוב״--> showing (שלב 1)
```

- שלב 1 מתחיל ברצף של צבע אקראי אחד. כל לחיצה על ״לשלב הבא״ מוסיפה צבע אקראי יחיד לסוף הרצף הקיים; מותרות חזרות. מומלץ להשתמש ב־`crypto.getRandomValues` לדגימת אינדקס 0–3 (ללא צורך באקראיות קריפטוגרפית, אך ללא דפוס קבוע).
- `level` שווה לאורך `sequence`; לעולם אין לעבור 10 צבעים.
- לחיצות על לוח מתקבלות רק ב־`playerTurn`, ורק כשהאפליקציה גלויה במסך המשחק ואינה מושהית.
- כל לחיצה נכונה מגדילה `inputIndex`; לחיצה שגויה מעבירה מיידית ל־`lost`. כאשר כל הרצף הושלם: `levelComplete` בשלבים 1–9, או `won` בשלב 10.
- מעבר לשלב הבא אינו אוטומטי. אין מגבלת זמן בתור השחקן.
- לחיצה על ״משחק חדש״ במשחק פעיל פותחת אישור; ביטול שומר State; אישור מבטל כל Timer קודם ויוצר משחק חדש. במצב משחק פעיל, הצגת האישור משהה אינטראקציה והצגת רצף; ביטול מחזיר את המשחק, ואם הרצף הוצג הוא מוצג מחדש מתחילתו (החלטת מימוש לשמירת עקביות).
- בעת מעבר למסך ״אודות״ או הסתרת האפליקציה, עוצרים כל תזמון. אם `phase=showing`, בחזרה מציגים את **אותו** רצף מחדש מההתחלה. אם `phase=playerTurn`, נשמר `inputIndex` וממשיכים ללא חזרה על לחיצות קודמות.
- כאשר כמה סיבות השהיה מתקיימות במקביל (למשל מסך אודות והסתרת דפדפן), חידוש מתאפשר רק אחרי שכולן הסתיימו; לא להתחיל רצף בזמן שהמסך מוסתר.

### 2.5 תזמון והצגה ויזואלית

- משך הארת צבע בשלב `n` יחושב באופן ליניארי: `800 - (n - 1) * 50` מילישניות; מתקבל 800ms בשלב 1 ו־350ms בשלב 10.
- **הנחת מימוש לפרט שלא הוגדר ב־PRD:** הפסקה קבועה של 200ms בין צבעים. ניתן לכוונן בלי שינוי לוגיקת המשחק.
- בכל רגע לכל היותר צבע אחד מואר. ההארה נעשית באמצעות CSS Class זמני; ההפסקה מציגה לוח ללא הארה.
- Timer פעיל נרשם וניתן לביטול; בכל איפוס/השהיה/ניווט מתבטלים Timers ומוגדל `presentationGeneration` כדי למנוע Callback ישן המשנה משחק חדש.
- לאחר הצגת הרצף מופיעה ״תורך!״ והלוח הופך ללחיץ. בזמן הארת כל צבע ברצף מושמע הצליל שלו (בכפוף להשתקה).
- לחיצה על צבע בתור השחקן מפעילה צליל (אם אינו מושתק) והתבהרות קצרה של הצבע (כ־150ms) כסימן ללחיצה, בהתאם ל־PRD.

### 2.6 UI, נגישות וניווט

- מסמך `lang="he"` ו־`dir="rtl"`; כל כותרות, הודעות וכפתורים בעברית בלבד.
- מסך המשחק כולל כותרת, הוראה קצרה, לוח עגול בעל ארבעה רבעים, כפתור ״התחל״ לפני תחילת המשחק, מספר שלב קבוע בזמן משחק, הודעת ״תורך!״, חיווי התקדמות, כפתור השתקה, כפתור ״משחק חדש״ ותוצאות לפי Phase.
- מסך אודות כולל הסבר, הוראות משחק ושם היוצרת. תפריט ניווט עם ״משחק״ ו״אודות״ בלבד; החלפת View פנימית אינה רענון.
- כל רבע עיגול ימומש ככפתור נגיש עם שם צבע ברור ל־Assistive Technology, שטח מגע מתאים ו־`disabled` סמנטי כשאינו פעיל. `:focus-visible` יישמר לנגישות מקלדת; הסימן ללחיצה הוא התבהרות קצרה בלבד, שונה מהארת הרצף.
- הודעות מצב וחיווי התקדמות יונגשו בצורה שאינה יוצרת הכרזות חוזרות ומציפות. חלונית אישור ״משחק חדש״ תנהל Focus ותאפשר ביטול.
- עיצוב Mobile First לרוחב טלפונים, תוך שמירה על עיגול יחסי, Safe Areas ומניעת גלילה אופקית. אין דרישה לפריסת Tablet/Desktop ייעודית.

### 2.7 Audio

- `AudioContext` ייווצר/יחודש מתוך אינטראקציית משתמש, כדי לעמוד במדיניות Autoplay.
- ארבעה צלילים שונים יופקו באמצעות `OscillatorNode` ו־`GainNode` עם Envelope קצר כדי למנוע Clicks; ללא קובצי Audio או שירותים חיצוניים.
- השמעת צליל מתבצעת בעת הארת צבע בהצגת הרצף ובעקבות לחיצת צבע של השחקן. הצגת רצף שמתחילה מ״התחל״ או מ״לשלב הבא״ נובעת ממחוות משתמש; הצגה חוזרת אחרי חזרה מהסתרה אינה מחוות משתמש, ואם הדפדפן חוסם אותה היא רצה ללא צליל. `isMuted` מבטל השמעה בלבד ולא משפיע על הלוגיקה.
- אם Web Audio חסום/נכשל, יש להמשיך במשחק בלי להשליך שגיאה שמשביתה את הממשק.

### 2.8 PWA ו־Offline

- להגדיר Web App Manifest עם שם `משחק הזיכרון סיימון`, `lang: he`, `dir: rtl`, `display: standalone`, `start_url` ו־`scope` התואמים ל־Base Path של GitHub Pages, אייקונים מקומיים בגודלי התקנה מתאימים וצבעי Theme.
- `vite-plugin-pwa` ייצור Service Worker עם Precache ל־HTML, CSS, JS, Manifest, אייקונים וכל נכס הדרוש לשני המסכים. מאחר שהצלילים נוצרים מקומית, אין צורך ב־Cache לקובצי שמע.
- להשתמש ב־App Shell אחד ובניווט פנימי; אין Routes עמוקים התלויים ב־Server Rewrite. `start_url` יפנה לנתיב הבסיס של האתר.
- בדפדפן תומך ב־`beforeinstallprompt`, לשמור את האירוע ולהציג ״התקן אפליקציה״ רק כשהוא זמין; בלחיצה להפעיל `prompt()` מתוך אירוע משתמש. לאחר התקנה או היעדר תמיכה להסתיר את הכפתור.
- ב־iPhone: להציג את אותו כפתור ״התקן אפליקציה״ כשהמכשיר iOS ו־`navigator.standalone` אינו true; הלחיצה פותחת `dialog` עם צעדי ההתקנה (ובדפדפן שאינו Safari, כגון Chrome — הנחיה לפתוח ב־Safari). החלונית משהה את המשחק באותו מנגנון של חלונית האישור. הכפתור מוסתר במצב standalone.
- יש לבדוק Offline באמצעות טעינה מלאה Online, מעבר למצב טיסה ופתיחה מחדש של האתר או האפליקציה המותקנת. אין להסתמך רק על בדיקת Service Worker ב־DevTools.
- Service Worker משמש רק לקובצי אפליקציה, ולא לשמירת תוצאות/התקדמות.

### 2.9 Data Flow מרכזיים

**התחלת משחק:** לחיצה על ״התחל״ → `Game Engine` מאפס State → יוצר צבע ראשון → `Sequence Presenter` מאיר רצף → `phase=playerTurn` → ״תורך!״.

**לחיצת שחקן:** Button → בדיקת `phase` → `Audio` מנגן אם מותר → `Game Engine` משווה ל־`sequence[inputIndex]` → מעדכן חיווי או מסיים משחק.

**התקדמות:** השלמת רצף → הודעת הצלחה → ״לשלב הבא״ → הוספת צבע אקראי → הצגת רצף מלא במהירות השלב החדש.

**השהיה:** `visibilitychange` או ניווט לאודות → ביטול Timer והקפאת אינטראקציה → בחזרה: הצגה מחדש של רצף אם היה ב־`showing`, אחרת חזרה ל־Phase ולאינדקס הלחיצות הקודמים.

**טעינה Offline:** Browser → Service Worker → קובצי App Shell מה־Precache → אתחול משחק חדש בזיכרון, ללא רשת.

### 2.10 Authentication, אבטחה ופרטיות

- אין Authentication, Authorization, פרופילי משתמש או איסוף נתוני משחק.
- אין Cookies ייעודיים, Analytics או Tracking כחלק מהמוצר. אין לשמור התקדמות מקומית או מרוחקת.
- אין Secrets או API Keys ב־Frontend; לא לשלב נתונים רגישים ב־Repository.
- HTTPS של GitHub Pages מאפשר Service Worker ו־PWA. קוד צד לקוח נחשב ציבורי; יש להימנע מהזרקת HTML לא מהימן ולהעדיף `textContent` לטקסטים דינמיים.
- GitHub עשויה לשמור לוגים תשתיתיים, כולל IP, לצורכי אבטחה בהתאם למדיניותה; אין בכך מנגנון מעקב אפליקטיבי יזום.

### 2.11 GitHub, Hosting ו־Deployment

- Repository יחיד ב־GitHub עם קוד, `PRD.md`, `ARCHITECTURE.md`, תצורת Vite, בדיקות, קובץ Lock ו־Workflow.
- בפרויקט GitHub Pages רגיל בכתובת `https://<owner>.github.io/<repo>/` יש להגדיר ב־Vite `base: '/<repo>/'`; אם האתר בדומיין Root או Custom Domain, `base: '/'`. ה־Manifest וה־Service Worker חייבים להשתמש באותו Base Path.
- GitHub Pages → Settings → Pages → Build and deployment → **GitHub Actions**.
- Push ל־`main` מפעיל Workflow עם הרשאות מינימליות (`contents: read`, `pages: write`, `id-token: write`): Checkout → Node LTS תואם → `npm ci` → `npm run typecheck` → `npm run test` → `npm run build` → Upload של `dist` → Deploy ל־GitHub Pages.
- כישלון בדיקות או Build מונע Deployment. `main` הוא מקור הפריסה ל־Production. אפשר להריץ בדיקות על Pull Requests ללא פריסה.
- אין צורך ב־Environment Variables רגישים, Secrets, Database Migrations או שרת אפליקציה.
- פיתוח מקומי באמצעות `npm install` ו־`npm run dev`; בדיקת Build באמצעות `npm run build` ו־`npm run preview`. `vite preview` מיועד לבדיקה מקומית בלבד, לא ל־Production.
- Hosting צפוי להיות ללא תשלום עבור פרויקט קטן במסגרת GitHub Free ו־Repository ציבורי; דומיין אישי אינו נדרש. יש לוודא עמידה במגבלות GitHub Pages ובתנאי השימוש אם אופי הפרויקט משתנה.

### 2.12 בדיקות ואימות איכות

- **Vitest:** אורך רצף לפי שלב; צבעים חוקיים וחזרות; כישלון בלחיצה שגויה; הצלחה וניצחון בשלב 10; מניעת לחיצות בזמן הצגה; התקדמות `inputIndex`; איפוס וביטול איפוס; השהיה וחידוש ללא שינוי רצף; נוסחת תזמון 800–350ms.
- **בדיקות ידניות ב־iPhone/Safari וב־Android/Chrome:** עיגול וצבעים, RTL, Touch Targets, שמע והשתקה, מעבר אודות, נעילת מסך, מעבר לאפליקציה אחרת, Refresh, התקנה לפי פלטפורמה ו־Offline לאחר טעינה ראשונית.
- **בדיקת PWA:** Manifest תקין, Scope/Start URL נכונים, אייקונים, HTTPS, Service Worker פעיל, טעינה חוזרת במצב טיסה והתנהגות עדכון ללא איבוד משחק פעיל.

## 3. החלטות מימוש משלימות והנחות

1. **משך הפסקה בין צבעים:** 200ms (הנחה טכנית; ה־PRD מגדיר רק ״הפסקה קצרה״).
2. **שינוי מהירות:** אינטרפולציה ליניארית של 50ms פחות לכל שלב, התואמת במדויק לנקודות הקצה שנקבעו.
3. **מצב השתקה בתחילת טעינה:** לא מושתק (`false`); אינו נשמר בין רענונים (הנחה טכנית).
4. **ממשק שני מסכים:** החלפת Views ללא URL Routing חיצוני, כדי לשמור State ולמנוע תלות ב־Fallback של GitHub Pages.
5. **הודעת עדכון PWA:** אין להפעיל רענון אוטומטי בזמן משחק פעיל. אם נדרש עדכון, להציג אפשרות לאשר רענון במועד מתאים, בלי להוסיף מסך שלישי.
6. **טקסטים שלא נוסחו ב־PRD:** ייכתבו בעברית, בהתאם לתפקיד שהוגדר, בלי להוסיף יכולות מוצר חדשות.

## 4. מקורות רשמיים למחקר

- [Vite — Deploying a Static Site](https://vite.dev/guide/static-deploy.html) — Build, `base`, GitHub Actions ו־GitHub Pages.
- [Vite — Building for Production](https://vite.dev/guide/build.html) — פלט סטטי ותמיכת דפדפנים.
- [vite-plugin-pwa — Documentation](https://vite-pwa-org.netlify.app/) — Manifest, Precache, רישום Service Worker ועדכונים.
- [GitHub Docs — What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) — אירוח סטטי וכתובות.
- [GitHub Docs — GitHub Pages Limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) — מגבלות שימוש.
- [GitHub Docs — HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https) — HTTPS וזכאות.
- [MDN — beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event) — תמיכה מוגבלת ב־Prompt התקנה.
- [MDN — Web Audio Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — Autoplay ומחוות משתמש.
- [MDN — Using the Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API) — יצירת צלילים בדפדפן.
- [Vitest — Getting Started](https://vitest.dev/guide/) — בדיקות תואמות Vite ו־TypeScript.

**הערה:** המידע על שירותי Hosting, זכאות ומגבלות מבוסס על התיעוד הרשמי שנבדק באוקטובר 2026; תנאים ומחירים עשויים להשתנות.

## החלטות מרכזיות (ADRs)

### ADR-1: Base Path של GitHub Pages ואייקונים מקומיים
**הקשר:** האתר מתפרסם ב־`https://kottuzik.github.io/simon-game/`, ואין לפרויקט אייקונים.
**החלטה:** `base: '/simon-game/'` ב־`vite.config.ts` (גם בפיתוח, כדי שהסביבות יהיו זהות); ה־Manifest, ה־`start_url` וה־`scope` נגזרים מאותו קבוע. אייקון הלוח נוצר פעם אחת מ־`public/icon.svg` לקובצי PNG שנשמרים ב־`public/`.
**השלכות:** כתובת הפיתוח היא `http://localhost:5173/simon-game/`. שינוי שם ה־repo מחייב לעדכן רק את הקבוע `REPO`.

### ADR-2: כפתור התקנה גם ב־iPhone
**הקשר:** iOS אינו תומך ב־`beforeinstallprompt`.
**החלטה:** ב־iPhone/iPad (זיהוי לפי User Agent) מוצג ״התקן אפליקציה״ שפותח חלונית הסבר; החלונית משהה את המשחק (`pause` עם סיבה `install`). ב־Android הכפתור מפעיל את ה־Prompt הנתמך. בשני המקרים הכפתור מוסתר במצב standalone או אחרי `appinstalled`.
**השלכות:** הזיהוי הוא הערכה; בדפדפן שאינו Safari החלונית מבקשת לפתוח את האתר ב־Safari.
