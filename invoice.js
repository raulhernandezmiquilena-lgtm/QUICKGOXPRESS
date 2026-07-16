// --- FIREBASE CONFIGURATION (Put your real keys here when you want to sync devices) ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// --- DATABASE HYBRID DETECTOR ---
let database = null;
let useFirebase = false;

// Check if credentials are set, if not, fallback gracefully to LocalStorage
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && !firebaseConfig.apiKey.includes("TU_API_KEY")) {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        useFirebase = true;
        console.log("QUICKGOXPRESS: Connected to cloud (Firebase).");
    } catch (e) {
        console.warn("QUICKGOXPRESS: Firebase initialization failed. Using LocalStorage fallback.", e);
    }
} else {
    console.warn("QUICKGOXPRESS: Firebase not configured. Running in LocalStorage offline mode.");
}

// --- SESSION VARIABLES ---
let currentUserCode = null;
let isCodeVisible = false;
let currentRowsData = [];

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23a0aec0'><circle cx='50' cy='50' r='48' fill='%23e2e8f0'/><circle cx='50' cy='38' r='18'/><path d='M50 62c-18 0-32 8-32 20h64c0-12-14-20-32-20z'/></svg>";

// View Control
function showRegister() {
    document.getElementById('auth-options').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('auth-options').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

function backToAuth() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('auth-options').classList.remove('hidden');
}

// Generate unique 8-digit access code
function generateCode() {
    const randomCode = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Default template data for a clean new user
    const newUser = {
        username: 'Username',
        driverName: '',
        dispatcherName: '',
        avatar: DEFAULT_AVATAR,
        theme: 'light',
        rowsData: Array(12).fill(null).map((_, i) => ({
            id: i + 1,
            nombre: `Person ${i + 1}`,
            carga: '',
            fechaEntrega: '',
            fechaRecibido: '',
            activo: false,
            archivo: '',
            archivoNombre: '',
            archivoTipo: ''
        }))
    };

    if (useFirebase) {
        // Firebase Online Generation
        database.ref('users/' + randomCode).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                generateCode(); // Regenerate if collision happens
            } else {
                database.ref('users/' + randomCode).set(newUser).then(() => {
                    displayGeneratedCode(randomCode);
                });
            }
        }).catch(err => {
            console.error("Firebase write error:", err);
            alert("Error writing to cloud database.");
        });
    } else {
        // LocalStorage Offline Generation
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[randomCode]) {
            generateCode(); // Regenerate if collision happens
        } else {
            users[randomCode] = newUser;
            localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
            displayGeneratedCode(randomCode);
        }
    }
}

function displayGeneratedCode(code) {
    document.getElementById('generated-code-display').innerHTML = `
        Your code is: <br><span style="font-size: 1.8rem; color: #28a745;">${code}</span><br>
        <small style="color:#555;">Write it down! You can use it to log in.</small>
    `;
}

// Log in function
function login() {
    const codeInput = document.getElementById('login-code').value.trim();

    if(codeInput.length !== 8 || isNaN(codeInput)) {
        alert("Please enter a valid 8-digit numeric code.");
        return;
    }

    if (useFirebase) {
        database.ref('users/' + codeInput).once('value').then((snapshot) => {
            if(snapshot.exists()) {
                currentUserCode = codeInput;
                localStorage.setItem('quickgo_current_session', currentUserCode);
                loadDashboard();
            } else {
                alert("This code does not exist in the database.");
            }
        }).catch(err => {
            console.error("Login error: ", err);
            alert("Connection error. Try again.");
        });
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[codeInput]) {
            currentUserCode = codeInput;
            localStorage.setItem('quickgo_current_session', currentUserCode);
            loadDashboard();
        } else {
            alert("This code does not exist offline.");
        }
    }
}

// Load user dashboard and sync data
function loadDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-dashboard').classList.remove('hidden');

    isCodeVisible = false;
    updateCodeDisplay();

    if (useFirebase) {
        // Firebase Cloud Realtime Sync
        database.ref('users/' + currentUserCode).on('value', (snapshot) => {
            const userData = snapshot.val();
            if(!userData) return;
            applyUserData(userData);
        });
    } else {
        // LocalStorage Sync
        const users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        const userData = users[currentUserCode];
        if (userData) {
            applyUserData(userData);
        }
    }
}

function applyUserData(userData) {
    // Apply username
    const userName = userData.username || 'Username';
    document.getElementById('display-user-name').innerText = userName;
    document.getElementById('edit-user-name-input').value = userName;

    // Apply driver & dispatcher
    document.getElementById('driver-name-input').value = userData.driverName || '';
    document.getElementById('dispatcher-name-input').value = userData.dispatcherName || '';

    // Apply Avatar
    document.getElementById('user-avatar').src = userData.avatar || DEFAULT_AVATAR;

    // Apply Theme without rewriting loops
    setTheme(userData.theme || 'light', false);

    // Render table rows
    currentRowsData = userData.rowsData || [];
    renderRows(currentRowsData);
}

// Show / Hide Code Privacy Toggle
function toggleCodeVisibility() {
    isCodeVisible = !isCodeVisible;
    updateCodeDisplay();
}

function updateCodeDisplay() {
    const codeSpan = document.getElementById('session-code-display');
    const toggleBtn = document.getElementById('toggle-code-btn');
    
    if (isCodeVisible) {
        codeSpan.innerText = `Code: ${currentUserCode}`;
        toggleBtn.innerText = '🙈';
        toggleBtn.title = "Hide code";
    } else {
        codeSpan.innerText = `Code: ••••••${currentUserCode.slice(-2)}`;
        toggleBtn.innerText = '👁️';
        toggleBtn.title = "Show code";
    }
}

// Edit Profile Username
function enableEditName() {
    document.getElementById('display-user-name').classList.add('hidden');
    document.querySelector('.edit-name-btn').classList.add('hidden');
    document.getElementById('edit-name-input-container').classList.remove('hidden');
    document.getElementById('edit-user-name-input').focus();
}

function saveUserName() {
    const newName = document.getElementById('edit-user-name-input').value.trim();
    if(newName) {
        document.getElementById('display-user-name').innerText = newName;
        updateUserField('username', newName);
    }
    document.getElementById('edit-name-input-container').classList.add('hidden');
    document.getElementById('display-user-name').classList.remove('hidden');
    document.querySelector('.edit-name-btn').classList.remove('hidden');
}

function handleNameKeypress(event) {
    if (event.key === 'Enter') {
        saveUserName();
    }
}

// Real-time Save Driver & Dispatcher names
function saveStaffData() {
    const driver = document.getElementById('driver-name-input').value;
    const dispatcher = document.getElementById('dispatcher-name-input').value;

    if (useFirebase) {
        database.ref('users/' + currentUserCode).update({
            driverName: driver,
            dispatcherName: dispatcher
        });
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        users[currentUserCode].driverName = driver;
        users[currentUserCode].dispatcherName = dispatcher;
        localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
    }
}

// Render dynamic rows
function renderRows(rowsData) {
    const container = document.getElementById('rows-container');
    container.innerHTML = '';

    rowsData.forEach((row, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'list-item';
        const hasFile = (row.archivo && row.archivo !== "") ? true : false;

        rowDiv.innerHTML = `
            <div>
                <input type="text" value="${row.nombre || ''}" onchange="updateRowData(${index}, 'nombre', this.value)" placeholder="Name">
            </div>
            <div>
                <input type="number" value="${row.carga || ''}" onchange="updateRowData(${index}, 'carga', this.value)" placeholder="Load Value ($)">
            </div>
            <div>
                <input type="date" value="${row.fechaEntrega || ''}" onchange="updateRowData(${index}, 'fechaEntrega', this.value)">
            </div>
            <div>
                <input type="date" value="${row.fechaRecibido || ''}" onchange="updateRowData(${index}, 'fechaRecibido', this.value)">
            </div>
            <div class="status-container">
                <span id="status-text-${index}" class="status-label ${row.activo ? 'status-delivered' : 'status-not-delivered'}">
                    ${row.activo ? 'Delivered' : 'Not Delivered'}
                </span>
                <label class="switch">
                    <input type="checkbox" ${row.activo ? 'checked' : ''} onchange="toggleRowActive(${index}, this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
            <div class="file-cell">
                <input type="file" id="row-file-${index}" style="display:none;" onchange="uploadRowFile(${index}, event)">
                <label for="row-file-${index}" class="btn-file-upload" title="Upload Document / Image">
                    📂
                </label>
                <div id="file-view-container-${index}">
                    ${hasFile ? `<button onclick="viewRowFile(${index})" class="btn-file-view" title="View: ${row.archivoNombre}">👁️</button>` : ''}
                </div>
            </div>
        `;
        container.appendChild(rowDiv);
    });
}

// Update specific table cell value
function updateRowData(index, key, value) {
    if (useFirebase) {
        database.ref('users/' + currentUserCode + '/rowsData/' + index + '/' + key).set(value);
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        users[currentUserCode].rowsData[index][key] = value;
        localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
    }
}

// Handle switch active toggling
function toggleRowActive(index, isChecked) {
    if (useFirebase) {
        database.ref('users/' + currentUserCode + '/rowsData/' + index + '/activo').set(isChecked);
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        users[currentUserCode].rowsData[index].activo = isChecked;
        localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
        
        const statusText = document.getElementById(`status-text-${index}`);
        if (isChecked) {
            statusText.innerText = 'Delivered';
            statusText.className = 'status-label status-delivered';
        } else {
            statusText.innerText = 'Not Delivered';
            statusText.className = 'status-label status-not-delivered';
        }
    }
}

// File uploading helper
function uploadRowFile(index, event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 800000) { // Limit to 800KB for offline database performance
            alert("The file is too large. Please upload a file smaller than 800KB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const base64File = e.target.result;
            
            if (useFirebase) {
                database.ref('users/' + currentUserCode + '/rowsData/' + index).update({
                    archivo: base64File,
                    archivoNombre: file.name,
                    archivoTipo: file.type
                }).then(() => {
                    alert(`File "${file.name}" successfully uploaded and synced!`);
                });
            } else {
                let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
                users[currentUserCode].rowsData[index].archivo = base64File;
                users[currentUserCode].rowsData[index].archivoNombre = file.name;
                users[currentUserCode].rowsData[index].archivoTipo = file.type;
                localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
                
                const viewContainer = document.getElementById(`file-view-container-${index}`);
                viewContainer.innerHTML = `<button onclick="viewRowFile(${index})" class="btn-file-view" title="View: ${file.name}">👁️</button>`;
                alert(`File "${file.name}" uploaded locally!`);
            }
        };
        reader.readAsDataURL(file);
    }
}

// View linked document
function viewRowFile(index) {
    let row;
    if (useFirebase) {
        row = currentRowsData[index];
    } else {
        const users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        row = users[currentUserCode].rowsData[index];
    }

    if (!row || !row.archivo) {
        alert("No file uploaded for this row.");
        return;
    }

    const fileData = row.archivo;
    const fileType = row.archivoTipo || 'image/png';
    const fileName = row.archivoNombre || 'document';

    const newTab = window.open();
    if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        newTab.document.write(`
            <html>
            <head>
                <title>QUICKGOXPRESS - Preview: ${fileName}</title>
                <style>
                    body { margin: 0; background: #202020; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; color: white; }
                    img, embed { max-width: 95%; max-height: 95vh; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
                    .preview-nav { position: absolute; top: 15px; right: 15px; }
                    .btn-download { background: #28a745; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="preview-nav">
                    <a href="${fileData}" download="${fileName}" class="btn-download">💾 Download File</a>
                </div>
                ${fileType === 'application/pdf' 
                    ? `<embed src="${fileData}" type="application/pdf" width="100%" height="100%">` 
                    : `<img src="${fileData}" alt="preview">`
                }
            </body>
            </html>
        `);
    } else {
        const link = document.createElement('a');
        link.href = fileData;
        link.download = fileName;
        link.click();
        newTab.close();
    }
}

// Change Profile Avatar image
function changeAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Img = e.target.result;
            document.getElementById('user-avatar').src = base64Img;
            updateUserField('avatar', base64Img);
        };
        reader.readAsDataURL(file);
    }
}

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('hidden');
}

// Toggle Theme Modes (Light / Dark)
function setTheme(theme, updateDb = true) {
    const dashboard = document.getElementById('main-dashboard');
    if (theme === 'dark') {
        dashboard.classList.add('dark-mode');
    } else {
        dashboard.classList.remove('dark-mode');
    }

    if(updateDb && currentUserCode) {
        updateUserField('theme', theme);
    }
}

// Screen capture and secure sharing
function shareDashboard() {
    const dashboard = document.getElementById('main-dashboard');
    const settingsPanel = document.getElementById('settings-panel');

    settingsPanel.classList.add('hidden');
    document.body.classList.add('screenshot-mode');

    setTimeout(() => {
        html2canvas(dashboard, {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            backgroundColor: null
        }).then(canvas => {
            document.body.classList.remove('screenshot-mode');
            settingsPanel.classList.remove('hidden');

            canvas.toBlob(blob => {
                if (!blob) {
                    alert("Error generating screenshot");
                    return;
                }

                const file = new File([blob], `quickgoxpress.png`, { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({
                        files: [file],
                        title: 'QUICKGOXPRESS Dashboard',
                        text: `Check out my customized QUICKGOXPRESS load board!`
                    }).catch(error => {
                        console.log("Sharing cancelled: ", error);
                        downloadFallback(canvas);
                    });
                } else {
                    downloadFallback(canvas);
                }
            }, 'image/png');

        }).catch(err => {
            console.error("Capture error:", err);
            document.body.classList.remove('screenshot-mode');
            settingsPanel.classList.remove('hidden');
            alert("Could not process the capture.");
        });
    }, 150);
}

function downloadFallback(canvas) {
    const link = document.createElement('a');
    link.download = `QUICKGOXPRESS-Board.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    alert("Image downloaded securely!");
}

// Log Out Session
function logout() {
    if (useFirebase && currentUserCode) {
        database.ref('users/' + currentUserCode).off();
    }
    localStorage.removeItem('quickgo_current_session');
    currentUserCode = null;
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    backToAuth();
    document.getElementById('login-code').value = '';
    document.getElementById('generated-code-display').innerHTML = '';
}

// Offline/Online universal update helper
function updateUserField(field, value) {
    if (useFirebase) {
        database.ref('users/' + currentUserCode + '/' + field).set(value);
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[currentUserCode]) {
            users[currentUserCode][field] = value;
            localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
        }
    }
}

// Auto-login on reload if active session exists
window.onload = function() {
    const savedSession = localStorage.getItem('quickgo_current_session');
    if (savedSession) {
        currentUserCode = savedSession;
        loadDashboard();
    }
};
