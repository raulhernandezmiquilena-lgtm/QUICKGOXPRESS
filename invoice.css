/* --- GENERAL STYLES AND ANIMATED BACKGROUND --- */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(-45deg, #ee3c3c, #ff416c, #1e3c72, #2a52be);
    background-size: 400% 400%;
    animation: gradientBG 10s ease infinite;
    color: #333;
    overflow-x: hidden;
    padding: 20px;
}

@keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* --- MAIN CONTAINERS --- */
.container {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 30px;
    width: 100%;
    max-width: 1150px; /* Ancho optimizado para PC */
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    transition: background 0.3s, color 0.3s;
}

/* Dark Mode Variables */
.dark-mode {
    background: rgba(30, 30, 30, 0.95) !important;
    color: #f5f5f5 !important;
}
.dark-mode input, .dark-mode select {
    background: #2a2a2a;
    color: #fff;
    border: 1px solid #555;
}
.dark-mode .list-item {
    border-bottom: 1px solid #444;
}
.dark-mode .staff-corner-panel {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #444;
}

.hidden {
    display: none !important;
}

h1, h2, h3 {
    text-align: center;
    margin-bottom: 20px;
}

.brand-title {
    font-size: 2.5rem;
    font-weight: 800;
    letter-spacing: 2px;
    background: linear-gradient(45deg, #ff416c, #0056b3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 30px;
}

/* --- BUTTONS AND INPUTS --- */
button {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    margin: 5px;
}

.btn-primary {
    background: #ff4b2b;
    color: white;
}
.btn-primary:hover {
    background: #ff416c;
}

.btn-secondary {
    background: #007bff;
    color: white;
}
.btn-secondary:hover {
    background: #0056b3;
}

.btn-danger {
    background: #dc3545;
    color: white;
}

/* Estilo especial y llamativo para el botón de compartir */
.btn-share {
    background: #25d366; /* Verde tipo WhatsApp / Compartir */
    color: white;
}
.btn-share:hover {
    background: #1ebd56;
    transform: scale(1.03);
}

input[type="text"], input[type="date"], input[type="number"] {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #ccc;
    outline: none;
    width: 100%;
    margin-bottom: 15px;
}

/* --- WELCOME SCREEN --- */
#auth-screen {
    max-width: 450px;
    text-align: center;
    width: 100%;
}

.auth-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-top: 20px;
}

/* --- MAIN INTERFACE (DASHBOARD) --- */
header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #eee;
    padding-bottom: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;
}

/* --- USER PROFILE --- */
.profile-section {
    display: flex;
    align-items: center;
    gap: 15px;
}

.profile-pic-container {
    position: relative;
    width: 60px;
    height: 60px;
}

.profile-pic {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #ff4b2b;
    background: #e2e8f0; /* Fondo gris claro suave para la silueta */
}

.file-input-label {
    position: absolute;
    bottom: 0;
    right: 0;
    background: #333;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

/* Username editing */
.brand-details {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.editable-name-container {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
}

.user-name-text {
    font-size: 1.05rem;
    font-weight: 600;
    color: #444;
}

.dark-mode .user-name-text {
    color: #ddd;
}

.edit-name-btn {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    color: #007bff;
    font-size: 0.85rem;
    font-weight: normal;
    cursor: pointer;
    text-decoration: underline;
}

.edit-name-btn:hover {
    color: #0056b3;
}

#edit-user-name-input {
    margin-bottom: 0 !important;
    padding: 4px 8px;
    font-size: 0.9rem;
    width: 150px;
}

/* --- DRIVER & DISPATCHER PANEL --- */
.staff-corner-panel {
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 25px;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: flex-start;
    align-items: center;
}

.staff-field {
    display: flex;
    align-items: center;
    gap: 10px;
}

.staff-field label {
    font-size: 0.95rem;
    white-space: nowrap;
}

.staff-field input {
    margin-bottom: 0 !important;
    width: 180px;
    padding: 8px 12px;
}

/* --- SETTINGS --- */
.settings-panel {
    background: rgba(0,0,0,0.05);
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
}

/* --- 12 PEOPLE LIST (PC PERFECT LAYOUT) --- */
.list-container {
    margin-top: 25px;
}

.list-header {
    display: grid;
    /* Proporciones perfectas para pantalla de PC */
    grid-template-columns: 1.8fr 1.1fr 1.1fr 1.1fr 1.4fr 1fr;
    font-weight: bold;
    padding: 12px 10px;
    border-bottom: 2px solid #ddd;
    text-align: center;
    font-size: 0.9rem;
}

.list-item {
    display: grid;
    grid-template-columns: 1.8fr 1.1fr 1.1fr 1.1fr 1.4fr 1fr;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
    gap: 12px;
}

.list-item input {
    margin-bottom: 0 !important;
    padding: 8px;
    font-size: 0.85rem;
    text-align: center;
}

/* Status Column Styles */
.status-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.status-label {
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
}

.status-delivered {
    color: #28a745;
}

.status-not-delivered {
    color: #dc3545;
}

/* File Column Styles */
.file-cell {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
}

.btn-file-upload {
    background: #007bff;
    color: white;
    padding: 6px 12px;
    font-size: 0.95rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

.btn-file-upload:hover {
    background: #0056b3;
}

.btn-file-view {
    background: #28a745;
    color: white;
    padding: 6px 12px;
    font-size: 0.95rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    font-weight: bold;
    text-decoration: none;
}

.btn-file-view:hover {
    background: #218838;
}

/* --- TOGGLE SWITCH --- */
.switch-container {
    display: flex;
    justify-content: center;
    align-items: center;
}

.switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 22px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #dc3545; /* Red - Inactive */
    transition: .4s;
    border-radius: 34px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: #28a745; /* Green - Active */
}

input:checked + .slider:before {
    transform: translateX(26px);
}

/* --- SCREENSHOT MODE ---
   Oculta de manera limpia los botones interactivos durante la captura */
body.screenshot-mode .header-actions,
body.screenshot-mode .edit-name-btn,
body.screenshot-mode .file-input-label,
body.screenshot-mode .settings-panel,
body.screenshot-mode .file-cell,
body.screenshot-mode .switch-container {
    visibility: hidden !important;
}

/* Responsive (Mobile View) */
@media (max-width: 900px) {
    .list-header {
        display: none;
    }
    .list-item {
        grid-template-columns: 1fr;
        border: 1px solid #ccc;
        border-radius: 8px;
        margin-bottom: 15px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.5);
    }
}
