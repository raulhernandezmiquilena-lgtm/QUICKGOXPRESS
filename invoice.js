// --- LOCAL DATABASE ---
let currentUserCode = null;

// Silueta por defecto en formato SVG cuando el usuario no tiene foto cargada
const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23a0aec0'><circle cx='50' cy='50' r='48' fill='%23e2e8f0'/><circle cx='50' cy='38' r='18'/><path d='M50 62c-18 0-32 8-32 20h64c0-12-14-20-32-20z'/></svg>";

// Show screens
function showRegister() {
    document.getElementById('auth-options').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

// Show Login
function showLogin() {
    document.getElementById('auth-options').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

// Back to menu
function backToAuth() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('auth-options').classList.remove('hidden');
}

// Generate random 8-digit code and save to LocalStorage
function generateCode() {
    const randomCode = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    let users = JSON.parse(localStorage.getItem('quickgo_users')) || {};
    
    if(!users[randomCode]) {
        users[randomCode] = {
            username: 'Username',
            driverName: '',
            dispatcherName: '',
            avatar: DEFAULT_AVATAR, // Asigna la silueta por defecto al crear cuenta
            theme: 'light',
            rowsData: Array(12).fill(null).map((_, i) => ({
                id: i + 1,
                nombre: `Person ${i + 1}`,
                carga: '',
                fechaEntrega: '',
                fechaRecibido: '',
                activo: false,
                archivo: null,      // Base64 file string
                archivoNombre: '',  // File original name
                archivoTipo: ''     // Mime-type to preview correctly
            }))
        };
        localStorage.setItem('quickgo_users', JSON.stringify(users));
    }

    document.getElementById('generated-code-display').innerHTML = `
        Your code is: <br><span style="font-size: 1.8rem; color: #28a745;">${randomCode}</span><br>
        <small style="color:#555;">Write it down! You will need it to log in.</small>
    `;
}

// Log in with code
function login() {
    const codeInput = document.getElementById('login-code').value.trim();
    let users = JSON.parse(localStorage.getItem('quickgo_users')) || {};

    if(users[codeInput]) {
        currentUserCode = codeInput;
        localStorage.setItem('quickgo_current_session', currentUserCode);
        loadDashboard();
    } else {
        alert("Invalid access code. Please create a code first.");
    }
}

// Load Dashboard with user data
function loadDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-dashboard').classList.remove('hidden');
    document.getElementById('session-code-display').innerText = `Code: ${currentUserCode}`;

    const users = JSON.parse(localStorage.getItem('quickgo_users'));
    const userData = users[currentUserCode];

    // Load username
    const userName = userData.username || 'Username';
    document.getElementById('display-user-name').innerText = userName;
    document.getElementById('edit-user-name-input').value = userName;

    // Load Driver & Dispatcher
    document.getElementById('driver-name-input').value = userData.driverName || '';
    document.getElementById('dispatcher-name-input').value = userData.dispatcherName || '';

    // Load avatar o silueta por defecto si no existe
    const imgElement = document.getElementById('user-avatar');
    if(userData.avatar) {
        imgElement.src = userData.avatar;
    } else {
        imgElement.src = DEFAULT_AVATAR;
    }
    setTheme(userData.theme || 'light');

    // Render list
    renderRows(userData.rowsData);
}

// Enable username editing
function enableEditName() {
    document.getElementById('display-user-name').classList.add('hidden');
    document.querySelector('.edit-name-btn').classList.add('hidden');
    document.getElementById('edit-name-input-container').classList.remove('hidden');
    document.getElementById('edit-user-name-input').focus();
}

// Save username
function saveUserName() {
    const newName = document.getElementById('edit-user-name-input').value.trim();
    if(newName) {
        document.getElementById('display-user-name').innerText = newName;
        
        let users = JSON.parse(localStorage.getItem('quickgo_users'));
        users[currentUserCode].username = newName;
        localStorage.setItem('quickgo_users', JSON.stringify(users));
    }
    
    document.getElementById('edit-name-input-container').classList.add('hidden');
    document.getElementById('display-user-name').classList.remove('hidden');
    document.querySelector('.edit-name-btn').classList.remove('hidden');
}

// Handle enter key on editing
function handleNameKeypress(event) {
    if (event.key === 'Enter') {
        saveUserName();
    }
}

// Save Driver & Dispatcher in real time
function saveStaffData() {
    const driver = document.getElementById('driver-name-input').value;
    const dispatcher = document.getElementById('dispatcher-name-input').value;

    let users = JSON.parse(localStorage.getItem('quickgo_users'));
    users[currentUserCode].driverName = driver;
    users[currentUserCode].dispatcherName = dispatcher;
    localStorage.setItem('quickgo_users', JSON.stringify(users));
}

// Render the 12 rows with status text, folder and preview eye button
function renderRows(rowsData) {
    const container = document.getElementById('rows-container');
    container.innerHTML = '';

    rowsData.forEach((row, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'list-item';
        
        const tieneArchivo = row.archivo ? true : false;

        rowDiv.innerHTML = `
            <div>
                <input type="text" value="${row.nombre}" onchange="updateRowData(${index}, 'nombre', this.value)" placeholder="Name">
            </div>
            <div>
                <input type="number" value="${row.carga}" onchange="updateRowData(${index}, 'carga', this.value)" placeholder="Load Value ($)">
            </div>
            <div>
                <input type="date" value="${row.fechaEntrega}" onchange="updateRowData(${index}, 'fechaEntrega', this.value)">
            </div>
            <div>
                <input type="date" value="${row.fechaRecibido}" onchange="updateRowData(${index}, 'fechaRecibido', this.value)">
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

// Update row cell in real time
function updateRowData(index, key, value) {
    let users = JSON.parse(localStorage.getItem('quickgo_users'));
    users[currentUserCode].rowsData[index][key] = value;
    localStorage.setItem('quickgo_users', JSON.stringify(users));
}

// Active/Inactive Switch with dynamic Delivered/Not Delivered text
function toggleRowActive(index, isChecked) {
    let users = JSON.parse(localStorage.getItem('quickgo_users'));
    users[currentUserCode].rowsData[index].activo = isChecked;
    localStorage.setItem('quickgo_users', JSON.stringify(users));

    const statusText = document.getElementById(`status-text-${index}`);
    if (isChecked) {
        statusText.innerText = 'Delivered';
        statusText.className = 'status-label status-delivered';
    } else {
        statusText.innerText = 'Not Delivered';
        statusText.className = 'status-label status-not-delivered';
    }
}

// Upload row file, saving Base64, original name, and type
function uploadRowFile(index, event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 1500000) {
            alert("The file is too large. Please upload a file smaller than 1.5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const base64File = e.target.result;
            
            let users = JSON.parse(localStorage.getItem('quickgo_users'));
            users[currentUserCode].rowsData[index].archivo = base64File;
            users[currentUserCode].rowsData[index].archivoNombre = file.name;
            users[currentUserCode].rowsData[index].archivoTipo = file.type;
            localStorage.setItem('quickgo_users', JSON.stringify(users));

            // Update the view container to immediately display the eye icon
            const viewContainer = document.getElementById(`file-view-container-${index}`);
            viewContainer.innerHTML = `<button onclick="viewRowFile(${index})" class="btn-file-view" title="View: ${file.name}">👁️</button>`;
            
            alert(`File "${file.name}" successfully linked to the line!`);
        };
        reader.readAsDataURL(file);
    }
}

// View file function (Opens a new clean tab, supports PDFs, Images, and general documents)
function viewRowFile(index) {
    const users = JSON.parse(localStorage.getItem('quickgo_users'));
    const fileData = users[currentUserCode].rowsData[index].archivo;
    const fileType = users[currentUserCode].rowsData[index].archivoTipo || 'image/png';
    const fileName = users[currentUserCode].rowsData[index].archivoNombre || 'document';

    if (fileData) {
        // Open new tab
        const newTab = window.open();
        
        if (fileType.startsWith('image/') || fileType === 'application/pdf') {
            // Displays preview directly inside the browser window
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
            // For zip, txt, docx or other formats, it directly triggers download
            const link = document.createElement('a');
            link.href = fileData;
            link.download = fileName;
            link.click();
            newTab.close();
        }
    } else {
        alert("No file uploaded for this row.");
    }
}

// Change avatar picture
function changeAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Img = e.target.result;
            document.getElementById('user-avatar').src = base64Img;

            let users = JSON.parse(localStorage.getItem('quickgo_users'));
            users[currentUserCode].avatar = base64Img;
            localStorage.setItem('quickgo_users', JSON.stringify(users));
        };
        reader.readAsDataURL(file);
    }
}

// Toggle settings panel
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('hidden');
}

// Toggle Theme (Light/Dark)
function setTheme(theme) {
    const dashboard = document.getElementById('main-dashboard');
    let users = JSON.parse(localStorage.getItem('quickgo_users'));

    if (theme === 'dark') {
        dashboard.classList.add('dark-mode');
    } else {
        dashboard.classList.remove('dark-mode');
    }

    if(currentUserCode && users[currentUserCode]) {
        users[currentUserCode].theme = theme;
        localStorage.setItem('quickgo_users', JSON.stringify(users));
    }
}

// --- CAPTURA Y COMPARTIR ---
function shareDashboard() {
    const dashboard = document.getElementById('main-dashboard');
    const settingsPanel = document.getElementById('settings-panel');

    // 1. Ocultamos el panel de ajustes primero
    settingsPanel.classList.add('hidden');

    // 2. Activamos el modo captura (oculta botones interactivos en CSS)
    document.body.classList.add('screenshot-mode');

    // Esperamos un instante (150ms) para que el navegador redibuje la pantalla sin los botones
    setTimeout(() => {
        html2canvas(dashboard, {
            useCORS: true, // Permite cargar fotos que vengan de internet (como placeholders)
            allowTaint: true,
            scale: 2,      // Sube la calidad de la imagen al doble para que se lea perfecto
            backgroundColor: null // Mantiene la transparencia o fondo según tema
        }).then(canvas => {
            // 3. Desactivamos el modo captura de inmediato
            document.body.classList.remove('screenshot-mode');
            settingsPanel.classList.remove('hidden'); // Reabrimos la configuración

            // 4. Convertimos la captura en un archivo de imagen real
            canvas.toBlob(blob => {
                if (!blob) {
                    alert("Error generating screenshot");
                    return;
                }

                const file = new File([blob], `quickgoxpress-${currentUserCode}.png`, { type: 'image/png' });

                // 5. Intentamos compartir usando el sistema nativo del dispositivo (WhatsApp, Telegram, etc.)
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({
                        files: [file],
                        title: 'QUICKGOXPRESS Dashboard',
                        text: `Check out my customized QUICKGOXPRESS load board! Code: ${currentUserCode}`
                    }).catch(error => {
                        console.log("Sharing cancelled or failed: ", error);
                        // Descarga de respaldo por si el usuario cancela la compartición directa
                        downloadFallback(canvas);
                    });
                } else {
                    // Si el navegador no tiene el botón de compartir directo (como en PCs antiguas), se descarga
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

// Descarga la imagen si no se puede compartir directamente
function downloadFallback(canvas) {
    const link = document.createElement('a');
    link.download = `QUICKGOXPRESS-${currentUserCode}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    alert("The image of your custom dashboard has been downloaded successfully! You can now send it manually on any social network.");
}

// Log out
function logout() {
    localStorage.removeItem('quickgo_current_session');
    currentUserCode = null;
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    backToAuth();
    document.getElementById('login-code').value = '';
    document.getElementById('generated-code-display').innerHTML = '';
}

// Auto login if session exists
window.onload = function() {
    const savedSession = localStorage.getItem('quickgo_current_session');
    if (savedSession) {
        currentUserCode = savedSession;
        loadDashboard();
    }
};
