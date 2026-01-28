# 🛠️ إصلاح خطأ Firebase

## المشكلة
```
@firebase/firestore: Firestore (9.6.1): Could not reach Cloud Firestore backend. Connection failed 1 times. Most recent error: FirebaseError: [code=permission-denied]: Permission denied on resource project blood-bank-app.
```

## الحلول

### 1. إصلاح قواعد الأمان في Firestore

اذهب إلى Firebase Console → Firestore Database → Rules واستبدل القواعد بـ:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 2. التحقق من إعدادات المشروع

افتح `firebase-config.js` وتأكد من:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",  // يجب أن يكون صحيحاً
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345678"
};
```

### 3. خطوات الإعداد الصحيح

1. **إنشاء مشروع جديد في Firebase**
   - اذهب إلى https://console.firebase.google.com
   - انقر "Add project"
   - أدخل اسم المشروع (مثلاً: blood-bank-app-2024)

2. **تفعيل Firestore Database**
   - اذهب إلى "Firestore Database"
   - انقر "Create database"
   - اختر "Start in test mode"
   - اختر منطقة قريبة منك

3. **الحصول على إعدادات المشروع**
   - اذهب إلى Project Settings → General
   - انقر "Web app"
   - انسخ إعدادات `firebaseConfig`

4. **تحديث الملفات**
   - استبدل القيم في `firebase-config.js`
   - تأكد من أن `projectId` صحيح

### 4. اختبار الاتصال

افتح المتصفح وافتح وحدة التحكم (F12) وتأكد من عدم وجود أخطاء.

### 5. إذا استمرت المشكلة

جرب استخدام مشروع Firebase جديد بالكامل:

1. أنشئ مشروع جديد باسم مختلف
2. فعل Firestore Database
3. انسخ الإعدادات الجديدة
4. حدّث `firebase-config.js`

## ملاحظات هامة

- في بيئة الإنتاج، يجب استخدام قواعد أمان أكثر صرامة
- تأكد من أن المشروع في وضع "test mode" أثناء التطوير
- تحقق من اتصال الإنترنت
- تأكد من أن المتصفح لا يمنع الاتصال بـ Firebase
