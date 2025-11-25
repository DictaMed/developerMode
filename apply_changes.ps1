$content = Get-Content "c:\developerMode\index.html" -Raw -Encoding UTF8

# 1. Ajouter le lien PWA manifest avant </head>
$content = $content -replace '</head>', "    <!-- PWA Manifest -->`r`n    <link rel=`"manifest`" href=`"manifest.json`">`r`n</head>"

# 2. Ajouter skip link après <body>
$content = $content -replace '<body>', "<body>`r`n    <!-- Skip link pour accessibilité -->`r`n    <a href=`"#main-content`" class=`"skip-link`">Aller au contenu principal</a>`r`n"

# 3. Remplacer le header et la navigation par la version horizontale
$oldHeader = '    <!-- Header -->\r\n    <header role="banner">\r\n        <div class="container">\r\n            <div class="header-content">\r\n                <div class="logo-section">\r\n                    <div class="logo">\r\n                        <span class="logo-dicta">Dicta</span><span class="logo-med">Med</span>\r\n                    </div>\r\n                    <p class="slogan">Où la voix rencontre les chiffres</p>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </header>\r\n\r\n    <!-- Navigation par onglets -->\r\n    <nav class="tabs-nav" role="navigation" aria-label="Navigation principale">'

$newHeader = '    <!-- Header avec navigation intégrée -->\r\n    <header role="banner">\r\n        <div class="container">\r\n            <div class="header-nav-container">\r\n                <!-- Logo à gauche -->\r\n                <div class="logo-section">\r\n                    <div class="logo">\r\n                        <span class="logo-dicta">Dicta</span><span class="logo-med">Med</span>\r\n                    </div>\r\n                    <p class="slogan">Où la voix rencontre les chiffres</p>\r\n                </div>\r\n                \r\n                <!-- Navigation à droite -->\r\n                <nav class="tabs-nav" role="navigation" aria-label="Navigation principale">'

$content = $content -replace [regex]::Escape($oldHeader), $newHeader

# 4. Fermer correctement le header après les tabs
$oldNavEnd = '        </div>\r\n    </nav>'
$newNavEnd = '                </div>\r\n            </nav>\r\n            </div>\r\n        </div>\r\n    </header>'

$content = $content -replace [regex]::Escape($oldNavEnd), $newNavEnd

# 5. Ajouter le badge développement au mode DMI
$dmiStart = '        <!-- ONGLET 6: MODE DMI -->\r\n        <section id="mode-dmi" class="tab-content">\r\n            <h1>📋 Mode DMI</h1>'

$dmiWithBadge = '        <!-- ONGLET 6: MODE DMI -->\r\n        <section id="mode-dmi" class="tab-content">\r\n            <!-- Badge En Développement -->\r\n            <div class="development-badge">\r\n                <span class="badge-icon">🚧</span>\r\n                <div class="badge-content">\r\n                    <h2>Mode en Développement</h2>\r\n                    <p>Cette fonctionnalité est actuellement en cours de développement et n''est pas encore disponible.</p>\r\n                </div>\r\n            </div>\r\n            \r\n            <h1>📋 Mode DMI</h1>'

$content = $content -replace [regex]::Escape($dmiStart), $dmiWithBadge

# 6. Modifier le bouton DMI
$oldDMIButton = '<button class="btn btn-submit" id="submitDMI" disabled>Envoyer les données DMI</button>'
$newDMIButton = '<button class="btn btn-submit" id="submitDMI" disabled title="Fonction en cours de développement">\r\n                    Envoyer les données DMI (Indisponible)\r\n                </button>'

$content = $content -replace [regex]::Escape($oldDMIButton), $newDMIButton

# 7. Modifier le message d'avertissement DMI
$oldWarning = '                <p class="info-box" style="display: inline-block; margin-bottom: 20px;">\r\n                    ⚠️ Le numéro de dossier est <strong>obligatoire</strong> pour envoyer les données.\r\n                </p>'

$newWarning = '                <p class="info-box warning-box" style="display: inline-block; margin-bottom: 20px;">\r\n                    🚧 <strong>Mode en développement</strong> - L''envoi de données n''est pas encore disponible.\r\n                </p>'

$content = $content -replace [regex]::Escape($oldWarning), $newWarning

# Sauvegarder
$content | Set-Content "c:\developerMode\index.html" -Encoding UTF8 -NoNewline

Write-Host "Modifications appliquées avec succès!"
