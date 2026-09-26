// Démarrage de l'extension.
import { store } from './store.js';
import { backupIfDue } from './core/backup.js';
import { initRubriques, renderLists, renderRubriques, renderBackupInfo } from './views/rubriques.js';
import { initPhrases } from './views/phrases.js';
import { initNavigation } from './views/navigation-id.js';

store.load();

initRubriques();
initPhrases({ onDataChange: renderRubriques });
initNavigation();
renderLists();

try {
  document.getElementById('version').textContent = 'v' + chrome.runtime.getManifest().version;
} catch {
  document.getElementById('version').textContent = '';
}

backupIfDue();
renderBackupInfo();
