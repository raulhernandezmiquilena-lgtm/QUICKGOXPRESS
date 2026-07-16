<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QUICKGOXPRESS</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <link rel="stylesheet" href="invoice.css">
    <link rel="icon" href="tulogo.jpeg" type="image/jpeg">
</head>
<body>

    <div id="auth-screen" class="container">
        <h1 class="brand-title">QUICKGOXPRESS</h1>
        
        <div id="auth-options" class="auth-buttons">
            <button class="btn-primary" onclick="showRegister()">Create Page (Account)</button>
            <button class="btn-secondary" onclick="showLogin()">Log In</button>
        </div>

        <div id="register-form" class="hidden">
            <h3>Create your 8-digit access code</h3>
            <p style="margin-bottom: 15px; font-size: 0.9rem;">Click below to generate your unique and non-transferable code.</p>
            <button class="btn-primary" onclick="generateCode()">Generate Access Code</button>
            <div id="generated-code-display" style="margin-top: 15px; font-size: 1.2rem; font-weight: bold; color: #ff4b2b;"></div>
            <button class="btn-secondary" style="margin-top: 15px;" onclick="backToAuth()">Back</button>
        </div>

        <div id="login-form" class="hidden">
            <h3>Enter your 8-digit code</h3>
            <input type="text" id="login-code" placeholder="8-digit code" maxlength="8">
            <button class="btn-primary" onclick="login()">Enter</button>
            <button class="btn-secondary" onclick="backToAuth()">Back</button>
        </div>
    </div>


    <div id="main-dashboard" class="container hidden">
        <header>
            <div class="profile-section">
                <div class="profile-pic-container">
                    <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23a0aec0'><circle cx='50' cy='50' r='48' fill='%23e2e8f0'/><circle cx='50' cy='38' r='18'/><path d='M50 62c-18 0-32 8-32 20h64c0-12-14-20-32-20z'/></svg>" alt="Profile" id="user-avatar" class="profile-pic">
                    <label for="avatar-upload" class="file-input-label">📷</label>
                    <input type="file" id="avatar-upload" accept="image/*" style="display: none;" onchange="changeAvatar(event)">
                </div>
                <div class="brand-details">
                    <h2 style="margin: 0; font-size: 1.4rem;">QUICKGOXPRESS</h2>
                    
                    <div class="editable-name-container">
                        <span id="display-user-name" class="user-name-text">Username</span>
                        <button class="edit-name-btn" onclick="enableEditName()" title="Edit name">✏️ Edit</button>
                        <div id="edit-name-input-container" class="hidden">
                            <input type="text" id="edit-user-name-input" onblur="saveUserName()" onkeypress="handleNameKeypress(event)" placeholder="Type your name">
                        </div>
                    </div>
                    
                    <span id="session-code-display" style="font-size: 0.85rem; color: #666; display: block; margin-top: 2px;">Code: ########</span>
                </div>
            </div>
            
            <div class="header-actions">
                <button class="btn-secondary" onclick="toggleSettings()">Customize / Settings</button>
                <button class="btn-danger" onclick="logout()">Log Out</button>
            </div>
        </header>

        <div class="staff-corner-panel">
            <div class="staff-field">
                <label for="driver-name-input"><strong>Driver:</strong></label>
                <input type="text" id="driver-name-input" placeholder="Driver's Name" oninput="saveStaffData()">
            </div>
            <div class="staff-field">
                <label for="dispatcher-name-input"><strong>Dispatcher:</strong></label>
                <input type="text" id="dispatcher-name-input" placeholder="Dispatcher's Name" oninput="saveStaffData()">
            </div>
        </div>

        <div id="settings-panel" class="settings-panel hidden">
            <h3>Customization Settings</h3>
            <div style="display: flex; gap: 20px; align-items: center; margin-top: 10px; justify-content: center; flex-wrap: wrap;">
                <div>
                    <label>List Theme:</label>
                    <button class="btn-secondary" onclick="setTheme('light')">Light Mode</button>
                    <button class="btn-primary" onclick="setTheme('dark')">Dark Mode</button>
                </div>
                <div style="border-left: 1px solid #ccc; padding-left: 20px;">
                    <button class="btn-share" onclick="shareDashboard()">🔗 Share Board (Capture)</button>
                </div>
            </div>
        </div>

        <div class="list-container">
            <h3>Load Management Lines</h3>
            
            <div class="list-header">
                <div>Staff Name</div>
                <div>Load ($)</div>
                <div>Delivery Date</div>
                <div>Received Date</div>
                <div>Status (Delivered / Not Delivered)</div>
                <div>Files</div>
            </div>

            <div id="rows-container">
                </div>
        </div>
    </div>

    <script src="invoice.js"></script>
</body>
</html>
