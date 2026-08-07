/*
  ===================================================================================
  PROPIEDAD INTELECTUAL Y DERECHOS DE AUTOR RESERVADOS
  -----------------------------------------------------------------------------------
  AUTOR: Raul Hernandez
  SISTEMA: QUICKGOXPRESS - Plataforma de Gestión y Supervisión Logística
  AÑO: 2026
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
            nombre: `Person ${i + 1}`,
            carga: '',
            fechaEntrega: '',
            fechaRecibido: '',
            horaModificacion: '',
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

    if (useFirebase) {
        database.ref('observers/' + currentObserverCode + '/name').once('value').then((snapshot) => {
            const savedName = snapshot.val();
            document.getElementById('display-observer-name').innerText = savedName || "Supervisor";
        });

        database.ref('observers/' + currentObserverCode + '/trackedCodes').once('value').then((snapshot) => {
            const codes = snapshot.val();
            observerTrackedCodes = Array.isArray(codes) ? codes : Object.values(codes || {});
            updateObserverCodeDisplay();
            renderObserverGrid();
        });
    } else {
        const savedName = localStorage.getItem(`quickgo_observer_name_${currentObserverCode}`);
        document.getElementById('display-observer-name').innerText = savedName || "Supervisor";

        const savedTracked = localStorage.getItem(`quickgo_observer_tracked_${currentObserverCode}`);
        observerTrackedCodes = savedTracked ? JSON.parse(savedTracked) : [];
        updateObserverCodeDisplay();
        renderObserverGrid();
    }

    document.getElementById('observer-avatar').src = DEFAULT_AVATAR;
}

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
    if (useFirebase) {
        database.ref('observers/' + currentObserverCode + '/trackedCodes').set(observerTrackedCodes);
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

function updateObserverCardUI(code, userData) {
    const nameEl = document.getElementById(`obs-name-${code}`);
    const bodyEl = document.getElementById(`obs-body-${code}`);

    if (!nameEl || !bodyEl || !userData) return;

    nameEl.innerText = userData.username || `User ${code}`;

    let rowsHtml = '';
    const rows = userData.rowsData || [];

    rows.forEach((r, index) => {
        const timeDisplay = r.horaModificacion ? `<span style="color: var(--primary-blue); font-size: 0.75rem;">🕒 ${r.horaModificacion}</span>` : '<span style="color: var(--text-muted); font-size: 0.75rem;">--:--</span>';
        
        // Botón para ver adjunto desde el modo Observador
        const fileBtn = r.archivo 
            ? `<button onclick="viewObserverFile('${code}', ${index})" class="btn-small" style="font-size:0.75rem; padding: 2px 6px;">📄 Ver Archivo</button>`
            : '<span style="color: var(--text-muted); font-size: 0.75rem;">Sin archivo</span>';

        rowsHtml += `
            <tr style="border-bottom: 1px dashed var(--border-color); font-size: 0.85rem;">
                <td style="padding: 6px 4px;"><strong>#${index + 1}</strong> ${r.nombre || ''}</td>
                <td style="padding: 6px 4px;">$${r.carga || '0.00'}</td>
                <td style="padding: 6px 4px;">${r.fechaEntrega || 'N/A'}</td>
                <td style="padding: 6px 4px;">${timeDisplay}</td>
                <td style="padding: 6px 4px;">
                    <span class="status-label ${r.activo ? 'status-delivered' : 'status-not-delivered'}">
                        ${r.activo ? 'Delivered' : 'Pending'}
                    </span>
                </td>
                <td style="padding: 6px 4px;">${fileBtn}</td>
            </tr>
        `;
    });

    bodyEl.innerHTML = `
        <p style="font-size:0.9rem; margin-bottom: 4px;"><strong>Driver:</strong> ${userData.driverName || 'N/A'}</p>
        <p style="font-size:0.9rem; margin-bottom: 12px;"><strong>Dispatcher:</strong> ${userData.dispatcherName || 'N/A'}</p>
        <div style="max-height: 280px; overflow-y: auto; overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.8rem; color: var(--primary-blue);">
                        <th style="padding: 4px;">Nombre</th>
                        <th style="padding: 4px;">Carga</th>
                        <th style="padding: 4px;">Entrega</th>
                        <th style="padding: 4px;">Hora Reg.</th>
                        <th style="padding: 4px;">Estado</th>
                        <th style="padding: 4px;">Adjunto</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>
    `;
}

// --- VISUALIZACIÓN DE ARCHIVOS ADJUNTOS ---

function viewFile(index) {
    const row = currentRowsData[index];
    if (!row || !row.archivo) {
        alert("No hay ningún archivo adjunto en esta fila.");
        return;
    }
    openBase64InNewTab(row.archivo, row.archivoNombre);
}

function viewObserverFile(userCode, index) {
    if (useFirebase) {
        database.ref(`users/${userCode}/rowsData/${index}`).once('value').then((snapshot) => {
            const row = snapshot.val();
            if (row && row.archivo) {
                openBase64InNewTab(row.archivo, row.archivoNombre);
            } else {
                alert("El usuario no ha subido un archivo para esta fila.");
            }
        });
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[userCode] && users[userCode].rowsData && users[userCode].rowsData[index]) {
            const row = users[userCode].rowsData[index];
            if (row && row.archivo) {
                openBase64InNewTab(row.archivo, row.archivoNombre);
            } else {
                alert("El usuario no ha subido un archivo para esta fila.");
            }
        }
    }
}

function openBase64InNewTab(base64Data, fileName) {
    const win = window.open();
    if (win) {
        win.document.write(`
            <html>
                <head>
                    <title>${fileName || 'Vista de Archivo'}</title>
                    <style>
                        body { margin: 0; background-color: #0b1120; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; color: #fff; font-family: sans-serif; }
                        img, iframe { max-width: 90%; max-height: 85vh; border-radius: 8px; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
                        .btn-dl { margin-top: 15px; padding: 10px 20px; background: #00d2ff; color: #000; border: none; font-weight: bold; border-radius: 6px; cursor: pointer; text-decoration: none; }
                    </style>
                </head>
                <body>
                    ${base64Data.startsWith('data:image/') 
                        ? `<img src="${base64Data}" alt="Adjunto" />` 
                        : `<iframe src="${base64Data}" style="width:80%; height:80vh;"></iframe>`}
                    <a class="btn-dl" href="${base64Data}" download="${fileName || 'archivo_adjunto'}">📥 Descargar Archivo</a>
                </body>
            </html>
        `);
    } else {
        alert("Por favor permite las ventanas emergentes (pop-ups) en tu navegador para ver el archivo.");
    }
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

        const fileActionsHtml = row.archivo 
            ? `
                <div style="display:flex; gap: 4px;">
                    <button onclick="viewFile(${index})" class="btn-small" style="background:#00d2ff; color:#000;">📄 View</button>
                    <button onclick="document.getElementById('file-${index}').click()" class="btn-small" style="background:var(--border-color);">✏️ Change</button>
                </div>
              `
            : `
                <button onclick="document.getElementById('file-${index}').click()" class="btn-small">📁 Add</button>
              `;

        rowDiv.innerHTML = `
            <div><input type="text" value="${row.nombre || ''}" onchange="updateRowData(${index}, 'nombre', this.value)"></div>
            <div><input type="number" value="${row.carga || ''}" placeholder="0.00" onchange="updateRowData(${index}, 'carga', this.value)"></div>
            <div><input type="date" value="${row.fechaEntrega || ''}" onchange="updateRowData(${index}, 'fechaEntrega', this.value)"></div>
            <div><input type="date" value="${row.fechaRecibido || ''}" onchange="updateRowData(${index}, 'fechaRecibido', this.value)"></div>
            <div style="font-size:0.8rem; color: var(--primary-blue); font-weight: bold;">
                ${row.horaModificacion ? `🕒 ${row.horaModificacion}` : '--:--'}
            </div>
            <div>
                <span onclick="toggleRowStatus(${index})" class="status-label ${row.activo ? 'status-delivered' : 'status-not-delivered'}">
                    ${row.activo ? 'Delivered' : 'Pending'}
                </span>
            </div>
            <div>
                <input type="file" id="file-${index}" style="display:none;" onchange="handleFileUpload(event, ${index})">
                ${fileActionsHtml}
            </div>
        `;
        container.appendChild(rowDiv);
    });
}

function getCurrentFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function addNewRow() {
    const newRow = {
        id: currentRowsData.length + 1,
        nombre: `Person ${currentRowsData.length + 1}`,
        carga: '',
        fechaEntrega: '',
        fechaRecibido: '',
        horaModificacion: getCurrentFormattedTime(),
        activo: false,
        archivo: '',
        archivoNombre: '',
        archivoTipo: ''
    };

    currentRowsData.push(newRow);
    renderRowsTable();
    saveDataToStorage();
}

function updateRowData(index, field, value) {
    currentRowsData[index][field] = value;
    currentRowsData[index].horaModificacion = getCurrentFormattedTime();
    saveDataToStorage();
}

function toggleRowStatus(index) {
    currentRowsData[index].activo = !currentRowsData[index].activo;
    currentRowsData[index].horaModificacion = getCurrentFormattedTime();
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
        currentRowsData[index].horaModificacion = getCurrentFormattedTime();
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
