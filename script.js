// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBwhLbKHuiNTqRzpngP_7I99TUTnFjKYkE",
    authDomain: "myhomework-app-fff5e.firebaseapp.com",
    projectId: "myhomework-app-fff5e",
    storageBucket: "myhomework-app-fff5e.firebasestorage.app",
    messagingSenderId: "1015046592053",
    appId: "1:1015046592053:web:d4d94c8727707cf4b1837c",
    measurementId: "G-XF37RLFB6E"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

// Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        showDashboard();
        loadHomework();
    } else {
        currentUser = null;
        showAuth();
    }
});

// Show/Hide Sections
function showAuth() {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    
    const displayName = currentUser.displayName || currentUser.email.split('@')[0];
    document.getElementById('welcomeMessage').innerHTML = `
        <div>🌸 สวัสดี ${displayName}! 🌸</div>
        <div style="font-size: 0.9rem; margin-top: 8px; opacity: 0.9;">พร้อมจัดการงาน/การบ้านกันเลย!</div>
    `;
}

function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.add('hidden');
    clearMessages();
}

function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('forgotPasswordForm').classList.add('hidden');
    clearMessages();
}

function showForgotPassword() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.remove('hidden');
    clearMessages();
}

// Message Functions
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    setTimeout(() => successDiv.classList.add('hidden'), 3000);
}

function clearMessages() {
    document.getElementById('errorMessage').classList.add('hidden');
    document.getElementById('successMessage').classList.add('hidden');
}

// Authentication Functions
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showError('กรุณากรอกอีเมลและรหัสผ่าน');
        return;
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
        showSuccess('เข้าสู่ระบบสำเร็จ!');
    } catch (error) {
        showError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
}

async function signup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (!name || !email || !password) {
        showError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    if (password.length < 6) {
        showError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        showSuccess('สมัครสมาชิกสำเร็จ!');
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            showError('อีเมลนี้ถูกใช้งานแล้ว');
        } else {
            showError('เกิดข้อผิดพลาดในการสมัครสมาชิก');
        }
    }
}

async function resetPassword() {
    const email = document.getElementById('forgotEmail').value;

    if (!email) {
        showError('กรุณากรอกอีเมล');
        return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        showSuccess('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว! 📧');
        
        setTimeout(() => {
            showSuccess('กรุณาตรวจสอบอีเมล (รวมถึงใน Spam) และคลิกลิงก์เพื่อตั้งรหัสผ่านใหม่');
        }, 2000);
        
        setTimeout(() => {
            showLogin();
        }, 4000);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            showError('ไม่พบอีเมลนี้ในระบบ');
        } else {
            showError('เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน');
        }
    }
}

async function logout() {
    await auth.signOut();
    // Clear form inputs
    document.getElementById('homeworkTitle').value = '';
    document.getElementById('homeworkSubject').value = '';
    document.getElementById('homeworkDescription').value = '';
    document.getElementById('homeworkAssignDate').value = '';
    document.getElementById('homeworkDueDate').value = '';
}

// Homework Functions
async function addHomework() {
    const title = document.getElementById('homeworkTitle').value;
    const subject = document.getElementById('homeworkSubject').value;
    const description = document.getElementById('homeworkDescription').value; // เพิ่มการดึง description
    const assignDate = document.getElementById('homeworkAssignDate').value;
    const dueDate = document.getElementById('homeworkDueDate').value;

    if (!title || !subject || !assignDate || !dueDate) {
        showError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    // ตรวจสอบว่าวันที่ครูสั่งไม่เกินวันกำหนดส่ง
    if (new Date(assignDate) > new Date(dueDate)) {
        showError('วันที่ครูสั่งต้องไม่เกินวันกำหนดส่ง');
        return;
    }

    try {
        await db.collection('homework').add({
            title: title,
            subject: subject,
            description: description, // เพิ่มการบันทึก description
            assignDate: assignDate,
            dueDate: dueDate,
            userId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Clear form
        document.getElementById('homeworkTitle').value = '';
        document.getElementById('homeworkSubject').value = '';
        document.getElementById('homeworkDescription').value = ''; // เคลียร์ description ด้วย
        document.getElementById('homeworkAssignDate').value = '';
        document.getElementById('homeworkDueDate').value = '';

        showSuccess('เพิ่มงานสำเร็จ! ✨');
        
        // เพิ่มเสียงแจ้งเตือน (optional)
        playSuccessSound();
        
        // รอสักครู่แล้วโหลดข้อมูลใหม่
        setTimeout(() => {
            loadHomework();
        }, 500);
    } catch (error) {
        console.error('Error adding homework:', error);
        showError('เกิดข้อผิดพลาดในการเพิ่มงาน');
    }
}

// แก้ไขฟังก์ชัน loadHomework - ลบ orderBy ออกเพื่อหลีกเลี่ยงปัญหา index
async function loadHomework() {
    try {
        const snapshot = await db.collection('homework')
            .where('userId', '==', currentUser.uid)
            .get(); // ลบ orderBy ออกก่อน

        const homeworkCards = document.getElementById('homeworkCards');
        homeworkCards.innerHTML = '';

        if (snapshot.empty) {
            homeworkCards.innerHTML = `
                <div class="no-homework">
                    <div class="no-homework-icon">📚✨</div>
                    <p>ยังไม่มีงาน/การบ้าน</p>
                    <p style="font-size: 0.9rem; margin-top: 5px; color: #cbd5e0;">เพิ่มงานใหม่ด้านบนเลย!</p>
                </div>
            `;
            return;
        }

        // แปลงข้อมูลเป็น array และเรียงลำดับใน JavaScript
        const homeworkArray = [];
        snapshot.forEach((doc) => {
            homeworkArray.push({ id: doc.id, ...doc.data() });
        });

        // เรียงลำดับตามวันกำหนดส่ง
        homeworkArray.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // แสดงข้อมูลที่เรียงลำดับแล้ว
        homeworkArray.forEach((homework) => {
            const assignDate = new Date(homework.assignDate);
            const dueDate = new Date(homework.dueDate);
            const today = new Date();
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let dueDateText = '';
            let dueDateClass = '';

            if (diffDays < 0) {
                dueDateText = `เกินกำหนดไป ${Math.abs(diffDays)} วัน`;
                dueDateClass = 'style="color: #e53e3e; font-weight: 600;"';
            } else if (diffDays === 0) {
                dueDateText = 'ครบกำหนดวันนี้!';
                dueDateClass = 'style="color: #dd6b20; font-weight: 600;"';
            } else if (diffDays === 1) {
                dueDateText = 'ครบกำหนดพรุ่งนี้';
                dueDateClass = 'style="color: #d69e2e; font-weight: 600;"';
            } else {
                dueDateText = `อีก ${diffDays} วัน (${dueDate.toLocaleDateString('th-TH')})`;
            }

            // สร้าง HTML สำหรับ description (ถ้ามี)
            const descriptionHTML = homework.description && homework.description.trim() 
                ? `<div class="homework-description">${homework.description}</div>` 
                : '';

            const homeworkCard = document.createElement('div');
            homeworkCard.className = 'homework-card';
            homeworkCard.innerHTML = `
                <div class="homework-title">${homework.title}</div>
                <div class="homework-subject">${homework.subject}</div>
                ${descriptionHTML}
                <div class="homework-date">
                    📝 วันที่ครูสั่ง: ${assignDate.toLocaleDateString('th-TH')}
                </div>
                <div class="homework-date" ${dueDateClass}>
                    📅 กำหนดส่ง: ${dueDateText}
                </div>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="btn-complete" onclick="completeHomework('${homework.id}')">
                        ✅ เสร็จแล้ว
                    </button>
                    <button class="btn-edit" onclick="editHomework('${homework.id}')">
                        ✏️ แก้ไข
                    </button>
                </div>
            `;
            
            homeworkCards.appendChild(homeworkCard);
        });
    } catch (error) {
        console.error('Error loading homework:', error);
        showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
}

async function completeHomework(homeworkId) {
    // เพิ่มการแสดงผล animation
    const homeworkCard = document.querySelector(`button[onclick="completeHomework('${homeworkId}')"]`).closest('.homework-card');
    homeworkCard.style.opacity = '0.5';
    homeworkCard.style.transform = 'scale(0.95)';
    
    try {
        await db.collection('homework').doc(homeworkId).delete();
        showSuccess('เสร็จสิ้นงานแล้ว! 🎉');
        
        // รอแอนิเมชั่นจบก่อนโหลดใหม่
        setTimeout(() => {
            loadHomework();
        }, 300);
    } catch (error) {
        // คืนค่าหากเกิดข้อผิดพลาด
        homeworkCard.style.opacity = '1';
        homeworkCard.style.transform = 'scale(1)';
        showError('เกิดข้อผิดพลาดในการลบงาน');
    }
}

// ฟังก์ชันแก้ไขงาน
async function editHomework(homeworkId) {
    try {
        // ดึงข้อมูลงานจาก Firebase
        const doc = await db.collection('homework').doc(homeworkId).get();
        
        if (!doc.exists) {
            showError('ไม่พบข้อมูลงานที่ต้องการแก้ไข');
            return;
        }
        
        const homework = doc.data();
        
        // แสดง Modal แก้ไข
        showEditModal(homeworkId, homework);
        
    } catch (error) {
        console.error('Error fetching homework:', error);
        showError('เกิดข้อผิดพลาดในการดึงข้อมูล');
    }
}

// ฟังก์ชันแสดง Modal แก้ไข
function showEditModal(homeworkId, homework) {
    // สร้าง Modal
    const modal = document.createElement('div');
    modal.id = 'editModal';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; border-radius: 20px; padding: 30px; max-width: 400px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h2 style="text-align: center; margin-bottom: 25px; color: #9f7aea;">✏️ แก้ไขงาน/การบ้าน</h2>
                
                <div class="form-group">
                    <label>ชื่อการบ้าน/งาน</label>
                    <input type="text" id="editTitle" value="${homework.title}" required>
                </div>
                
                <div class="form-group">
                    <label>วิชา</label>
                    <select id="editSubject" required>
                        <option value="">เลือกวิชา</option>
                        <option value="คณิตศาสตร์" ${homework.subject === 'คณิตศาสตร์' ? 'selected' : ''}>คณิตศาสตร์</option>
                        <option value="ภาษาไทย" ${homework.subject === 'ภาษาไทย' ? 'selected' : ''}>ภาษาไทย</option>
                        <option value="ภาษาอังกฤษ" ${homework.subject === 'ภาษาอังกฤษ' ? 'selected' : ''}>ภาษาอังกฤษ</option>
                        <option value="วิทยาศาสตร์" ${homework.subject === 'วิทยาศาสตร์' ? 'selected' : ''}>วิทยาศาสตร์</option>
                        <option value="สังคมศึกษา" ${homework.subject === 'สังคมศึกษา' ? 'selected' : ''}>สังคมศึกษา</option>
                        <option value="ประวัติศาสตร์" ${homework.subject === 'ประวัติศาสตร์' ? 'selected' : ''}>ประวัติศาสตร์</option>
                        <option value="ฟิสิกส์" ${homework.subject === 'ฟิสิกส์' ? 'selected' : ''}>ฟิสิกส์</option>
                        <option value="เคมี" ${homework.subject === 'เคมี' ? 'selected' : ''}>เคมี</option>
                        <option value="ชีววิทยา" ${homework.subject === 'ชีววิทยา' ? 'selected' : ''}>ชีววิทยา</option>
                        <option value="อื่นๆ" ${homework.subject === 'อื่นๆ' ? 'selected' : ''}>อื่นๆ</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>รายละเอียด</label>
                    <textarea id="editDescription" rows="3" placeholder="ใส่รายละเอียดของงาน/การบ้าน (ไม่บังคับ)">${homework.description || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label>วันที่ครูสั่ง</label>
                    <input type="date" id="editAssignDate" value="${homework.assignDate}" required>
                </div>
                
                <div class="form-group">
                    <label>วันกำหนดส่ง</label>
                    <input type="date" id="editDueDate" value="${homework.dueDate}" required>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="saveEditedHomework('${homeworkId}')" style="flex: 1;">
                        💾 บันทึก
                    </button>
                    <button class="btn btn-secondary" onclick="closeEditModal()" style="flex: 1;">
                        ❌ ยกเลิก
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ฟังก์ชันบันทึกการแก้ไข
async function saveEditedHomework(homeworkId) {
    const title = document.getElementById('editTitle').value;
    const subject = document.getElementById('editSubject').value;
    const description = document.getElementById('editDescription').value;
    const assignDate = document.getElementById('editAssignDate').value;
    const dueDate = document.getElementById('editDueDate').value;
    
    if (!title || !subject || !assignDate || !dueDate) {
        showError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }
    
    // ตรวจสอบว่าวันที่ครูสั่งไม่เกินวันกำหนดส่ง
    if (new Date(assignDate) > new Date(dueDate)) {
        showError('วันที่ครูสั่งต้องไม่เกินวันกำหนดส่ง');
        return;
    }
    
    try {
        await db.collection('homework').doc(homeworkId).update({
            title: title,
            subject: subject,
            description: description,
            assignDate: assignDate,
            dueDate: dueDate,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showSuccess('แก้ไขงานสำเร็จ! ✨');
        closeEditModal();
        
        // โหลดข้อมูลใหม่
        setTimeout(() => {
            loadHomework();
        }, 500);
        
    } catch (error) {
        console.error('Error updating homework:', error);
        showError('เกิดข้อผิดพลาดในการแก้ไข');
    }
}

// ฟังก์ชันปิด Modal
function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.remove();
    }
}

// เพิ่มฟังก์ชันตั้งวันที่วันนี้อัตโนมัติ
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('homeworkAssignDate').value = today;
}

// เพิ่มเสียงแจ้งเตือน (optional)
function playSuccessSound() {
    // สร้างเสียงแจ้งเตือนแบบเบา ๆ
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลด
document.addEventListener('DOMContentLoaded', function() {
    setTodayDate();
});