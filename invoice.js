const firebaseConfig = {
    apiKey: "AIzaSyCUSWo4LfsMHqUZGcZjYyI09rH75bi-m68",
    authDomain: "quickgoxpress.firebaseapp.com",
    databaseURL: "https://quickgoxpress-default-rtdb.firebaseio.com",
    projectId: "quickgoxpress",
    storageBucket: "quickgoxpress.firebasestorage.app",
    messagingSenderId: "620781894145",
    appId: "1:620781894145:web:ce9aa6d6cf1f3c2b295e00"
};

let database = null;
let useFirebase = false;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && !firebaseConfig.apiKey.includes("TU_API_KEY")) {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        useFirebase = true;
    } catch (e) {
        console.warn("Firebase initialization failed, switching to offline mode:", e);
    }
}

let currentUserCode = null;
let isCodeVisible = false;
let currentRowsData = [];
let currentTheme = 'dark';

let isObserverMode = false;
let currentObserverCode = null;
let isObserverCodeVisible = false;
let observerTrackedCodes = [];

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23a0aec0'><circle cx='50' cy='50' r='48' fill='%23e2e8f0'/><circle cx='50' cy='38' r='18'/><path d='M50 62c-18 0-32 8-32 20h64c0-12-14-20-32-20z'/></svg>";

// --- NAVEGACIÓN Y PANTALLAS DE AUTENTICACIÓN ---

function showRegister() {
    document.getElementById('auth-options').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('auth-options').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

function showObserverAuth() {
    document.getElementById('auth-options').classList.add('hidden');
    document.getElementById('observer-form').classList.remove('hidden');
}

function backToAuth() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.add('hidden');
    if (document.getElementById('observer-form')) {
        document.getElementById('observer-form').classList.add('hidden');
    }
    document.getElementById('auth-options').classList.remove('hidden');
}

// --- CREACIÓN DE CUENTA E INICIO DE SESIÓN ---

function generateCode() {
    const randomCode = Math.floor(10000000 + Math.random() * 90000000).toString();

    const newUser = {
        username: 'Username',
        driverName: '',
        dispatcherName: '',
        avatar: DEFAULT_AVATAR,
        theme: 'dark',
        notifications: [],
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
        database.ref('users/' + randomCode).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                generateCode();
            } else {
                database.ref('users/' + randomCode).set(newUser).then(() => {
                    displayGeneratedCode(randomCode);
                });
            }
        }).catch(() => {
            alert("Error writing to cloud database.");
        });
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[randomCode]) {
            generateCode();
        } else {
            users[randomCode] = newUser;
            localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
            displayGeneratedCode(randomCode);
        }
    }
}

function displayGeneratedCode(code) {
    document.getElementById('generated-code-display').innerHTML = `
        Your Access Code: <br><span style="font-size: 1.8rem; color: #00d2ff; font-weight: bold;">${code}</span><br>
        <small style="color:#94a3b8;">Save it to log in next time.</small>
    `;
}

function login() {
    const codeInput = document.getElementById('login-code').value.trim();

    if (codeInput.length !== 8 || isNaN(codeInput)) {
        alert("Please enter a valid 8-digit numeric code.");
        return;
    }

    if (useFirebase) {
        database.ref('users/' + codeInput).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                currentUserCode = codeInput;
                isObserverMode = false;
                localStorage.setItem('quickgo_current_session', currentUserCode);
                localStorage.setItem('quickgo_is_observer', 'false');
                loadDashboard();
            } else {
                alert("This code does not exist in database.");
            }
        }).catch(() => {
            alert("Connection error. Please try again.");
        });
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[codeInput]) {
            currentUserCode = codeInput;
            isObserverMode = false;
            localStorage.setItem('quickgo_current_session', currentUserCode);
            localStorage.setItem('quickgo_is_observer', 'false');
            loadDashboard();
        } else {
            alert("This code does not exist offline.");
        }
    }
}

// --- MODO OBSERVADOR / SUPERVISOR ---

function loginAsObserver() {
    const codeInput = document.getElementById('observer-code-input').value.trim();

    if (codeInput !== "SUPERVISOR123" && (codeInput.length !== 8 || isNaN(codeInput))) {
        alert("Please enter a valid supervisor code (e.g. SUPERVISOR123 or an 8-digit code).");
        return;
    }

    currentObserverCode = codeInput;
    isObserverMode = true;
    localStorage.setItem('quickgo_current_session', currentObserverCode);
    localStorage.setItem('quickgo_is_observer', 'true');

    const savedTracked = localStorage.getItem(`quickgo_observer_tracked_${currentObserverCode}`);
    observerTrackedCodes = savedTracked ? JSON.parse(savedTracked) : [];

    loadObserverDashboard();
}

function loadObserverDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('observer-dashboard').classList.remove('hidden');

    document.getElementById('display-observer-name').innerText = "Supervisor";
    document.getElementById('observer-avatar').src = DEFAULT_AVATAR;

    updateObserverCodeDisplay();
    renderObserverGrid();
}

function addAccountToObserver() {
    const targetCode = document.getElementById('add-target-code-input').value.trim();

    if (targetCode.length !== 8 || isNaN(targetCode)) {
        alert("Please enter a valid 8-digit user code.");
        return;
    }

    if (observerTrackedCodes.length >= 8) {
        alert("Maximum limit of 8 monitored accounts reached.");
        return;
    }

    if (observerTrackedCodes.includes(targetCode)) {
        alert("This account is already being monitored.");
        return;
    }

    if (useFirebase) {
        database.ref('users/' + targetCode).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                observerTrackedCodes.push(targetCode);
                saveObserverTrackedCodes();
                document.getElementById('add-target-code-input').value = '';
                notifyUserAboutObserver(targetCode);
                renderObserverGrid();
            } else {
                alert("Account not found in database.");
            }
        });
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[targetCode]) {
            observerTrackedCodes.push(targetCode);
            saveObserverTrackedCodes();
            document.getElementById('add-target-code-input').value = '';
            notifyUserAboutObserver(targetCode);
            renderObserverGrid();
        } else {
            alert("Account not found offline.");
        }
    }
}

// NOTIFICACIÓN AUTOMÁTICA AL USUARIO OBSERVADO
function notifyUserAboutObserver(targetCode) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toISOString().split('T')[0];

    const newNotification = {
        message: `El Observador (Código: ${currentObserverCode || 'Supervisor'}) ha abierto y revisado tu cuenta.`,
        date: dateString,
        time: timeString,
        timestamp: now.getTime()
    };

    if (useFirebase) {
        database.ref('users/' + targetCode + '/notifications').once('value').then((snapshot) => {
            let notifs = snapshot.val() || [];
            if (!Array.isArray(notifs)) notifs = Object.values(notifs);
            notifs.push(newNotification);
            database.ref('users/' + targetCode + '/notifications').set(notifs);
            database.ref('users/' + targetCode + '/observerSessionStart').set(now.getTime());
        });
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[targetCode]) {
            if (!users[targetCode].notifications) users[targetCode].notifications = [];
            users[targetCode].notifications.push(newNotification);
            users[targetCode].observerSessionStart = now.getTime();
            localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
        }
    }
}

function removeAccountFromObserver(code) {
    observerTrackedCodes = observerTrackedCodes.filter(c => c !== code);
    saveObserverTrackedCodes();
    renderObserverGrid();
}

function saveObserverTrackedCodes() {
    localStorage.setItem(`quickgo_observer_tracked_${currentObserverCode}`, JSON.stringify(observerTrackedCodes));
}

function renderObserverGrid() {
    const gridContainer = document.getElementById('observer-grid-container');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    if (observerTrackedCodes.length === 0) {
        gridContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No accounts added yet. Enter an 8-digit user code above to supervise.</p>`;
        return;
    }

    observerTrackedCodes.forEach((code) => {
        notifyUserAboutObserver(code);

        const card = document.createElement('div');
        card.className = 'card-effect observer-account-section';
        card.style.marginBottom = '25px';
        card.id = `obs-card-${code}`;

        card.innerHTML = `
            <div class="observer-card-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 15px;">
                <div>
                    <h3 id="obs-name-${code}" style="margin: 0; font-size: 1.2rem;">Loading...</h3>
                    <small style="color: var(--text-muted);">Código: ${code}</small>
                </div>
                <button onclick="removeAccountFromObserver('${code}')" class="btn-small-text" style="color: var(--primary-red); cursor: pointer;">❌ Eliminar</button>
            </div>
            <div class="observer-card-body" id="obs-body-${code}">
                <p style="color: var(--text-muted);">Cargando datos detallados...</p>
            </div>
        `;
        gridContainer.appendChild(card);

        if (useFirebase) {
            database.ref('users/' + code).on('value', (snapshot) => {
                const userData = snapshot.val();
                updateObserverCardUI(code, userData);
            });
        } else {
            let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
            updateObserverCardUI(code, users[code]);
        }
    });
}

function updateObserverCardUI(code, data) {
    const nameElem = document.getElementById(`obs-name-${code}`);
    const bodyElem = document.getElementById(`obs-body-${code}`);

    if (!nameElem || !bodyElem) return;

    if (!data) {
        nameElem.innerText = "Usuario no encontrado";
        bodyElem.innerHTML = `<p style="color: var(--primary-red);">No hay datos activos para esta cuenta.</p>`;
        return;
    }

    nameElem.innerText = data.username || 'Usuario Sin Nombre';

    let timeActiveText = "Iniciada recientemente";
    if (data.observerSessionStart) {
        const diffMs = Date.now() - data.observerSessionStart;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = (diffMinutes / 60).toFixed(1);

        if (diffMinutes < 60) {
            timeActiveText = `Hace ${diffMinutes} min.`;
        } else {
            timeActiveText = `Hace ${diffHours} horas`;
        }
    }

    const rows = data.rowsData || [];

    let rowsHTML = '';
    rows.forEach((row, index) => {
        const isCompleted = row.activo;
        const statusClass = isCompleted ? 'status-delivered' : 'status-not-delivered';
        const statusText = isCompleted ? 'Realizado' : 'Pending';

        let archivoHTML = '<span style="color: #64748b; font-size: 0.8rem;">❌ Sin adjunto</span>';
        if (row.archivo) {
            archivoHTML = `
                <a href="${row.archivo}" download="${row.archivoNombre || 'adjunto'}" 
                   style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(0, 210, 255, 0.15); border: 1px solid #00d2ff; color: #00d2ff; border-radius: 6px; text-decoration: none; font-size: 0.8rem; font-weight: bold;">
                    📑 Ver Documento
                </a>`;
        }

        rowsHTML += `
            <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 1.2fr; gap: 8px; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center; font-size: 0.85rem;">
                <div><strong>${row.nombre || `Persona ${index + 1}`}</strong></div>
                <div>${row.carga || '<span style="color:#64748b;">-</span>'}</div>
                <div>${row.fechaEntrega || '<span style="color:#64748b;">-</span>'}</div>
                <div>${row.fechaRecibido || '<span style="color:#64748b;">-</span>'}</div>
                <div><span class="status-label ${statusClass}" style="display:inline-block; padding: 2px 8px; font-size: 0.75rem;">${statusText}</span></div>
                <div>${archivoHTML}</div>
            </div>
        `;
    });

    bodyElem.innerHTML = `
        <div style="display: flex; gap: 20px; font-size: 0.9rem; margin-bottom: 12px; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 6px; flex-wrap: wrap;">
            <span><strong>Driver:</strong> ${data.driverName || 'N/A'}</span>
            <span><strong>Dispatcher:</strong> ${data.dispatcherName || 'N/A'}</span>
            <span style="color: #00d2ff;"><strong>Inicio Observación:</strong> ${timeActiveText}</span>
        </div>
        
        <div style="margin-top: 10px;">
            <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 1.2fr; gap: 8px; padding: 6px 8px; background: rgba(255,255,255,0.08); font-weight: bold; font-size: 0.8rem; border-radius: 4px;">
                <div>Nombre</div>
                <div>Carga</div>
                <div>F. Entrega</div>
                <div>F. Recibido</div>
                <div>Status</div>
                <div>Adjunto</div>
            </div>
            <div style="max-height: 300px; overflow-y: auto;">
                ${rowsHTML}
            </div>
        </div>
    `;
}

function toggleObserverCodeVisibility() {
    isObserverCodeVisible = !isObserverCodeVisible;
    updateObserverCodeDisplay();
}

function updateObserverCodeDisplay() {
    const codeSpan = document.getElementById('observer-code-display');
    const toggleBtn = document.getElementById('toggle-observer-code-btn');
    if (!codeSpan) return;

    if (isObserverCodeVisible) {
        codeSpan.innerText = `Code: ${currentObserverCode}`;
        toggleBtn.innerText = '🙈';
    } else {
        codeSpan.innerText = `Code: ••••••••`;
        toggleBtn.innerText = '👁️';
    }
}

// --- PANEL PRINCIPAL DE USUARIO ---

function loadDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('observer-dashboard').classList.add('hidden');
    document.getElementById('main-dashboard').classList.remove('hidden');

    if (useFirebase) {
        database.ref('users/' + currentUserCode).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                applyUserData(data);
            }
        });
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        const data = users[currentUserCode];
        if (data) {
            applyUserData(data);
        }
    }
}

function applyUserData(data) {
    document.getElementById('display-user-name').innerText = data.username || 'Username';
    document.getElementById('edit-user-name-input').value = data.username || 'Username';
    document.getElementById('user-avatar').src = data.avatar || DEFAULT_AVATAR;
    document.getElementById('driver-name-input').value = data.driverName || '';
    document.getElementById('dispatcher-name-input').value = data.dispatcherName || '';
    
    currentRowsData = data.rowsData || [];
    renderRows(currentRowsData);

    if (data.theme) {
        setTheme(data.theme, false);
    }

    renderNotifications(data.notifications);
    updateCodeDisplay();
}

// RENDERIZADO DE FILAS CON STATUS INTERACTIVO Y BOTÓN DE ADJUNTO ELEGANTE
function renderRows(rows) {
    const container = document.getElementById('rows-container');
    if (!container) return;
    container.innerHTML = '';

    rows.forEach((row, index) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        
        const isCompleted = row.activo;
        const statusClass = isCompleted ? 'status-delivered' : 'status-not-delivered';
        const statusText = isCompleted ? 'Realizado' : 'Pending';

        const hasFile = row.archivo ? true : false;
        const fileLabel = hasFile ? `✅ ${row.archivoNombre || 'Guardado'}` : '📁 Adjuntar';
        const fileStyle = hasFile 
            ? 'background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #10b981;' 
            : 'background: rgba(255, 255, 255, 0.08); border: 1px dashed rgba(255,255,255,0.3); color: #94a3b8;';

        item.innerHTML = `
            <div><input type="text" value="${row.nombre || ''}" onchange="updateRowData(${index}, 'nombre', this.value)"></div>
            <div><input type="text" value="${row.carga || ''}" onchange="updateRowData(${index}, 'carga', this.value)"></div>
            <div><input type="date" value="${row.fechaEntrega || ''}" onchange="updateRowData(${index}, 'fechaEntrega', this.value)"></div>
            <div><input type="date" value="${row.fechaRecibido || ''}" onchange="updateRowData(${index}, 'fechaRecibido', this.value)"></div>
            <div>
                <span class="status-label ${statusClass}" 
                      onclick="toggleRowStatus(${index})" 
                      style="cursor: pointer; user-select: none;">
                    ${statusText}
                </span>
            </div>
            <div>
                <label style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease; ${fileStyle}">
                    <span>${fileLabel}</span>
                    <input type="file" style="display: none;" onchange="handleFileUpload(event, ${index})">
                </label>
            </div>
        `;
        container.appendChild(item);
    });
}

function toggleRowStatus(index) {
    const currentStatus = currentRowsData[index].activo || false;
    const newStatus = !currentStatus;
    
    currentRowsData[index].activo = newStatus;

    if (newStatus && !currentRowsData[index].fechaRecibido) {
        const today = new Date().toISOString().split('T')[0];
        currentRowsData[index].fechaRecibido = today;
    }

    saveUserData('rowsData', currentRowsData);
    renderRows(currentRowsData);
}

function updateRowData(index, key, value) {
    currentRowsData[index][key] = value;
    saveUserData('rowsData', currentRowsData);
}

function handleFileUpload(event, index) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentRowsData[index].archivo = e.target.result;
            currentRowsData[index].archivoNombre = file.name;
            currentRowsData[index].archivoTipo = file.type;
            saveUserData('rowsData', currentRowsData);
            renderRows(currentRowsData);
        };
        reader.readAsDataURL(file);
    }
}

function saveStaffData() {
    const driverName = document.getElementById('driver-name-input').value;
    const dispatcherName = document.getElementById('dispatcher-name-input').value;
    saveUserData('driverName', driverName);
    saveUserData('dispatcherName', dispatcherName);
}

function enableEditName() {
    document.getElementById('display-user-name').classList.add('hidden');
    document.querySelector('.edit-name-btn').classList.add('hidden');
    document.getElementById('edit-name-input-container').classList.remove('hidden');
    document.getElementById('edit-user-name-input').focus();
}

function saveUserName() {
    const newName = document.getElementById('edit-user-name-input').value.trim();
    if (newName) {
        document.getElementById('display-user-name').innerText = newName;
        saveUserData('username', newName);
    }
    document.getElementById('edit-name-input-container').classList.add('hidden');
    document.getElementById('display-user-name').classList.remove('hidden');
    document.querySelector('.edit-name-btn').classList.remove('hidden');
}

function handleNameKeypress(e) {
    if (e.key === 'Enter') saveUserName();
}

function changeAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            document.getElementById('user-avatar').src = base64;
            saveUserData('avatar', base64);
        };
        reader.readAsDataURL(file);
    }
}

function toggleCodeVisibility() {
    isCodeVisible = !isCodeVisible;
    updateCodeDisplay();
}

function updateCodeDisplay() {
    const codeSpan = document.getElementById('session-code-display');
    const toggleBtn = document.getElementById('toggle-code-btn');
    if (!codeSpan) return;

    if (isCodeVisible) {
        codeSpan.innerText = `Code: ${currentUserCode}`;
        toggleBtn.innerText = '🙈';
    } else {
        codeSpan.innerText = `Code: ••••••••`;
        toggleBtn.innerText = '👁️';
    }
}

function toggleSettings() {
    document.getElementById('settings-panel').classList.toggle('hidden');
}

function setTheme(theme, save = true) {
    currentTheme = theme;
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
    if (save && currentUserCode) {
        saveUserData('theme', theme);
    }
}

function toggleNotifications() {
    document.getElementById('notifications-panel').classList.toggle('hidden');
}

function renderNotifications(notifs) {
    const list = document.getElementById('notifications-list');
    const badge = document.getElementById('notif-badge');
    if (!list) return;

    list.innerHTML = '';
    
    let notifArray = [];
    if (notifs) {
        if (Array.isArray(notifs)) {
            notifArray = notifs;
        } else if (typeof notifs === 'object') {
            notifArray = Object.values(notifs);
        }
    }

    if (notifArray.length === 0) {
        list.innerHTML = `<p class="empty-notif">No notifications yet.</p>`;
        badge.classList.add('hidden');
        badge.innerText = '0';
        return;
    }

    badge.classList.remove('hidden');
    badge.innerText = notifArray.length;

    notifArray.slice().reverse().forEach(n => {
        const item = document.createElement('div');
        item.className = 'notif-card';
        item.innerHTML = `
            <p class="notif-msg">${n.message || ''}</p>
            <span class="notif-time">${n.date || ''} ${n.time || ''}</span>
        `;
        list.appendChild(item);
    });
}

function clearNotifications() {
    saveUserData('notifications', []);
}

function saveUserData(key, value) {
    if (!currentUserCode) return;

    if (useFirebase) {
        database.ref('users/' + currentUserCode + '/' + key).set(value);
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[currentUserCode]) {
            users[currentUserCode][key] = value;
            localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
        }
    }
}

function shareDashboard() {
    const target = isObserverMode ? document.getElementById('observer-dashboard') : document.getElementById('main-dashboard');
    html2canvas(target).then(canvas => {
        const link = document.createElement('a');
        link.download = `QUICKGOXPRESS_${currentUserCode || currentObserverCode || 'capture'}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

function logout() {
    currentUserCode = null;
    currentObserverCode = null;
    isObserverMode = false;
    localStorage.removeItem('quickgo_current_session');
    localStorage.removeItem('quickgo_is_observer');
    
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('observer-dashboard').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    backToAuth();
}
