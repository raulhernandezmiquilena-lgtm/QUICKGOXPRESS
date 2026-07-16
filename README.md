<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QUICKGOXPRESS</title>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>

    <link rel="stylesheet" href="invoice.css">
    <link rel="icon" href="tulogo.jpg" type="image/jpeg">
</head>
<body>

    <div id="auth-screen" class="container">
        <h1 class="brand-title">QUICKGOXPRESS</h1>
        
        <div id="auth-options" class="auth-buttons">
            <button class="btn-primary" onclick="showRegister()">Crear Página (Cuenta)</button>
            <button class="btn-secondary" onclick="showLogin()">Iniciar Sesión</button>
        </div>

        <div id="register-form" class="hidden">
            <h3>Crea tu acceso de 8 dígitos</h3>
            <p style="margin-bottom: 15px; font-size: 0.9rem;">Haz clic abajo para generar tu código único e intransferible.</p>
            <button class="btn-primary" onclick="generateCode()">Generar Código de Acceso</button>
            <div id="generated-code-display" style="margin-top: 15px; font-size: 1.2rem; font-weight: bold; color: #ff4b2b;"></div>
            <button class="btn-secondary" style="margin-top: 15px;" onclick="backToAuth()">Volver</button>
        </div>

        <div id="login-form" class="hidden">
            <h3>Ingresa tu código de 8 dígitos</h3>
            <input type="text" id="login-code" placeholder="Código de 8 dígitos" maxlength="8">
            <button class="btn-primary" onclick="login()">Entrar</button>
            <button class="btn-secondary" onclick="backToAuth()">Volver</button>
        </div>
    </div>


    <div id="main-dashboard" class="container hidden">
        <header>
            <div class="profile-section">
                <div class="profile-pic-container">
                    <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23a0aec0'><circle cx='50' cy='50' r='48' fill='%23e2e8f0'/><circle cx='50' cy='38' r='18'/><path d='M50 62c-18 0-32 8-32 20h64c0-12-14-20-32-20z'/></svg>" alt="Perfil" id="user-avatar" class="profile-pic">
                    <label for="avatar-upload" class="file-input-label">📷</label>
                    <input type="file" id="avatar-upload" accept="image/*" style="display: none;" onchange="changeAvatar(event)">
                </div>
                <div class="brand-details">
                    <h2 style="margin: 0; font-size: 1.4rem;">QUICKGOXPRESS</h2>
                    
                    <div class="editable-name-container">
                        <span id="display-user-name" class="user-name-text">Username</span>
                        <button class="edit-name-btn" onclick="enableEditName()" title="Editar nombre">✏️ Editar</button>
                        <div id="edit-name-input-container" class="hidden">
                            <input type="text" id="edit-user-name-input" onblur="saveUserName()" onkeypress="handleNameKeypress(event)" placeholder="Escribe tu nombre">
                        </div>
                    </div>
                    
                    <div class="code-display-container" style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">
                        <span id="session-code-display" style="font-size: 0.85rem; color: #666; font-family: monospace;">Código: ••••••##</span>
                        <button id="toggle-code-btn" onclick="toggleCodeVisibility()" style="background: none; border: none; padding: 0; margin: 0; cursor: pointer; font-size: 0.85rem; filter: grayscale(100%);" title="Mostrar código">👁️</button>
                    </div>
                </div>
            </div>
            
            <div class="header-actions">
                <button class="btn-secondary" onclick="toggleSettings()">Personalizar / Ajustes</button>
                <button class="btn-danger" onclick="logout()">Cerrar Sesión</button>
            </div>
        </header>

        <div class="staff-corner-panel">
            <div class="staff-field">
                <label for="driver-name-input"><strong>Chofer:</strong></label>
                <input type="text" id="driver-name-input" placeholder="Nombre del Chofer" oninput="saveStaffData()">
            </div>
            <div class="staff-field">
                <label for="dispatcher-name-input"><strong>Despachador:</strong></label>
                <input type="text" id="dispatcher-name-input" placeholder="Nombre del Despachador" oninput="saveStaffData()">
            </div>
        </div>

        <div id="settings-panel" class="settings-panel hidden">
            <h3>Ajustes de Personalización</h3>
            <div style="display: flex; gap: 20px; align-items: center; margin-top: 10px; justify-content: center; flex-wrap: wrap;">
                <div>
                    <label>Tema de la lista:</label>
                    <button class="btn-secondary" onclick="setTheme('light')">Modo Claro</button>
                    <button class="btn-primary" onclick="setTheme('dark')">Modo Oscuro</button>
                </div>
                <div style="border-left: 1px solid #ccc; padding-left: 20px;">
                    <button class="btn-share" onclick="shareDashboard()">🔗 Compartir Tabla (Captura)</button>
                </div>
            </div>
        </div>

        <div class="list-container">
            <h3>Líneas de Control de Carga</h3>
            
            <div class="list-header">
                <div>Nombre del Personal</div>
                <div>Carga ($)</div>
                <div>Fecha de Entrega</div>
                <div>Fecha de Recibido</div>
                <div>Estado (Entregado / No Entregado)</div>
                <div>Archivos</div>
            </div>

            <div id="rows-container">
                </div>
        </div>
    </div>

    <script src="invoice.js"></script>
</body>
</html>
