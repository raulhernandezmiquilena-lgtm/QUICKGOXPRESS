// --- CONFIGURACIÓN DE FIREBASE (Reemplaza los valores de abajo con tus datos reales) ---
const firebaseConfig = {
    apiKey: "TU_API_KEY_REAL_AQUI",
    authDomain: "TU_PROJECT_ID_AQUI.firebaseapp.com",
    databaseURL: "https://TU_PROJECT_ID_AQUI-default-rtdb.firebaseio.com",
    projectId: "TU_PROJECT_ID_AQUI",
    storageBucket: "TU_PROJECT_ID_AQUI.appspot.com",
    messagingSenderId: "TU_MESSAGING_SENDER_ID_AQUI",
    appId: "TU_APP_ID_AQUI"
};

// Inicializamos Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- VARIABLES DE SESIÓN ---
let currentUserCode = null;
let isCodeVisible = false;
let currentRowsData = []; // Caché local de las filas de la tabla

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23a0aec0'><circle cx='50' cy='50' r='48' fill='%23e2e8f0'/><circle cx='50' cy='38' r='18'/><path d='M50 62c-18 0-32 8-32 20h64c0-12-14-20-32-20z'/></svg>";

// Control de vistas
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

// Generar código de 8 dígitos y guardarlo en la base de datos en la nube
function generateCode() {
    const randomCode = Math.floor(10000000 + Math.random() * 90000000).toString();

    // Verificamos en la nube si el código ya existe
    database.ref('users/' + randomCode).once('value').then((snapshot) => {
        if (snapshot.exists()) {
            // Si ya existe, volvemos a generar uno nuevo
            generateCode();
        } else {
            // Si es único, creamos la estructura de datos limpia en Firebase
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

            database.ref('users/' + randomCode).set(newUser).then(() => {
                document.getElementById('generated-code-display').innerHTML = `
                    Your code is: <br><span style="font-size: 1.8rem; color: #28a745;">${randomCode}</span><br>
                    <small style="color:#555;">Write it down! You can use it to log in on any device.</small>
                `;
            });
        }
    }).catch(err => {
        console.error("Error creating code in cloud: ", err);
        alert("Database connection error. Check your Firebase credentials in invoice.js");
    });
}

// Iniciar sesión desde cualquier dispositivo buscando el código en la nube
function login() {
    const codeInput = document.getElementById('login-code').value.trim();

    if(codeInput.length !== 8 || isNaN(codeInput)) {
        alert("Please enter a valid 8-digit numeric code.");
        return;
    }

    // Buscamos el código en la base de datos en tiempo real de Firebase
    database.ref('users/' + codeInput).once('value').then((snapshot) => {
        if(snapshot.exists()) {
            currentUserCode = codeInput;
            localStorage.setItem('quickgo_current_session', currentUserCode); // Guarda sesión local para evitar logueos continuos
            loadDashboard();
        } else {
            alert("This code does not exist. Please double-check it or create a new account.");
        }
    }).catch(err => {
        console.error("Login error: ", err);
        alert("Connection error. Please try again.");
    });
}

// Cargar panel con sincronización en tiempo real
function loadDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-dashboard').classList.remove('hidden');

    isCodeVisible = false;
    updateCodeDisplay();

    // Sincronización en tiempo real: Si se actualizan los datos en otro dispositivo, se refrescan aquí automáticamente
    database.ref('users/' + currentUserCode).on('value', (snapshot) => {
        const userData = snapshot.val();
        if(!userData) return;

        // Cargar Nombre de usuario
        const userName = userData.username || 'Username';
        document.getElementById('display-user-name').innerText = userName;
        document.getElementById('edit-user-name-input').value = userName;

        // Cargar Chofer y Despachador
        document.getElementById('driver-name-input').value = userData.driverName || '';
        document.getElementById('dispatcher-name-input').value = userData.dispatcherName || '';

        // Cargar Avatar
        const imgElement = document.getElementById('user-avatar');
        imgElement.src = userData.avatar || DEFAULT_AVATAR;

        // Establecer Tema sin escribir en bucle
        setTheme(userData.theme || 'light', false);

        // Renderizar tabla
        currentRowsData = userData.rowsData || [];
        renderRows(currentRowsData);
    });
}

// Alternar visibilidad del código
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

// Editar nombre de usuario
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
        database.ref('users/' + currentUserCode + '/username').set(newName);
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

// Guardar Chofer y Despachador en la nube
function saveStaffData() {
    const driver = document.getElementById('driver-name-input').value;
    const dispatcher = document.getElementById('dispatcher-name-input').value;

    database.ref('users/' + currentUserCode).update({
        driverName: driver,
        dispatcherName: dispatcher
    });
}

// Renderizar filas de forma dinámica
function renderRows(rowsData) {
    const container = document.getElementById('rows-container');
    container.innerHTML = '';

    rowsData.forEach((row, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'list-item';
        const tieneArchivo = (row.archivo && row.archivo !== "") ? true : false;

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
                    ${tieneArchivo ? `<button onclick="viewRowFile(${index})" class="btn-file-view" title="View: ${row.archivoNombre}">👁️</button>` : ''}
                </div>
            </div>
        `;
        container.appendChild(rowDiv);
    });
}

// Actualizar una celda específica en la nube
function updateRowData(index, key, value) {
    database.ref('users/' + currentUserCode + '/rowsData/' + index + '/' + key).set(value);
}

// Activar/Desactivar switch de entregado
function toggleRowActive(index, isChecked) {
    database.ref('users/' + currentUserCode + '/rowsData/' + index + '/activo').set(isChecked);
}

// Subir archivo (se guarda en base64 en la base de datos de texto)
function uploadRowFile(index, event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 800000) { // Límite de 800KB para rendimiento en la nube
            alert("The file is too large. Please upload a file smaller than 800KB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const base64File = e.target.result;
            
            database.ref('users/' + currentUserCode + '/rowsData/' + index).update({
                archivo: base64File,
                archivoNombre: file.name,
                archivoTipo: file.type
            }).then(() => {
                alert(`File "${file.name}" uploaded and synced on all devices!`);
            });
        };
        reader.readAsDataURL(file);
    }
}

// Visualizar archivo adjunto
function viewRowFile(index) {
    const row = currentRowsData[index];
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

// Subir y actualizar foto de perfil en la nube
function changeAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Img = e.target.result;
            database.ref('users/' + currentUserCode + '/avatar').set(base64Img);
        };
        reader.readAsDataURL(file);
    }
}

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('hidden');
}

// Tema Claro/Oscuro
function setTheme(theme, updateDb = true) {
    const dashboard = document.getElementById('main-dashboard');
    if (theme === 'dark') {
        dashboard.classList.add('dark-mode');
    } else {
        dashboard.classList.remove('dark-mode');
    }

    if(updateDb && currentUserCode) {
        database.ref('users/' + currentUserCode + '/theme').set(theme);
    }
}

// Compartir de forma segura
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

// Cerrar Sesión
function logout() {
    if (currentUserCode) {
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

// Auto-login al recargar
window.onload = function() {
    const savedSession = localStorage.getItem('quickgo_current_session');
    if (savedSession) {
        currentUserCode = savedSession;
        loadDashboard();
    }
};
