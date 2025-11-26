# Fix index.html structure
$content = Get-Content "index.html.backup" -Raw

# Find where mode-normal section should end (before the orphaned content)
# We'll look for the optional toggle button which is the last proper element
$pattern = '(\s+<!-- Bouton section optionnelle -->[\s\S]*?</div>\r?\n)'

# Add proper closing and new sections
$replacement = @'
            <!-- Bouton section optionnelle -->
            <div class="optional-toggle">
                <button class="btn btn-secondary" id="togglePartie4">Afficher Partie 4 (optionnelle)</button>
            </div>

            <!-- Envoi des données -->
            <div class="submit-section">
                <p class="sections-count" data-mode="normal" aria-live="polite" aria-atomic="true">0 section(s)
                    enregistrée(s)</p>
                <button class="btn btn-submit" id="submitNormal" disabled
                    aria-label="Envoyer les données enregistrées au serveur" aria-describedby="submit-hint">
                    Envoyer les données
                </button>
                <span id="submit-hint" class="sr-only">Veuillez remplir tous les champs obligatoires</span>
            </div>
        </section>

'@

# Read the missing sections
$missingSections = Get-Content "missing_sections.html" -Raw

# Insert at the correct location
$newContent = $content -replace 'fictives[\s\S]*?Aucune inscription requise !\s*</p>', $replacement + $missingSections

# Save
$newContent | Out-File "index_fixed.html" -Encoding UTF8
Write-Host "Fixed file created: index_fixed.html"
