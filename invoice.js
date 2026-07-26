/*
  ===================================================================================
  PROPIEDAD INTELECTUAL Y DERECHOS DE AUTOR RESERVADOS
  -----------------------------------------------------------------------------------
  AUTOR: Raul Hernandez
  SISTEMA: QUICKGOXPRESS - Plataforma de Gestión y Supervisión Logística
  ===================================================================================
*/

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
            nombre: `Persona ${i + 1}`,
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

    loadObserverDashboard();
}

function loadObserverDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('observer-dashboard').classList.remove('hidden');

    document.getElementById('observer-avatar').src = DEFAULT_AVATAR;
    updateObserverCodeDisplay();

    // Cargar Nombre y Lista de Cuentas Monitoreadas desde la Base de Datos
    if (useFirebase) {
        database.ref('observers/' + currentObserverCode).on('value', (snapshot) => {
            const obsData = snapshot.val() || {};
            document.getElementById('display-observer-name').innerText = obsData.name || "Supervisor";
            
            let tracked = obsData.tracked || [];
            if (!Array.isArray(tracked)) tracked = Object.values(tracked);
            observerTrackedCodes = tracked;

            renderObserverGrid();
        });
    } else {
        const savedName = localStorage.getItem(`quickgo_observer_name_${currentObserverCode}`);
        document.getElementById('display-observer-name').innerText = savedName || "Supervisor";

        const savedTracked = localStorage.getItem(`quickgo_observer_tracked_${currentObserverCode}`);
        observerTrackedCodes = savedTracked ? JSON.parse(savedTracked) : [];
        renderObserverGrid();
    }
}

// --- CAMBIAR EL NOMBRE DEL SUPERVISOR (LÁPIZ ✏️) ---

function enableEditObserverName() {
    const container = document.getElementById('edit-observer-name-container');
    const input = document.getElementById('edit-observer-name-input');
    const currentName = document.getElementById('display-observer-name').innerText;

    input.value = currentName;
    container.classList.remove('hidden');
    input.focus();
}

function saveObserverName() {
    const newName = document.getElementById('edit-observer-name-input').value.trim();
    if (!newName) return;

    document.getElementById('display-observer-name').innerText = newName;

    if (useFirebase) {
        database.ref('observers/' + currentObserverCode).update({ name: newName });
    } else {
        localStorage.setItem(`quickgo_observer_name_${currentObserverCode}`, newName);
    }

    document.getElementById('edit-observer-name-container').classList.add('hidden');
}

function handleObserverNameKeypress(event) {
    if (event.key === 'Enter') {
        saveObserverName();
    }
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
    if (!useFirebase) renderObserverGrid();
}

function saveObserverTrackedCodes() {
    if (useFirebase) {
        database.ref('observers/' + currentObserverCode).update({
            tracked: observerTrackedCodes
        });
    } else {
        localStorage.setItem(`quickgo_observer_tracked_${currentObserverCode}`, JSON.stringify(observerTrackedCodes));
    }
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

// RENDERIZADO DE LA TABLA DETALLADA (IGUAL A LA FOTO)
function updateObserverCardUI(code, userData) {
    const nameEl = document.getElementById(`obs-name-${code}`);
    const bodyEl = document.getElementById(`obs-body-${code}`);

    if (!nameEl || !bodyEl || !userData) return;

    nameEl.innerText = userData.username || `User ${code}`;

    const rows = userData.rowsData || Array(12).fill(null).map((_, i) => ({
        id: i + 1,
        nombre: `Persona ${i + 1}`,
        carga: '',
        fechaEntrega: '',
        fechaRecibido: '',
        activo: false,
        archivo: ''
    }));

    let rowsHtml = '';
    rows.forEach((r) => {
        const fechaE = r.fechaEntrega ? r.fechaEntrega.split('-').reverse().join('-') : '-';
        const fechaR = r.fechaRecibido ? r.fechaRecibido.split('-').reverse().join('-') : '-';
        const adjuntoBtn = r.archivo 
            ? `<button onclick="window.open('${r.archivo}')" class="btn-small" style="font-size:0.65rem; padding:2px 4px; background:#00d2ff; color:#000;">📄 Ver documento</button>` 
            : `<span style="color:#ff9999; font-size:0.75rem;">❌ Sin adjunto</span>`;

        rowsHtml += `
            <div style="display: grid; grid-template-columns: 1.2fr 0.8fr 1fr 1fr 1fr 1.1fr; gap: 4px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center; font-size: 0.75rem; text-align: center;">
                <span style="text-align: left; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.nombre || '-'}</span>
                <span>${r.carga ? r.carga : '-'}</span>
                <span>${fechaE}</span>
                <span>${fechaR}</span>
                <div>
                    <span class="status-label ${r.activo ? 'status-delivered' : 'status-not-delivered'}" style="font-size: 0.65rem; padding: 2px 4px;">
                        ${r.activo ? 'Realizado' : 'Pendiente'}
                    </span>
                </div>
                <div>${adjuntoBtn}</div>
            </div>
        `;
    });

    bodyEl.innerHTML = `
        <div style="font-size:0.85rem; margin-bottom: 12px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <span><strong>Conductor:</strong> ${userData.driverName || 'N/A'}</span>
            <span><strong>Despachador:</strong> ${userData.dispatcherName || 'No disponible'}</span>
        </div>
        <div style="font-size:0.8rem; color:#00d2ff; margin-bottom: 10px; font-weight: bold;">
            Inicio Observación: Hace 0 min.
        </div>
        <div style="background: rgba(0,0,0,0.2); border-radius: 6px; padding: 6px; border: 1px solid var(--border-color);">
            <div style="display: grid; grid-template-columns: 1.2fr 0.8fr 1fr 1fr 1fr 1.1fr; gap: 4px; font-weight: bold; font-size: 0.7rem; color: #00d2ff; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; text-align: center;">
                <span style="text-align: left;">Nombre</span>
                <span>Carga</span>
                <span>F. Entrega</span>
                <span>F. Recibido</span>
                <span>Estado</span>
                <span>Adjunto</span>
            </div>
            <div style="max-height: 220px; overflow-y: auto;">
                ${rowsHtml}
            </div>
        </div>
    `;
}

// --- CARGA Y MANEJO DE USUARIOS REGULARES ---

function loadDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('observer-dashboard').classList.add('hidden');
    document.getElementById('main-dashboard').classList.remove('hidden');

    if (useFirebase) {
        database.ref('users/' + currentUserCode).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) renderUserData(data);
        });
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[currentUserCode]) {
            renderUserData(users[currentUserCode]);
        }
    }
}

function renderUserData(data) {
    document.getElementById('display-user-name').innerText = data.username || 'Username';
    document.getElementById('user-avatar').src = data.avatar || DEFAULT_AVATAR;
    document.getElementById('driver-name-input').value = data.driverName || '';
    document.getElementById('dispatcher-name-input').value = data.dispatcherName || '';

    currentRowsData = data.rowsData || [];
    renderRowsTable();
    updateCodeDisplay();
    renderNotifications(data.notifications || []);
    setTheme(data.theme || 'dark');
}

function renderRowsTable() {
    const container = document.getElementById('rows-container');
    if (!container) return;

    container.innerHTML = '';

    currentRowsData.forEach((row, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'list-item';

        rowDiv.innerHTML = `
            <div><input type="text" value="${row.nombre}" onchange="updateRowData(${index}, 'nombre', this.value)"></div>
            <div><input type="number" value="${row.carga}" placeholder="0.00" onchange="updateRowData(${index}, 'carga', this.value)"></div>
            <div><input type="date" value="${row.fechaEntrega}" onchange="updateRowData(${index}, 'fechaEntrega', this.value)"></div>
            <div><input type="date" value="${row.fechaRecibido}" onchange="updateRowData(${index}, 'fechaRecibido', this.value)"></div>
            <div>
                <span onclick="toggleRowStatus(${index})" class="status-label ${row.activo ? 'status-delivered' : 'status-not-delivered'}">
                    ${row.activo ? 'Delivered' : 'Pending'}
                </span>
            </div>
            <div>
                <input type="file" id="file-${index}" style="display:none;" onchange="handleFileUpload(event, ${index})">
                <button onclick="document.getElementById('file-${index}').click()" class="btn-small">
                    ${row.archivo ? '📎 View' : '📁 Add'}
                </button>
            </div>
        `;
        container.appendChild(rowDiv);
    });
}

function updateRowData(index, field, value) {
    currentRowsData[index][field] = value;
    saveDataToStorage();
}

function toggleRowStatus(index) {
    currentRowsData[index].activo = !currentRowsData[index].activo;
    renderRowsTable();
    saveDataToStorage();
}

function handleFileUpload(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        currentRowsData[index].archivo = e.target.result;
        currentRowsData[index].archivoNombre = file.name;
        currentRowsData[index].archivoTipo = file.type;
        renderRowsTable();
        saveDataToStorage();
    };
    reader.readAsDataURL(file);
}

function saveStaffData() {
    const driverName = document.getElementById('driver-name-input').value;
    const dispatcherName = document.getElementById('dispatcher-name-input').value;

    if (useFirebase) {
        database.ref('users/' + currentUserCode).update({
            driverName: driverName,
            dispatcherName: dispatcherName
        });
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[currentUserCode]) {
            users[currentUserCode].driverName = driverName;
            users[currentUserCode].dispatcherName = dispatcherName;
            localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
        }
    }
}

function saveDataToStorage() {
    if (useFirebase) {
        database.ref('users/' + currentUserCode + '/rowsData').set(currentRowsData);
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[currentUserCode]) {
            users[currentUserCode].rowsData = currentRowsData;
            localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
        }
    }
}

// --- UTILIDADES, EDICIÓN Y AJUSTES ---

function enableEditName() {
    document.getElementById('edit-name-input-container').classList.remove('hidden');
    document.getElementById('edit-user-name-input').value = document.getElementById('display-user-name').innerText;
}

function saveUserName() {
    const newName = document.getElementById('edit-user-name-input').value.trim();
    if (!newName) return;

    if (useFirebase) {
        database.ref('users/' + currentUserCode).update({ username: newName });
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[currentUserCode]) {
            users[currentUserCode].username = newName;
            localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
        }
    }
    document.getElementById('edit-name-input-container').classList.add('hidden');
}

function handleNameKeypress(e) {
    if (e.key === 'Enter') saveUserName();
}

function toggleCodeVisibility() {
    isCodeVisible = !isCodeVisible;
    updateCodeDisplay();
}

function updateCodeDisplay() {
    const el = document.getElementById('session-code-display');
    if (el) {
        el.innerText = isCodeVisible ? `Code: ${currentUserCode}` : 'Code: ••••••••';
    }
}

function toggleObserverCodeVisibility() {
    isObserverCodeVisible = !isObserverCodeVisible;
    updateObserverCodeDisplay();
}

function updateObserverCodeDisplay() {
    const el = document.getElementById('observer-code-display');
    if (el) {
        el.innerText = isObserverCodeVisible ? `Code: ${currentObserverCode}` : 'Code: ••••••••';
    }
}

function changeAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64 = e.target.result;
        if (useFirebase) {
            database.ref('users/' + currentUserCode).update({ avatar: base64 });
        } else {
            let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
            if (users[currentUserCode]) {
                users[currentUserCode].avatar = base64;
                localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
            }
        }
    };
    reader.readAsDataURL(file);
}

function changeObserverAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('observer-avatar').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function setTheme(theme) {
    currentTheme = theme;
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

function toggleNotifications() {
    document.getElementById('notifications-panel').classList.toggle('hidden');
}

function toggleSettings() {
    document.getElementById('settings-panel').classList.toggle('hidden');
}

function renderNotifications(notifs) {
    const list = document.getElementById('notifications-list');
    const badge = document.getElementById('notif-badge');
    if (!list) return;

    list.innerHTML = '';
    const notifArray = Array.isArray(notifs) ? notifs : Object.values(notifs || {});

    if (notifArray.length === 0) {
        list.innerHTML = `<p class="empty-notif">No notifications yet.</p>`;
        badge.classList.add('hidden');
        return;
    }

    badge.innerText = notifArray.length;
    badge.classList.remove('hidden');

    notifArray.reverse().forEach((n) => {
        const card = document.createElement('div');
        card.className = 'notif-card';
        card.innerHTML = `
            <span class="notif-msg">${n.message}</span>
            <span class="notif-time">${n.date} - ${n.time}</span>
        `;
        list.appendChild(card);
    });
}

function clearNotifications() {
    if (useFirebase) {
        database.ref('users/' + currentUserCode + '/notifications').remove();
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[currentUserCode]) {
            users[currentUserCode].notifications = [];
            localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
        }
    }
}

function shareDashboard() {
    const element = document.body;
    html2canvas(element).then((canvas) => {
        const link = document.createElement('a');
        link.download = `QuickGoXpress-Capture-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

function logout() {
    currentUserCode = null;
    currentObserverCode = null;
    localStorage.removeItem('quickgo_current_session');
    localStorage.removeItem('quickgo_is_observer');

    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('observer-dashboard').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    backToAuth();
}

// Auto-login al recargar si hay una sesión activa guardada
window.addEventListener('DOMContentLoaded', () => {
    const savedSession = localStorage.getItem('quickgo_current_session');
    const isObserver = localStorage.getItem('quickgo_is_observer') === 'true';

    if (savedSession) {
        if (isObserver) {
            currentObserverCode = savedSession;
            isObserverMode = true;
            loadObserverDashboard();
        } else {
            currentUserCode = savedSession;
            isObserverMode = false;
            loadDashboard();
        }
    }
});
