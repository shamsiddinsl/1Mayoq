# 1Mayoq — Ishga tushirish

## Hozirgi holat
MVP tayyor va **darhol ishlaydi** — `index.html` faylini brauzerda ochish kifoya. Ma'lumotlar hozircha brauzeringizda (localStorage) saqlanadi, Firebase ulanmagan.

## 1. Mahalliy sinov
Papkadagi `index.html` faylini browserda oching (2 marta bosish yetarli) — vazifa qo'sha olasiz, kunlik va haftalik tahlilni ko'rasiz.

## 2. GitHub'ga joylash
```bash
cd 1mayoq
git init
git add .
git commit -m "1Mayoq: MVP - kunlik reja va vaqt tahlili"
git branch -M main
git remote add origin https://github.com/USERNAME/1mayoq.git
git push -u origin main
```

## 3. GitHub Pages yoqish
1. Repo → **Settings** → **Pages**
2. **Source**: `main` branch, `/ (root)` papka
3. Saqlang — bir necha daqiqadan so'ng `https://USERNAME.github.io/1mayoq` manzilida ishlaydi

## 4. Firebase ulash (keyingi qadam, ma'lumotlarni qurilmalar orasida sinxronlash uchun)
1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → nomini kiriting (masalan, `1mayoq`)
2. Loyiha ichida: **Build → Firestore Database** → **Create database** (test mode bilan boshlash mumkin)
3. **Build → Authentication** → **Sign-in method** → **Anonymous**'ni yoqing
4. Loyiha sozlamalari (⚙️ belgisi) → **Your apps** → **Web app** (`</>`) qo'shing
5. Sizga beriladigan `firebaseConfig` obyektini nusxalab, `firebase-config.js` faylidagi `YOUR_API_KEY` va boshqa joylarga qo'ying

Firebase ulanganidan keyin, keyingi suhbatda `app.js`dagi localStorage funksiyalarini Firestore bilan almashtiramiz — bu alohida, kichik bosqich bo'ladi.

## Fayllar tuzilishi
```
1mayoq/
  index.html          — sahifa strukturasi
  style.css           — dizayn (mayoq/dengiz mavzusi)
  app.js              — asosiy mantiq (hozircha localStorage)
  firebase-config.js  — Firebase ulanishi (to'ldirish kerak)
  SETUP.md            — shu fayl
```
