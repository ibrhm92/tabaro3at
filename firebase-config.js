// إعدادات Firebase
// يجب استبدال هذه القيم بإعدادات مشروعك الفعلي

const firebaseConfig = {
  apiKey: "AIzaSyBP0K7wbggjiqcDvLXyqTgfu4-P_V30vcw",
  authDomain: "tabro3at-bc47f.firebaseapp.com",
  projectId: "tabro3at-bc47f",
  storageBucket: "tabro3at-bc47f.firebasestorage.app",
  messagingSenderId: "280758361659",
  appId: "1:280758361659:web:763e73d3529038b020861e",
  measurementId: "G-5XZWJPYF3Q"
};


// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// بيانات المسؤول (في التطبيق الحقيقي يجب تخزينها بشكل آمن)
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "blood123"
};

// دالة للتحقق من تسجيل الدخول
function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// دالة لتسجيل الخروج
function logout() {
    localStorage.removeItem('isLoggedIn');
    location.reload();
}

// دالة للتحقق من بيانات المسؤول
function login(username, password) {
    return username === ADMIN_CREDENTIALS.username && 
           password === ADMIN_CREDENTIALS.password;
}

// دوال مساعدة للتعامل مع Firestore

// إضافة متبرع جديد
async function addDonor(donorData) {
    try {
        const docRef = await db.collection('donors').add({
            ...donorData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastDonation: null
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding donor:', error);
        throw error;
    }
}

// الحصول على جميع المتبرعين
async function getDonors() {
    try {
        const snapshot = await db.collection('donors')
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting donors:', error);
        throw error;
    }
}

// الحصول على آخر المتبرعين
async function getRecentDonors(limit = 5) {
    try {
        const snapshot = await db.collection('donors')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting recent donors:', error);
        throw error;
    }
}

// إضافة تبرع جديد
async function addDonation(donationData) {
    try {
        const docRef = await db.collection('donations').add({
            ...donationData,
            donationDate: firebase.firestore.Timestamp.fromDate(donationData.donationDate),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // تحديث آخر تبرع للمتبرع
        await db.collection('donors').doc(donationData.donorId).update({
            lastDonation: firebase.firestore.Timestamp.fromDate(donationData.donationDate)
        });
        
        return docRef.id;
    } catch (error) {
        console.error('Error adding donation:', error);
        throw error;
    }
}

// الحصول على جميع التبرعات
async function getDonations() {
    try {
        const snapshot = await db.collection('donations')
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting donations:', error);
        throw error;
    }
}

// الحصول على آخر التبرعات
async function getRecentDonations(limit = 5) {
    try {
        const snapshot = await db.collection('donations')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting recent donations:', error);
        throw error;
    }
}

// إضافة شيك دم جديد
async function addVoucher(voucherData) {
    try {
        // إنشاء رقم شيك فريد
        const voucherNumber = 'BD' + Date.now();
        
        const docRef = await db.collection('vouchers').add({
            ...voucherData,
            voucherNumber: voucherNumber,
            issueDate: firebase.firestore.FieldValue.serverTimestamp(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // سنة واحدة
            status: 'issued',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return { id: docRef.id, voucherNumber };
    } catch (error) {
        console.error('Error adding voucher:', error);
        throw error;
    }
}

// الحصول على جميع الشيكات
async function getVouchers() {
    try {
        const snapshot = await db.collection('vouchers')
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting vouchers:', error);
        throw error;
    }
}

// الحصول على إحصائيات
async function getStatistics() {
    try {
        const [donorsSnapshot, donationsSnapshot, vouchersSnapshot] = await Promise.all([
            db.collection('donors').get(),
            db.collection('donations').get(),
            db.collection('vouchers').get()
        ]);
        
        return {
            donorsCount: donorsSnapshot.size,
            donationsCount: donationsSnapshot.size,
            vouchersCount: vouchersSnapshot.size
        };
    } catch (error) {
        console.error('Error getting statistics:', error);
        throw error;
    }
}

// الحصول على آخر الشيكات
async function getRecentVouchers(limit = 5) {
    try {
        const snapshot = await db.collection('vouchers')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting recent vouchers:', error);
        throw error;
    }
}

// تحديث متبرع
async function updateDonor(donorId, updateData) {
    try {
        await db.collection('donors').doc(donorId).update({
            ...updateData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating donor:', error);
        throw error;
    }
}

// تحديث تبرع
async function updateDonation(donationId, updateData) {
    try {
        await db.collection('donations').doc(donationId).update({
            ...updateData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating donation:', error);
        throw error;
    }
}

// حذف متبرع
async function deleteDonor(donorId) {
    try {
        await db.collection('donors').doc(donorId).delete();
        return true;
    } catch (error) {
        console.error('Error deleting donor:', error);
        throw error;
    }
}

// حذف تبرع
async function deleteDonation(donationId) {
    try {
        await db.collection('donations').doc(donationId).delete();
        return true;
    } catch (error) {
        console.error('Error deleting donation:', error);
        throw error;
    }
}

// حذف شيك
async function deleteVoucher(voucherId) {
    try {
        await db.collection('vouchers').doc(voucherId).delete();
        return true;
    } catch (error) {
        console.error('Error deleting voucher:', error);
        throw error;
    }
}

// تحديث شيك الدم
async function updateVoucher(voucherId, updateData) {
    try {
        const dataToUpdate = { ...updateData };
        
        // التعامل مع تاريخ الصرف إذا وجد
        if (updateData.redemptionDate) {
            dataToUpdate.redemptionDate = firebase.firestore.Timestamp.fromDate(updateData.redemptionDate);
        }
        
        await db.collection('vouchers').doc(voucherId).update({
            ...dataToUpdate,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating voucher:', error);
        throw error;
    }
}

// تصدير الدوال للاستخدام في ملفات أخرى
window.firebaseDB = {
    addDonor,
    getDonors,
    getRecentDonors,
    addDonation,
    getDonations,
    getRecentDonations,
    addVoucher,
    getVouchers,
    getRecentVouchers,
    updateDonor,
    updateDonation,
    updateVoucher,
    deleteDonor,
    deleteDonation,
    deleteVoucher,
    getStatistics
};

window.auth = {
    isLoggedIn,
    login,
    logout
};
