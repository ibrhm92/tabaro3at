// المتغيرات العامة
let donors = [];
let donations = [];
let vouchers = [];

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    initializeEventListeners();
    loadData();
});

// التحقق من حالة تسجيل الدخول
function checkLoginStatus() {
    if (!auth.isLoggedIn()) {
        showModal('loginModal');
    } else {
        updateLoginButton();
    }
}

// تحديث زر الدخول
function updateLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.textContent = 'خروج';
    loginBtn.onclick = logout;
}

// تهيئة مستمعي الأحداث
function initializeEventListeners() {
    // أزرار الإجراءات الرئيسية
    document.getElementById('addDonorBtn').addEventListener('click', () => {
        showModal('addDonorModal');
    });
    
    document.getElementById('addDonationBtn').addEventListener('click', () => {
        if (donors.length === 0) {
            showNotification('يجب إضافة متبرعين أولاً', 'warning');
            return;
        }
        populateDonorSelect('donationDonor');
        showModal('addDonationModal');
    });
    
    document.getElementById('addVoucherBtn').addEventListener('click', () => {
        if (donors.length === 0) {
            showNotification('يجب إضافة متبرعين أولاً', 'warning');
            return;
        }
        populateDonorSelect('voucherDonor');
        showModal('addVoucherModal');
    });
    
    document.getElementById('donorsListBtn').addEventListener('click', () => {
        loadDonorsList();
        showModal('donorsListModal');
    });
    
    document.getElementById('redeemVoucherBtn').addEventListener('click', async () => {
        await loadVouchersForRedemption();
        showModal('redeemVoucherModal');
    });
    
    // نماذج الإدخال
    document.getElementById('addDonorForm').addEventListener('submit', handleAddDonor);
    document.getElementById('addDonationForm').addEventListener('submit', handleAddDonation);
    document.getElementById('addVoucherForm').addEventListener('submit', handleAddVoucher);
    document.getElementById('redeemVoucherForm').addEventListener('submit', handleRedeemVoucher);
    document.getElementById('editDonorForm').addEventListener('submit', handleEditDonor);
    document.getElementById('editDonationForm').addEventListener('submit', handleEditDonation);
    document.getElementById('editVoucherForm').addEventListener('submit', handleEditVoucher);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // البحث والفلترة في قائمة المتبرعين
    document.getElementById('searchDonors').addEventListener('input', filterDonors);
    document.getElementById('bloodTypeFilter').addEventListener('change', filterDonors);
    document.getElementById('eligibilityFilter').addEventListener('change', filterDonors);
    document.getElementById('clearFilters').addEventListener('click', clearAllFilters);
    
    // اختيار الشيك للصرف
    document.getElementById('voucherSelect').addEventListener('change', handleVoucherSelection);
    
    // إغلاق النوافذ عند النقر خارجها
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
}

// تحميل البيانات
async function loadData() {
    try {
        const [donorsData, donationsData, vouchersData, stats] = await Promise.all([
            firebaseDB.getRecentDonors(10),
            firebaseDB.getRecentDonations(10),
            firebaseDB.getRecentVouchers(10),
            firebaseDB.getStatistics()
        ]);
        
        donors = donorsData;
        donations = donationsData;
        vouchers = vouchersData;
        
        updateStatistics(stats);
        updateRecentDonors();
        updateRecentDonations();
        updateRecentVouchers();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('حدث خطأ في تحميل البيانات', 'error');
    }
}

// تحديث الإحصائيات
function updateStatistics(stats) {
    document.getElementById('donorsCount').textContent = stats.donorsCount;
    document.getElementById('donationsCount').textContent = stats.donationsCount;
    document.getElementById('vouchersCount').textContent = stats.vouchersCount;
}

// تحديث قائمة المتبرعين الأخيرين
function updateRecentDonors() {
    const container = document.getElementById('recentDonors');
    
    if (donors.length === 0) {
        container.innerHTML = '<p class="empty-message">لا يوجد متبرعين</p>';
        return;
    }
    
    const html = donors.slice(0, 5).map(donor => `
        <div class="list-item">
            <span class="item-name">${donor.name}</span>
            <span class="item-info">${donor.bloodType}</span>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// تحديث قائمة التبرعات الأخيرة
function updateRecentDonations() {
    const container = document.getElementById('recentDonations');
    
    if (donations.length === 0) {
        container.innerHTML = '<p class="empty-message">لا يوجد تبرعات</p>';
        return;
    }
    
    const html = donations.slice(0, 5).map(donation => {
        const date = donation.createdAt ? new Date(donation.createdAt.toDate()).toLocaleDateString('ar-SA') : 'غير محدد';
        return `
            <div class="list-item">
                <span class="item-name">${donation.donorName}</span>
                <span class="item-info">${date}</span>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// ملء قائمة المتبرعين
function populateDonorSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">اختر المتبرع</option>';
    
    donors.forEach(donor => {
        const option = document.createElement('option');
        option.value = donor.id;
        option.textContent = `${donor.name} (${donor.bloodType})`;
        select.appendChild(option);
    });
}

// معالجة إضافة متبرع جديد
async function handleAddDonor(e) {
    e.preventDefault();
    
    const donorData = {
        name: document.getElementById('donorName').value.trim(),
        phone: document.getElementById('donorPhone').value.trim(),
        bloodType: document.getElementById('donorBloodType').value
    };
    
    try {
        await firebaseDB.addDonor(donorData);
        showNotification('تم إضافة المتبرع بنجاح', 'success');
        closeModal('addDonorModal');
        document.getElementById('addDonorForm').reset();
        loadData(); // إعادة تحميل البيانات
    } catch (error) {
        console.error('Error adding donor:', error);
        showNotification('حدث خطأ في إضافة المتبرع', 'error');
    }
}

// معالجة إضافة تبرع جديد
async function handleAddDonation(e) {
    e.preventDefault();
    
    const donorId = document.getElementById('donationDonor').value;
    const donationDate = document.getElementById('donationDate').value;
    const amount = document.getElementById('donationAmount').value;
    
    const donor = donors.find(d => d.id === donorId);
    
    const donationData = {
        donorId: donorId,
        donorName: donor.name,
        bloodType: donor.bloodType,
        amount: parseInt(amount),
        donationDate: new Date(donationDate)
    };
    
    try {
        await firebaseDB.addDonation(donationData);
        showNotification('تم تسجيل التبرع بنجاح', 'success');
        closeModal('addDonationModal');
        document.getElementById('addDonationForm').reset();
        loadData(); // إعادة تحميل البيانات
    } catch (error) {
        console.error('Error adding donation:', error);
        showNotification('حدث خطأ في تسجيل التبرع', 'error');
    }
}

// معالجة إصدار شيك دم جديد
async function handleAddVoucher(e) {
    e.preventDefault();
    
    const donorId = document.getElementById('voucherDonor').value;
    const amount = document.getElementById('voucherAmount').value;
    
    const donor = donors.find(d => d.id === donorId);
    
    const voucherData = {
        donorId: donorId,
        donorName: donor.name,
        bloodType: donor.bloodType,
        amount: parseInt(amount)
    };
    
    try {
        const result = await firebaseDB.addVoucher(voucherData);
        
        // تحديث آخر تبرع للمتبرع (إصدار شيك يعتبر تبرعاً)
        await firebaseDB.updateDonor(donorId, {
            lastDonation: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification(`تم إصدار شيك الدم رقم: ${result.voucherNumber}`, 'success');
        closeModal('addVoucherModal');
        document.getElementById('addVoucherForm').reset();
        loadData(); // إعادة تحميل البيانات
    } catch (error) {
        console.error('Error adding voucher:', error);
        showNotification('حدث خطأ في إصدار شيك الدم', 'error');
    }
}

// معالجة تسجيل الدخول
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (auth.login(username, password)) {
        localStorage.setItem('isLoggedIn', 'true');
        showNotification('تم تسجيل الدخول بنجاح', 'success');
        closeModal('loginModal');
        document.getElementById('loginForm').reset();
        updateLoginButton();
        loadData(); // تحميل البيانات بعد الدخول
    } else {
        showNotification('بيانات الدخول غير صحيحة', 'error');
    }
}

// عرض نافذة منبثقة
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

// إغلاق نافذة منبثقة
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// عرض رسالة تنبيه
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// دوال مساعدة

// تنسيق التاريخ
function formatDate(date) {
    if (!date) return 'غير محدد';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('ar-SA');
}

// تنسيق الوقت
function formatTime(date) {
    if (!date) return 'غير محدد';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

// التحقق من صحة رقم الهاتف
function validatePhone(phone) {
    const phoneRegex = /^01[0-2,5]\d{8}$/;
    return phoneRegex.test(phone);
}

// التحقق من صحة الاسم
function validateName(name) {
    return name.length >= 3 && name.length <= 50;
}

// تصدير الدوال للاستخدام في HTML
window.showModal = showModal;
window.closeModal = closeModal;
window.showNotification = showNotification;

// وظائف إضافية جديدة

// تحميل قائمة المتبرعين الكاملة
async function loadDonorsList() {
    try {
        const allDonors = await firebaseDB.getDonors();
        window.allDonorsData = allDonors; // تخزين البيانات للفلترة
        displayFilteredDonors(allDonors);
    } catch (error) {
        console.error('Error loading donors list:', error);
        showNotification('حدث خطأ في تحميل قائمة المتبرعين', 'error');
    }
}

// عرض قائمة المتبرعين مع الفلترة
function displayFilteredDonors(donorsList) {
    const container = document.getElementById('donorsList');
    
    if (donorsList.length === 0) {
        container.innerHTML = '<p class="empty-message">لا يوجد متبرعين مطابقين للفلاتر</p>';
        return;
    }
    
    const html = donorsList.map(donor => {
        const lastDonation = donor.lastDonation ? formatDate(donor.lastDonation) : 'لم يتبرع بعد';
        const totalDonations = donor.totalDonations || 0;
        const isEligible = checkDonorEligibility(donor.lastDonation);
        const eligibilityStatus = isEligible ? 
            '<span style="color: #2ecc71;">✅ متاح للتبرع</span>' : 
            '<span style="color: #e74c3c;">❌ غير متاح</span>';
        
        return `
            <div class="donor-item">
                <div class="donor-header">
                    <span class="donor-name">${donor.name}</span>
                    <span class="blood-type-badge">${donor.bloodType}</span>
                </div>
                <div class="donor-info">
                    <span class="donor-phone">📱 ${donor.phone}</span>
                    <div class="donor-actions">
                        <button class="call-btn" onclick="callDonor('${donor.phone}')">📞 اتصال</button>
                        <button class="edit-btn" onclick="editDonor('${donor.id}')">تعديل</button>
                        <button class="delete-btn" onclick="deleteDonor('${donor.id}')">حذف</button>
                    </div>
                </div>
                <div class="donor-details">
                    آخر تبرع: ${lastDonation} | إجمالي التبرعات: ${totalDonations}
                </div>
                <div class="donor-eligibility">
                    ${eligibilityStatus}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// التحقق من أهلية المتبرع للتبرع
function checkDonorEligibility(lastDonationDate) {
    if (!lastDonationDate) return true; // لم يتبرع من قبل
    
    const lastDonation = lastDonationDate.toDate ? lastDonationDate.toDate() : new Date(lastDonationDate);
    const now = new Date();
    const daysSinceLastDonation = Math.floor((now - lastDonation) / (1000 * 60 * 60 * 24));
    
    return daysSinceLastDonation >= 56; // 56 يوماً = 8 أسابيع
}

// فلترة المتبرعين
function filterDonors() {
    if (!window.allDonorsData) return;
    
    const searchTerm = document.getElementById('searchDonors').value.toLowerCase();
    const bloodTypeFilter = document.getElementById('bloodTypeFilter').value;
    const eligibilityFilter = document.getElementById('eligibilityFilter').value;
    
    let filteredDonors = window.allDonorsData.filter(donor => {
        // فلترة البحث
        const matchesSearch = !searchTerm || 
            donor.name.toLowerCase().includes(searchTerm) || 
            donor.phone.includes(searchTerm);
        
        // فلترة فصيلة الدم
        const matchesBloodType = !bloodTypeFilter || donor.bloodType === bloodTypeFilter;
        
        // فلترة الأهلية
        let matchesEligibility = true;
        if (eligibilityFilter === 'eligible') {
            matchesEligibility = checkDonorEligibility(donor.lastDonation);
        } else if (eligibilityFilter === 'not-eligible') {
            matchesEligibility = !checkDonorEligibility(donor.lastDonation);
        }
        
        return matchesSearch && matchesBloodType && matchesEligibility;
    });
    
    displayFilteredDonors(filteredDonors);
}

// مسح جميع الفلاتر
function clearAllFilters() {
    document.getElementById('searchDonors').value = '';
    document.getElementById('bloodTypeFilter').value = '';
    document.getElementById('eligibilityFilter').value = 'all';
    
    if (window.allDonorsData) {
        displayFilteredDonors(window.allDonorsData);
    }
}

// البحث في قائمة المتبرعين
function handleSearchDonors(e) {
    const searchTerm = e.target.value.toLowerCase();
    const donorItems = document.querySelectorAll('.donor-item');
    
    donorItems.forEach(item => {
        const name = item.querySelector('.donor-name').textContent.toLowerCase();
        const phone = item.querySelector('.donor-phone').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || phone.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// الاتصال بالمتبرع
function callDonor(phone) {
    // إزالة أي أحرف غير رقمية
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // محاولة الاتصال
    if (cleanPhone.length >= 10) {
        window.location.href = `tel:${cleanPhone}`;
    } else {
        showNotification('رقم الهاتف غير صحيح', 'error');
    }
}

// التحقق من رقم الشيك
async function handleVoucherLookup(e) {
    const voucherNumber = e.target.value.trim();
    
    if (!voucherNumber) {
        document.getElementById('voucherInfo').style.display = 'none';
        return;
    }
    
    try {
        const vouchers = await firebaseDB.getVouchers();
        const voucher = vouchers.find(v => v.voucherNumber === voucherNumber);
        
        if (voucher) {
            displayVoucherInfo(voucher);
        } else {
            showNotification('رقم الشيك غير موجود', 'error');
            document.getElementById('voucherInfo').style.display = 'none';
        }
    } catch (error) {
        console.error('Error looking up voucher:', error);
        showNotification('حدث خطأ في البحث عن الشيك', 'error');
    }
}

// عرض معلومات الشيك
function displayVoucherInfo(voucher) {
    const infoDiv = document.getElementById('voucherInfo');
    const detailsDiv = document.getElementById('voucherDetails');
    
    const issueDate = voucher.issueDate ? formatDate(voucher.issueDate) : 'غير محدد';
    const expiryDate = voucher.expiryDate ? formatDate(voucher.expiryDate) : 'غير محدد';
    
    detailsDiv.innerHTML = `
        <div class="voucher-detail">
            <span class="voucher-label">المتبرع:</span>
            <span class="voucher-value">${voucher.donorName}</span>
        </div>
        <div class="voucher-detail">
            <span class="voucher-label">فصيلة الدم:</span>
            <span class="voucher-value">${voucher.bloodType}</span>
        </div>
        <div class="voucher-detail">
            <span class="voucher-label">الكمية:</span>
            <span class="voucher-value">${voucher.amount} وحدة</span>
        </div>
        <div class="voucher-detail">
            <span class="voucher-label">تاريخ الإصدار:</span>
            <span class="voucher-value">${issueDate}</span>
        </div>
        <div class="voucher-detail">
            <span class="voucher-label">تاريخ انتهاء الصلاحية:</span>
            <span class="voucher-value">${expiryDate}</span>
        </div>
        <div class="voucher-detail">
            <span class="voucher-label">الحالة:</span>
            <span class="voucher-value">${getStatusText(voucher.status)}</span>
        </div>
    `;
    
    infoDiv.style.display = 'block';
}

// الحصول على نص الحالة
function getStatusText(status) {
    const statusMap = {
        'issued': 'صادر',
        'redeemed': 'مصروف',
        'expired': 'منتهي الصلاحية',
        'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
}

// تحديث قائمة الشيكات الأخيرة
function updateRecentVouchers() {
    const container = document.getElementById('recentVouchers');
    
    if (vouchers.length === 0) {
        container.innerHTML = '<p class="empty-message">لا يوجد شيكات</p>';
        return;
    }
    
    const html = vouchers.slice(0, 5).map(voucher => {
        const date = voucher.issueDate ? formatDate(voucher.issueDate) : 'غير محدد';
        const statusText = getStatusText(voucher.status);
        const statusColor = voucher.status === 'issued' ? '#2ecc71' : 
                           voucher.status === 'redeemed' ? '#3498db' : '#e74c3c';
        
        return `
            <div class="list-item">
                <div>
                    <span class="item-name">${voucher.voucherNumber}</span>
                    <span class="item-info">${voucher.donorName} - ${voucher.amount} وحدة</span>
                </div>
                <div>
                    <span style="color: ${statusColor}; font-size: 12px;">${statusText}</span>
                    <div class="item-actions">
                        <button class="edit-btn" onclick="editVoucher('${voucher.id}')">تعديل</button>
                        <button class="delete-btn" onclick="deleteVoucher('${voucher.id}')">حذف</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// تحديث قائمة المتبرعين مع أزرار التعديل والحذف
function displayDonorsList(donorsList) {
    const container = document.getElementById('donorsList');
    
    if (donorsList.length === 0) {
        container.innerHTML = '<p class="empty-message">لا يوجد متبرعين</p>';
        return;
    }
    
    const html = donorsList.map(donor => {
        const lastDonation = donor.lastDonation ? formatDate(donor.lastDonation) : 'لم يتبرع بعد';
        const totalDonations = donor.totalDonations || 0;
        
        return `
            <div class="donor-item">
                <div class="donor-header">
                    <span class="donor-name">${donor.name}</span>
                    <span class="blood-type-badge">${donor.bloodType}</span>
                </div>
                <div class="donor-info">
                    <span class="donor-phone">📱 ${donor.phone}</span>
                    <div class="donor-actions">
                        <button class="call-btn" onclick="callDonor('${donor.phone}')">📞 اتصال</button>
                        <button class="edit-btn" onclick="editDonor('${donor.id}')">تعديل</button>
                        <button class="delete-btn" onclick="deleteDonor('${donor.id}')">حذف</button>
                    </div>
                </div>
                <div class="donor-details">
                    آخر تبرع: ${lastDonation} | إجمالي التبرعات: ${totalDonations}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// تحديث قائمة التبرعات مع أزرار التعديل والحذف
function updateRecentDonations() {
    const container = document.getElementById('recentDonations');
    
    if (donations.length === 0) {
        container.innerHTML = '<p class="empty-message">لا يوجد تبرعات</p>';
        return;
    }
    
    const html = donations.slice(0, 5).map(donation => {
        const date = donation.createdAt ? new Date(donation.createdAt.toDate()).toLocaleDateString('ar-SA') : 'غير محدد';
        return `
            <div class="list-item">
                <div>
                    <span class="item-name">${donation.donorName}</span>
                    <span class="item-info">${donation.amount} وحدة - ${date}</span>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="editDonation('${donation.id}')">تعديل</button>
                    <button class="delete-btn" onclick="deleteDonation('${donation.id}')">حذف</button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// تحميل الشيكات للصرف
async function loadVouchersForRedemption() {
    try {
        const allVouchers = await firebaseDB.getVouchers();
        const issuedVouchers = allVouchers.filter(v => v.status === 'issued');
        
        const select = document.getElementById('voucherSelect');
        select.innerHTML = '<option value="">اختر الشيك المراد صرفه</option>';
        
        issuedVouchers.forEach(voucher => {
            const option = document.createElement('option');
            option.value = voucher.id;
            option.textContent = `${voucher.voucherNumber} - ${voucher.donorName} (${voucher.amount} وحدة)`;
            select.appendChild(option);
        });
        
        if (issuedVouchers.length === 0) {
            showNotification('لا توجد شيكات صالحة للصرف', 'warning');
        }
    } catch (error) {
        console.error('Error loading vouchers for redemption:', error);
        showNotification('حدث خطأ في تحميل الشيكات', 'error');
    }
}

// اختيار الشيك للصرف
async function handleVoucherSelection(e) {
    const voucherId = e.target.value;
    
    if (!voucherId) {
        document.getElementById('voucherInfo').style.display = 'none';
        return;
    }
    
    try {
        const vouchers = await firebaseDB.getVouchers();
        const voucher = vouchers.find(v => v.id === voucherId);
        
        if (voucher) {
            displayVoucherInfo(voucher);
        }
    } catch (error) {
        console.error('Error getting voucher details:', error);
        showNotification('حدث خطأ في جلب بيانات الشيك', 'error');
    }
}

// وظائف التعديل

function editDonor(donorId) {
    const donor = donors.find(d => d.id === donorId);
    if (!donor) return;
    
    document.getElementById('editDonorId').value = donor.id;
    document.getElementById('editDonorName').value = donor.name;
    document.getElementById('editDonorPhone').value = donor.phone;
    document.getElementById('editDonorBloodType').value = donor.bloodType;
    
    showModal('editDonorModal');
}

function editDonation(donationId) {
    const donation = donations.find(d => d.id === donationId);
    if (!donation) return;
    
    document.getElementById('editDonationId').value = donation.id;
    populateDonorSelect('editDonationDonor');
    document.getElementById('editDonationDonor').value = donation.donorId;
    document.getElementById('editDonationAmount').value = donation.amount;
    
    showModal('editDonationModal');
}

function editVoucher(voucherId) {
    const voucher = vouchers.find(v => v.id === voucherId);
    if (!voucher) return;
    
    document.getElementById('editVoucherId').value = voucher.id;
    populateDonorSelect('editVoucherDonor');
    document.getElementById('editVoucherDonor').value = voucher.donorId;
    document.getElementById('editVoucherAmount').value = voucher.amount;
    
    showModal('editVoucherModal');
}

// معالجات التعديل

async function handleEditDonor(e) {
    e.preventDefault();
    
    const donorId = document.getElementById('editDonorId').value;
    const donorData = {
        name: document.getElementById('editDonorName').value.trim(),
        phone: document.getElementById('editDonorPhone').value.trim(),
        bloodType: document.getElementById('editDonorBloodType').value
    };
    
    try {
        await firebaseDB.updateDonor(donorId, donorData);
        showNotification('تم تحديث بيانات المتبرع بنجاح', 'success');
        closeModal('editDonorModal');
        document.getElementById('editDonorForm').reset();
        loadData();
    } catch (error) {
        console.error('Error updating donor:', error);
        showNotification('حدث خطأ في تحديث بيانات المتبرع', 'error');
    }
}

async function handleEditDonation(e) {
    e.preventDefault();
    
    const donationId = document.getElementById('editDonationId').value;
    const donorId = document.getElementById('editDonationDonor').value;
    const amount = document.getElementById('editDonationAmount').value;
    
    const donor = donors.find(d => d.id === donorId);
    
    const donationData = {
        donorId: donorId,
        donorName: donor.name,
        bloodType: donor.bloodType,
        amount: parseInt(amount)
    };
    
    try {
        await firebaseDB.updateDonation(donationId, donationData);
        showNotification('تم تحديث بيانات التبرع بنجاح', 'success');
        closeModal('editDonationModal');
        document.getElementById('editDonationForm').reset();
        loadData();
    } catch (error) {
        console.error('Error updating donation:', error);
        showNotification('حدث خطأ في تحديث بيانات التبرع', 'error');
    }
}

async function handleEditVoucher(e) {
    e.preventDefault();
    
    const voucherId = document.getElementById('editVoucherId').value;
    const donorId = document.getElementById('editVoucherDonor').value;
    const amount = document.getElementById('editVoucherAmount').value;
    
    const donor = donors.find(d => d.id === donorId);
    
    const voucherData = {
        donorId: donorId,
        donorName: donor.name,
        bloodType: donor.bloodType,
        amount: parseInt(amount)
    };
    
    try {
        await firebaseDB.updateVoucher(voucherId, voucherData);
        showNotification('تم تحديث بيانات الشيك بنجاح', 'success');
        closeModal('editVoucherModal');
        document.getElementById('editVoucherForm').reset();
        loadData();
    } catch (error) {
        console.error('Error updating voucher:', error);
        showNotification('حدث خطأ في تحديث بيانات الشيك', 'error');
    }
}

// وظائف الحذف

async function deleteDonor(donorId) {
    if (!confirm('هل أنت متأكد من حذف هذا المتبرع؟')) return;
    
    try {
        await firebaseDB.deleteDonor(donorId);
        showNotification('تم حذف المتبرع بنجاح', 'success');
        loadData();
    } catch (error) {
        console.error('Error deleting donor:', error);
        showNotification('حدث خطأ في حذف المتبرع', 'error');
    }
}

async function deleteDonation(donationId) {
    if (!confirm('هل أنت متأكد من حذف هذا التبرع؟')) return;
    
    try {
        await firebaseDB.deleteDonation(donationId);
        showNotification('تم حذف التبرع بنجاح', 'success');
        loadData();
    } catch (error) {
        console.error('Error deleting donation:', error);
        showNotification('حدث خطأ في حذف التبرع', 'error');
    }
}

async function deleteVoucher(voucherId) {
    if (!confirm('هل أنت متأكد من حذف هذا الشيك؟')) return;
    
    try {
        await firebaseDB.deleteVoucher(voucherId);
        showNotification('تم حذف الشيك بنجاح', 'success');
        loadData();
    } catch (error) {
        console.error('Error deleting voucher:', error);
        showNotification('حدث خطأ في حذف الشيك', 'error');
    }
}
async function handleRedeemVoucher(e) {
    e.preventDefault();
    
    const voucherId = document.getElementById('voucherSelect').value;
    const beneficiaryName = document.getElementById('beneficiaryName').value.trim();
    const redemptionPurpose = document.getElementById('redemptionPurpose').value.trim();
    
    if (!voucherId) {
        showNotification('يرجى اختيار الشيك المراد صرفه', 'error');
        return;
    }
    
    try {
        const vouchers = await firebaseDB.getVouchers();
        const voucher = vouchers.find(v => v.id === voucherId);
        
        if (!voucher) {
            showNotification('الشيك غير موجود', 'error');
            return;
        }
        
        if (voucher.status === 'redeemed') {
            showNotification('هذا الشيك تم صرفه بالفعل', 'error');
            return;
        }
        
        if (voucher.status === 'expired') {
            showNotification('هذا الشيك منتهي الصلاحية', 'error');
            return;
        }
        
        // تحديث حالة الشيك
        await firebaseDB.updateVoucher(voucherId, {
            status: 'redeemed',
            redemptionDate: firebase.firestore.FieldValue.serverTimestamp(),
            beneficiaryName: beneficiaryName,
            redemptionPurpose: redemptionPurpose
        });
        
        showNotification('تم صرف الشيك بنجاح', 'success');
        closeModal('redeemVoucherModal');
        document.getElementById('redeemVoucherForm').reset();
        document.getElementById('voucherInfo').style.display = 'none';
        loadData(); // إعادة تحميل البيانات
        
    } catch (error) {
        console.error('Error redeeming voucher:', error);
        showNotification('حدث خطأ في صرف الشيك', 'error');
    }
}
