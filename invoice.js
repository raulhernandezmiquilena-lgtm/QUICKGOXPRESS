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

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        useFirebase = true;
    } catch (e) {
        console.warn("Firebase no inicializado. Cambiando a modo local:", e);
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

// --- NAVEGACIÓN ---
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

// --- AUTENTICACIÓN Y GENERACIÓN ---
function generateCode() {
    const randomCode = Math.floor(10000000 + Math.random() * 90000000).toString();

    const newUser = {
        username: 'Usuario',
        driverName: '',
        dispatcherName: '',
        avatar: DEFAULT_AVATAR,
        theme: 'dark',
        notifications: [],
        rowsData: Array(8).fill(null).map((_, i) => ({
            id: i + 1,
            nombre: `Carga ${i + 1}`,
            carga: '',
            fechaEntrega: '',
            fechaRecibido: '',
            horaModificacion: '',
            activo: false,
            sometida: false,
            mcNumber: '',
            showMcInput: true,
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
        Tu Código de Acceso: <br><span style="font-size: 1.8rem; color: #00d2ff; font-weight: bold;">${code}</span><br>
        <small style="color:#94a3b8;">Guárdalo bien para iniciar sesión.</small>
    `;
}

function login() {
    const codeInput = document.getElementById('login-code').value.trim();

    if (codeInput.length !== 8 || isNaN(codeInput)) {
        alert("Por favor introduce un código de 8 dígitos numéricos válido.");
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
                alert("El código no existe en el sistema.");
            }
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
            alert("El código no existe localmente.");
        }
    }
}

// --- MODO SUPERVISOR / OBSERVADOR ---
function loginAsObserver() {
    const codeInput = document.getElementById('observer-code-input').value.trim();

    if (codeInput !== "SUPERVISOR123" && (codeInput.length !== 8 || isNaN(codeInput))) {
        alert("Introduce un código de supervisor válido.");
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
            document.getElementById('display-observer-name').innerText = snapshot.val() || "Supervisor";
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

function addAccountToObserver() {
    const targetCode = document.getElementById('add-target-code-input').value.trim();

    if (targetCode.length !== 8 || isNaN(targetCode)) {
        alert("Introduce un código de usuario válido de 8 dígitos.");
        return;
    }

    if (observerTrackedCodes.length >= 8) {
        alert("Límite máximo de 8 cuentas a supervisar alcanzado.");
        return;
    }

    if (observerTrackedCodes.includes(targetCode)) {
        alert("Esta cuenta ya está vinculada.");
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
                alert("Cuenta no encontrada en la base de datos.");
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
            alert("Cuenta no encontrada localmente.");
        }
    }
}

function notifyUserAboutObserver(targetCode) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toISOString().split('T')[0];

    const newNotification = {
        message: `El Observador / Supervisor ha abierto y revisado tu cuenta.`,
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
        });
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[targetCode]) {
            if (!users[targetCode].notifications) users[targetCode].notifications = [];
            users[targetCode].notifications.push(newNotification);
            localStorage.setItem('quickgo_offline_users', JSON.stringify(users));
        }
    }
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
        gridContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No hay cuentas vinculadas. Introduce arriba un código para supervisar.</p>`;
        return;
    }

    observerTrackedCodes.forEach((code) => {
        const card = document.createElement('div');
        card.className = 'card-effect observer-account-section';
        card.id = `obs-card-${code}`;

        card.innerHTML = `
            <div class="observer-card-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 15px;">
                <div>
                    <h3 id="obs-name-${code}" style="margin: 0; font-size: 1.2rem;">Cargando...</h3>
                    <small style="color: var(--text-muted);">Código: ${code}</small>
                </div>
                <button onclick="removeAccountFromObserver('${code}')" class="btn-small-text">❌ Eliminar</button>
            </div>
            <div class="observer-card-body" id="obs-body-${code}">
                <p style="color: var(--text-muted);">Cargando datos...</p>
            </div>
        `;
        gridContainer.appendChild(card);

        if (useFirebase) {
            database.ref('users/' + code).on('value', (snapshot) => {
                updateObserverCardUI(code, snapshot.val());
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

    nameEl.innerText = userData.username || `Usuario ${code}`;

    let rowsHtml = '';
    const rows = userData.rowsData || [];

    rows.forEach((r, index) => {
        const fileBtn = r.archivo 
            ? `<button onclick="viewObserverFile('${code}', ${index})" class="btn-small" style="font-size:0.75rem; padding: 2px 6px;">📄 Archivo</button>`
            : '<span style="color: var(--text-muted); font-size: 0.75rem;">Sin archivo</span>';

        const mcDisplay = (r.sometida && r.mcNumber) 
            ? `<br><span style="color:#00d2ff; font-weight:bold; font-size:0.75rem;">MC: #${r.mcNumber}</span>`
            : '';

        rowsHtml += `
            <tr style="border-bottom: 1px dashed var(--border-color); font-size: 0.85rem;">
                <td style="padding: 6px 4px;"><strong>#${index + 1}</strong> ${r.nombre || ''}</td>
                <td style="padding: 6px 4px;">$${r.carga || '0.00'}</td>
                <td style="padding: 6px 4px;">
                    <span class="status-label ${r.activo ? 'status-delivered' : 'status-not-delivered'}">
                        ${r.activo ? 'Entregada' : 'Pendiente'}
                    </span>
                </td>
                <td style="padding: 6px 4px;">
                    <span class="status-label ${r.sometida ? 'status-submitted' : 'status-not-submitted'}">
                        ${r.sometida ? 'Sometida' : 'No Sometida'}
                    </span>
                    ${mcDisplay}
                </td>
                <td style="padding: 6px 4px;">${fileBtn}</td>
            </tr>
        `;
    });

    bodyEl.innerHTML = `
        <p style="font-size:0.85rem; margin-bottom: 4px;"><strong>Conductor:</strong> ${userData.driverName || 'N/A'}</p>
        <p style="font-size:0.85rem; margin-bottom: 10px;"><strong>Despachador:</strong> ${userData.dispatcherName || 'N/A'}</p>
        <div style="max-height: 250px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.8rem; color: var(--primary-blue);">
                        <th style="padding: 4px;">Carga</th>
                        <th style="padding: 4px;">Flete</th>
                        <th style="padding: 4px;">Delivery</th>
                        <th style="padding: 4px;">Sometida / MC</th>
                        <th style="padding: 4px;">Adjunto</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
    `;
}

function removeAccountFromObserver(code) {
    observerTrackedCodes = observerTrackedCodes.filter(c => c !== code);
    saveObserverTrackedCodes();
    renderObserverGrid();
}

// --- MANEJO DEL USUARIO Y TABLA PRINCIPAL ---
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
    document.getElementById('display-user-name').innerText = data.username || 'Usuario';
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
        if (row.showMcInput === undefined) row.showMcInput = true;

        const rowDiv = document.createElement('div');
        rowDiv.className = 'list-item';

        const fileActionsHtml = row.archivo 
            ? `
                <div style="display:flex; gap: 4px;">
                    <button onclick="viewFile(${index})" class="btn-small" style="background:#00d2ff; color:#000; padding:4px 8px; font-size:0.75rem;">📄 Ver</button>
                    <button onclick="document.getElementById('file-${index}').click()" class="btn-small" style="background:var(--border-color); padding:4px 8px; font-size:0.75rem;">✏️</button>
                </div>
              `
            : `
                <button onclick="document.getElementById('file-${index}').click()" class="btn-small" style="padding:4px 8px; font-size:0.75rem;">📁 Subir</button>
              `;

        let mcSectionHtml = '';
        if (row.sometida) {
            const eyeIcon = row.showMcInput ? '👁️' : '👁️‍🗨️';
            
            let mcInputOrBadge = '';
            if (row.showMcInput) {
                mcInputOrBadge = `<input type="text" class="mc-input" value="${row.mcNumber || ''}" placeholder="Escribe MC #" onchange="updateRowData(${index}, 'mcNumber', this.value)">`;
            } else {
                mcInputOrBadge = `<div class="mc-badge">MC: #${row.mcNumber || 'S/N'}</div>`;
            }

            mcSectionHtml = `
                <div class="mc-container">
                    <div class="mc-header-toggle">
                        <span onclick="toggleRowSubmitted(${index})" class="status-label status-submitted" style="flex:1;">
                            Sometida
                        </span>
                        <button onclick="toggleMcEye(${index})" class="btn-eye-toggle" title="Ocultar/Mostrar entrada de MC">${eyeIcon}</button>
                    </div>
                    ${mcInputOrBadge}
                </div>
            `;
        } else {
            mcSectionHtml = `
                <span onclick="toggleRowSubmitted(${index})" class="status-label status-not-submitted">
                    No Sometida
                </span>
            `;
        }

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
                    ${row.activo ? 'Entregada' : 'Pendiente'}
                </span>
            </div>
            <div>${mcSectionHtml}</div>
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
        nombre: `Carga ${currentRowsData.length + 1}`,
        carga: '',
        fechaEntrega: '',
        fechaRecibido: '',
        horaModificacion: getCurrentFormattedTime(),
        activo: false,
        sometida: false,
        mcNumber: '',
        showMcInput: true,
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

function toggleRowSubmitted(index) {
    currentRowsData[index].sometida = !currentRowsData[index].sometida;
    if (!currentRowsData[index].sometida) {
        currentRowsData[index].mcNumber = '';
    } else {
        currentRowsData[index].showMcInput = true;
    }
    currentRowsData[index].horaModificacion = getCurrentFormattedTime();
    renderRowsTable();
    saveDataToStorage();
}

function toggleMcEye(index) {
    currentRowsData[index].showMcInput = !currentRowsData[index].showMcInput;
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

// --- VISUALIZACIÓN DE ARCHIVOS ---
function viewFile(index) {
    const row = currentRowsData[index];
    if (!row || !row.archivo) return alert("No hay archivo adjunto.");
    openBase64InNewTab(row.archivo, row.archivoNombre);
}

function viewObserverFile(userCode, index) {
    if (useFirebase) {
        database.ref(`users/${userCode}/rowsData/${index}`).once('value').then((snapshot) => {
            const row = snapshot.val();
            if (row && row.archivo) openBase64InNewTab(row.archivo, row.archivoNombre);
            else alert("Sin archivo adjunto.");
        });
    } else {
        let users = JSON.parse(localStorage.getItem('quickgo_offline_users')) || {};
        if (users[userCode]?.rowsData[index]?.archivo) {
            openBase64InNewTab(users[userCode].rowsData[index].archivo, users[userCode].rowsData[index].archivoNombre);
        } else {
            alert("Sin archivo adjunto.");
        }
    }
}

function openBase64InNewTab(base64Data, fileName) {
    const win = window.open();
    if (win) {
        win.document.write(`
            <html>
                <head><title>${fileName || 'Vista de Archivo'}</title></head>
                <body style="margin:0; background:#0b1120; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; color:#fff; font-family:sans-serif;">
                    ${base64Data.startsWith('data:image/') 
                        ? `<img src="${base64Data}" style="max-width:90%; max-height:85vh; border-radius:8px;" />` 
                        : `<iframe src="${base64Data}" style="width:80%; height:80vh; border:none;"></iframe>`}
                    <br>
                    <a href="${base64Data}" download="${fileName || 'adjunto'}" style="padding:10px 20px; background:#00d2ff; color:#000; font-weight:bold; text-decoration:none; border-radius:6px;">📥 Descargar Archivo</a>
                </body>
            </html>
        `);
    }
}

// --- PERFIL Y UTILIDADES ---
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
    if (el) el.innerText = isCodeVisible ? `Código: ${currentUserCode}` : 'Código: ••••••••';
}

function toggleObserverCodeVisibility() {
    isObserverCodeVisible = !isObserverCodeVisible;
    updateObserverCodeDisplay();
}

function updateObserverCodeDisplay() {
    const el = document.getElementById('observer-code-display');
    if (el) el.innerText = isObserverCodeVisible ? `Código: ${currentObserverCode}` : 'Código: ••••••••';
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
    if (theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
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
        list.innerHTML = `<p class="empty-notif">Sin notificaciones.</p>`;
        badge.classList.add('hidden');
        return;
    }

    badge.innerText = notifArray.length;
    badge.classList.remove('hidden');

    notifArray.slice().reverse().forEach((n) => {
        const card = document.createElement('div');
        card.style.cssText = "background: var(--input-bg); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; margin-bottom: 6px;";
        card.innerHTML = `<div>${n.message}</div><small style="color:var(--text-muted);">${n.date} - ${n.time}</small>`;
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
    html2canvas(document.body).then((canvas) => {
        const link = document.createElement('a');
        link.download = `QuickGoXpress-Captura-${Date.now()}.png`;
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

// ===================================================================================
// REGISTRO DE SERVICE WORKER PARA PERMITIR DESCARGA COMO APLICACIÓN (PWA)
// ===================================================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('Service Worker registrado con éxito:', registration.scope);
            })
            .catch((error) => {
                console.log('Error al registrar Service Worker:', error);
            });
    });
}
