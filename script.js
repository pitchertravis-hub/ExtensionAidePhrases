document.addEventListener('DOMContentLoaded', function() {
    // Écouteurs d'événements
    document.getElementById('addListBtn').addEventListener('click', addList);
    document.getElementById('addRubriqueBtn').addEventListener('click', addRubrique);
    document.getElementById('backBtn').addEventListener('click', showInterface1);
    document.getElementById('backBtn2').addEventListener('click', showInterface1);
    document.getElementById('addPhraseBtn').addEventListener('click', addPhrase);
    document.getElementById('listSelect').addEventListener('change', function() {
        saveSelectedList(this.value);
        updateRubriqueList();
    });
   
	// Sauvegarde
	function saveData() {
    localStorage.setItem('listes', JSON.stringify(listes));
	}

	// Charger
	function loadData() {
		const result = localStorage.getItem('listes');
		if (result) {
			const parsedResult = JSON.parse(result);
			// Migration des anciennes données
			for (let listName in parsedResult) {
				if (!parsedResult[listName].rubriques) {
					parsedResult[listName] = {
						rubriques: Object.keys(parsedResult[listName]).map(name => ({
							name: name,
							phrases: parsedResult[listName][name]
						}))
					};
				}
			}
			listes = parsedResult;
			updateListSelect();
			loadSelectedList();
		}
	}
	
	// structure
	let listes = {};
	
	// Vue interface 1
	function showInterface1() {
		document.getElementById("interface1").classList.remove("hidden");
		document.getElementById("interface2").classList.add("hidden");
		document.getElementById("interface3").classList.add("hidden");	

		// Réinitialiser la barre de recherche
		document.getElementById("searchBar").value = ""; 
		// Réafficher toutes les rubriques
		document.querySelectorAll("#rubriqueList li").forEach(rubrique => {
        rubrique.style.display = "block";
		});	
    }
	
	// Ajouter liste
    function addList() {
        let listName = prompt("Nom de la nouvelle liste :");
        if (listName && !listes[listName]) {
            listes[listName] = { rubriques: [] };
            saveData();
            updateListSelect();
        }
    }
	
	// Maj liste
    function updateListSelect() {
        let select = document.getElementById("listSelect");
        let currentValue = select.value;
        select.innerHTML = '<option value="">Sélectionnez</option>';
        
        for (let listName in listes) {
            let option = new Option(listName, listName);
            select.appendChild(option);
        }
        select.value = currentValue;
        updateRubriqueList();
    }

    // Ajouter rubrique
    function addRubrique() {
        let listName = document.getElementById("listSelect").value;
        if (!listName) return alert("Veuillez d'abord sélectionner une liste !");

        let rubriqueName = prompt("Entrez le nom de la nouvelle rubrique :");
        if (rubriqueName) {
            listes[listName].rubriques.push({
                name: rubriqueName,
                phrases: []
            });
            saveData();
            updateRubriqueList();
        }
    }
	
	// Clic droit sur une liste
	document.getElementById('listSelect').addEventListener('contextmenu', function(event) {
		event.preventDefault();
		let listName = event.target.value;
		if (listName && listes[listName]) {
			showContextMenu(event.pageX, event.pageY);

			// Action de modification de la liste
			document.getElementById('editlist').onclick = function() {
				editList(listName);
				hideContextMenu();
			};

			// Action de suppression de la liste
			document.getElementById('deletelist').onclick = function() {
				deleteList(listName);
				hideContextMenu();
			};
		}
	});

	// Afficher le menu contextuel
	function showContextMenu(x, y) {
		let contextMenu = document.getElementById('contextMenu1');
		contextMenu.style.left = `${x}px`;
		contextMenu.style.top = `${y}px`;
		contextMenu.style.display = 'block';

		document.addEventListener('mousedown', closeContextMenuIfOutside);
	}

	// Fermer le menu si un clic  ailleurs
	function closeContextMenuIfOutside(event) {
		let contextMenu = document.getElementById('contextMenu1');
		
		if (contextMenu && !contextMenu.contains(event.target)) {
			hideContextMenu();
			
			document.removeEventListener('mousedown', closeContextMenuIfOutside);
		}
	}

	// Masquer le menu contextuel
	function hideContextMenu() {
		let contextMenu = document.getElementById('contextMenu1');
		if (contextMenu) {
			contextMenu.style.display = 'none';
		}
	}

	// Modifier la liste
	function editList(listName) {
		let newListName = prompt("Modifier le nom de la liste :", listName);
		if (newListName && newListName !== listName && !listes[newListName]) {
			listes[newListName] = listes[listName];
			delete listes[listName];
			saveData();
			updateListSelect();
		}
	}

	// Supprimer la liste
	function deleteList(listName) {
		let confirmDelete = confirm("Êtes-vous sûr de vouloir supprimer cette liste ?");
		if (confirmDelete) {
			delete listes[listName];
			saveData();
			updateListSelect();
		}
	}
	
	//Maj rubrique
    function updateRubriqueList() {
        let listName = document.getElementById("listSelect").value;
        let ul = document.getElementById("rubriqueList");
        ul.innerHTML = "";

        if (!listName || !listes[listName]) return;

        listes[listName].rubriques.forEach((rubrique, index) => {
            let li = document.createElement("li");
            li.textContent = rubrique.name;
            li.dataset.index = index;
            li.addEventListener('click', () => showPhrases(listName, index));
            
            // Menu contextuel
            li.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showRubriqueContextMenu(e, listName, index);
            });

            ul.appendChild(li);
        });

        initRubriqueSortable();
    }

	// Glisser / Déposer rubrique
    function initRubriqueSortable() {
        new Sortable(document.getElementById('rubriqueList'), {
            animation: 150,
            onEnd: function(evt) {
                let listName = document.getElementById("listSelect").value;
                const rubriques = listes[listName].rubriques;
                const movedItem = rubriques.splice(evt.oldIndex, 1)[0];
                rubriques.splice(evt.newIndex, 0, movedItem);
                saveData();
				updateRubriqueList();
            }
        });
		
    }

	// Afficher rubrique
    function showRubriqueContextMenu(e, listName, index) {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;
		
		// clique droit modifier
        document.getElementById('editRubrique').onclick = () => {
            modifyRubrique(listName, index);
            contextMenu.style.display = 'none';
        };
		
		//Clique droit supprimer
        document.getElementById('deleteRubrique').onclick = () => {
            deleteRubrique(listName, index);
            contextMenu.style.display = 'none';
        };

        document.addEventListener('click', () => contextMenu.style.display = 'none', { once: true });
    }

	// Modifier le nom rubrique
    function modifyRubrique(listName, index) {
        const newName = prompt("Nouveau nom :", listes[listName].rubriques[index].name);
        if (newName) {
            listes[listName].rubriques[index].name = newName;
            saveData();
            updateRubriqueList();
        }
    }

	// Suppimer la rubrique
    function deleteRubrique(listName, index) {
        if (confirm(`Supprimer "${listes[listName].rubriques[index].name}" ?`)) {
            listes[listName].rubriques.splice(index, 1);
            saveData();
            updateRubriqueList();
        }
    }
	
    // Vue interface 2
    function showPhrases(listName, rubriqueIndex) {
        document.getElementById("interface1").classList.add("hidden");
        document.getElementById("interface2").classList.remove("hidden");
		document.getElementById("interface3").classList.add("hidden");
        document.getElementById("rubriqueTitle").textContent = 
            listes[listName].rubriques[rubriqueIndex].name;
        
        updatePhraseList(listName, rubriqueIndex);
    }
	

	// phrase
	function updatePhraseList(listName, rubriqueIndex) {
	const container = document.getElementById("phraseList");
	container.innerHTML = "";

	const phrases = listes[listName].rubriques[rubriqueIndex].phrases;
    
		phrases.forEach((phrase, index) => {
			const div = document.createElement("div");
			div.className = "phrase-container";
			div.draggable = true;
			div.dataset.index = index;

			const content = document.createElement("div");
			content.className = "editable-text";
			content.contentEditable = true;
			content.innerHTML = phrase.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
		
			// clique les liens
			content.addEventListener('click', (e) => {
			if (e.target.tagName === 'A') {
			e.preventDefault();
				window.open(e.target.href, '_blank');
				}
			});
        
			content.addEventListener('click', () => {
				// Marquer la phrase comme sélectionnée
				document.querySelectorAll(".phrase-container").forEach(div => div.classList.remove("selected"));
				div.classList.add("selected");
			});
			
			content.addEventListener('paste', (e) => {
				const clipboardData = e.clipboardData || window.clipboardData;
				const items = clipboardData.items;

				let hasText = false;

				for (let i = 0; i < items.length; i++) {
					if (items[i].kind === 'string') {
						hasText = true;
						break;
					}
				}

				if (hasText) {
					e.preventDefault();
					const text = clipboardData.getData('text/plain');
					document.execCommand('insertText', false, text);
				}
			});


			content.addEventListener('input', () => {
				phrases[index] = content.innerHTML;
				saveData();
			});

			const buttons = document.createElement("div");
			buttons.className = "button-container";

			const btnCopy = document.createElement("button");
			btnCopy.className = "btn copy-btn";
			btnCopy.innerHTML = '<i class="fas fa-copy"></i>';

				// Cette fonction est appelée chaque fois qu'un contenu est mis à jour.
			const updateCopyButton = (content) => {
			btnCopy.onclick = () => copyPhraseContent(content.innerHTML);
			};

			updateCopyButton(content);

			buttons.append(btnCopy);
			div.append(content, buttons);
			container.appendChild(div);
		});

		initPhraseSortable(listName, rubriqueIndex);
	}
	
	

	addGlobalDeleteButton();

	// Glisser / deposer phrases
	function initPhraseSortable(listName, rubriqueIndex) {
		const container = document.getElementById('phraseList');

		// Vérifier et supprimer l'instance précédente
		if (container._sortable) {
			container._sortable.destroy();
		}

		container._sortable = new Sortable(container, {
			animation: 150,
			handle: '.phrase-container',
			onEnd: function(evt) {
				if (evt.oldIndex === evt.newIndex) return;

				const phrases = listes[listName].rubriques[rubriqueIndex].phrases;

				if (evt.oldIndex >= 0 && evt.oldIndex < phrases.length && evt.newIndex >= 0 && evt.newIndex < phrases.length) {
					const movedItem = phrases.splice(evt.oldIndex, 1)[0];
					phrases.splice(evt.newIndex, 0, movedItem);
				}
				saveData();
				updatePhraseList(listName, rubriqueIndex);
			}
		});
	}

	// Ajouter phrase
    function addPhrase() {
        const listName = document.getElementById("listSelect").value;
        const rubriqueIndex = getCurrentRubriqueIndex();
        
        if (rubriqueIndex !== null) {
            listes[listName].rubriques[rubriqueIndex].phrases.push("");
            saveData();
            updatePhraseList(listName, rubriqueIndex);
        }
    }

	// bouton supprimer global
	function addGlobalDeleteButton() {
		const globalDeleteButton = document.getElementById("globalDeleteButton");
		globalDeleteButton.className = "btn global-delete-btn";
		globalDeleteButton.onclick = () => deleteSelectedPhrase();
	}

	// après selection de la phrase "suppression global"
	function deleteSelectedPhrase() {
   
		const selectedPhrase = document.querySelector(".selected"); // exemple de classe marquant la phrase sélectionnée
		if (selectedPhrase) {
			const phraseIndex = selectedPhrase.dataset.index;
			const listName = document.getElementById("listSelect").value;
			const rubriqueIndex = getCurrentRubriqueIndex();

			// Supprimer la phrase
			listes[listName].rubriques[rubriqueIndex].phrases.splice(phraseIndex, 1);
			saveData();
			updatePhraseList(listName, rubriqueIndex);
		} else {
        alert("Veuillez appuyer sur une phrase puis supprimer");
		}
	}

	// copier la phrase avec saut de ligne
	function copyPhraseContent(content) {
    
		const processedHTML = content
			.replace(/<\/div>/gi, '\n')      
			.replace(/<div>/gi, '\n')        
			.replace(/<br\s*\/?>/gi, '\n'); 
		
		const temp = document.createElement("div");
		temp.innerHTML = processedHTML;
		let rawText = temp.textContent || temp.innerText;
		
		rawText = rawText
        .replace(/\n+/g, '\n')  
        .trim(); 
		
		navigator.clipboard.writeText(rawText);
	}
	
	//Affiche titre rubrique
    function getCurrentRubriqueIndex() {
        const title = document.getElementById("rubriqueTitle").textContent;
        const listName = document.getElementById("listSelect").value;
        return listes[listName].rubriques.findIndex(r => r.name === title);
    }
	
	// sauvegarde et chargement de la liste
	function saveSelectedList(listName) {
		localStorage.setItem('selectedList', listName);
	}

	function loadSelectedList() {
		const listName = localStorage.getItem('selectedList');
		if (listName && listes[listName]) {
			document.getElementById("listSelect").value = listName;
			updateRubriqueList();
		}
	}

	// Vue interface 3
	document.getElementById("openInterface3").addEventListener("click", function() {
    document.getElementById("interface1").classList.add("hidden");
    document.getElementById("interface2").classList.add("hidden");
    document.getElementById("interface3").classList.remove("hidden");
	});
	
	// bouton clique paramètre
	document.getElementById('settingsBtn').addEventListener('click', function() {
    const menu = document.getElementById('settingsMenu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
	});

	// import
	document.getElementById('importBtn').addEventListener('click', function() {
	// sélectionner un fichier JSON
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);

                if (typeof importedData !== 'object' || importedData === null) {
                    alert('Fichier invalide : les données importées ne sont pas un objet.');
					return;
					}
					if (confirm("Voulez-vous importer et fusionner les données avec celles existantes ?")) {
                    // Parcourir chaque liste importée
                    for (const listName in importedData) {
                        const importedList = importedData[listName];
                        

							if (!importedList.hasOwnProperty('rubriques')) {
								console.warn(`La liste "${listName}" ne contient pas de rubriques. Elle est ignorée.`);
								continue;
							}
							if (listes.hasOwnProperty(listName)) {
								const currentList = listes[listName];

								importedList.rubriques.forEach(importedRubrique => {
									let existingRubrique = currentList.rubriques.find(r => r.name === importedRubrique.name);

									if (existingRubrique) {
										importedRubrique.phrases.forEach(phrase => {
											if (!existingRubrique.phrases.includes(phrase)) {
												existingRubrique.phrases.push(phrase);
											}
										});
									} else {
										currentList.rubriques.push(importedRubrique);
									}
								});
							} else {
								listes[listName] = importedList;
							}
						}
						saveData();
						
						updateListSelect();

						alert('Import réussi !');
					}
				} catch (error) {
				console.error(error);
				alert("Erreur lors de l'importation du fichier JSON.");
				}
			};

			reader.readAsText(file);
		};

		input.click();
	});

	// Export
	document.getElementById('exportBtn').addEventListener('click', function() {

		const dataStr = JSON.stringify(listes, null, 2);

		const blob = new Blob([dataStr], { type: 'application/json' });

		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = 'Phrase.json';

		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		URL.revokeObjectURL(url);
	});
	
	// Export automatique si besoin
	function exportBackupIfNeeded() {
		const today = new Date();
		const lastExportDate = localStorage.getItem('lastExportDate');

		if (!lastExportDate) {
			// Si aucune exportation précédente n'a été faite, on exporte
			exportData(today);
		} else {
			// Calculer le nombre de jours écoulés
			const lastExportDateObj = new Date(lastExportDate);
			const diffTime = today - lastExportDateObj;
			const diffDays = diffTime / (1000 * 3600 * 24);

			// Si la différence est de 7 jours ou plus, export automatique
			if (diffDays >= 7) {
				exportData(today);
			}
		}
	}

	function exportData(today) {
		// Faire l'export
		const dataStr = JSON.stringify(listes, null, 2);
		const blob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;

		// Format date jour/mois/année
		const day = String(today.getDate()).padStart(2, '0');
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const year = today.getFullYear();
		const formattedDate = `${day}-${month}-${year}`;

		a.download = `Phrases_autosauvegarde_${formattedDate}.json`;

		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		URL.revokeObjectURL(url);

		// Enregistrer
		localStorage.setItem('lastExportDate', today.toISOString());
	}

	// Appel automatique 
	window.addEventListener('DOMContentLoaded', exportBackupIfNeeded);


	// switch mode
	document.getElementById('dark-mode-toggle').addEventListener('click', function() {
		const body = document.body;
		const isDark = body.getAttribute('data-theme') === 'dark';
    
		if(isDark) {
			body.removeAttribute('data-theme');
			localStorage.setItem('theme', 'light');
		} else {
			body.setAttribute('data-theme', 'dark');
			localStorage.setItem('theme', 'dark');
		}
	});


	// Charger le thème sauvegardé
	const savedTheme = localStorage.getItem('theme') || 'light';
	if(savedTheme === 'dark') document.body.setAttribute('data-theme', 'dark');
	
	// reconnaissance vocale
	if (!('webkitSpeechRecognition' in window)) {
		alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
		} else {
		const recognition = new webkitSpeechRecognition();
		recognition.lang = "fr-FR";           
		recognition.continuous = true;        
		recognition.interimResults = false;  

		recognition.onresult = (event) => {
			let transcript = "";
			for (let i = event.resultIndex; i < event.results.length; i++) {
			transcript += event.results[i][0].transcript + " ";
			}
			document.getElementById("output").textContent = transcript;
			// highlight 
			highlightBestRubrique(transcript);
		};

		// Démarrer 
		document.getElementById("start").addEventListener("click", function() {
			this.disabled = true; // Désactive le bouton
			recognition.start();
			this.classList.add("recording"); // Change la couleur
			console.log("Enregistrement démarré");
    			
			recognition.addEventListener("end", () => {
				this.disabled = false;
				this.classList.remove("recording");
				console.log("Enregistrement arrêté");
			});
		});
    }
    
    // Fonction qui met en surbrillance la rubrique
    function highlightBestRubrique(transcript) {
      const rubriques = document.querySelectorAll("#rubriqueList li");
      const normalizedTranscript = normalizeText(transcript);

      let bestMatch = null;
      let bestScore = 0.0;

      rubriques.forEach(rubrique => {
        const rubricText = normalizeText(rubrique.textContent);

        let isContained = rubricText.includes(normalizedTranscript);

        let similarity = 1 - levenshteinDistance(normalizedTranscript, rubricText) / Math.max(normalizedTranscript.length, rubricText.length);

        let score = isContained ? 1.0 : similarity; 

        if (score > bestScore) {
          bestScore = score;
          bestMatch = rubrique;
        }

        rubrique.classList.remove("highlight");
      });
     
      // affiche en surbrillance
      if (bestMatch && bestScore > 0.4) { 
        bestMatch.classList.add("highlight");
      }
    }

    // Fonction (minuscule, sans accents, espaces supprimés, etc.)
    function normalizeText(text) {
      return text.toLowerCase()
		.replace(/[éèêë]/g, "e")
		.replace(/[àâä]/g, "a")
		.replace(/[îï]/g, "i")
		.replace(/[ôö]/g, "o")
		.replace(/[ùûü]/g, "u")
		.replace(/[^a-z0-9]/g, "");
    }

    // Levenshtein entre deux chaînes
    function levenshteinDistance(s1, s2) {
      const len1 = s1.length;
      const len2 = s2.length;
      let matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));

      for (let i = 0; i <= len1; i++) matrix[i][0] = i;
      for (let j = 0; j <= len2; j++) matrix[0][j] = j;

      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,     
            matrix[i][j - 1] + 1,     
            matrix[i - 1][j - 1] + cost 
          );
        }
      }
      return matrix[len1][len2];
    }

	// Barre de recherche
	document.getElementById("searchBar").addEventListener("input", function () {
		let filter = normalizeText(this.value); // Normalisation du texte
		let rubriques = document.querySelectorAll("#rubriqueList li");

		rubriques.forEach(rubrique => {
		let text = normalizeText(rubrique.textContent);

		// Vérifie si chaque lettre de l'entrée est présente dans l'ordre dans le texte
		let isMatch = fuzzyMatch(filter, text);

		// Afficher ou cacher en fonction de la correspondance
		rubrique.style.display = isMatch ? "block" : "none";
		});
	});

	// filtre le mot
	function fuzzyMatch(input, target) {
		let pos = 0;
		for (let char of input) {
			pos = target.indexOf(char, pos);
		if (pos === -1) return false;
			pos++; // Continue la recherche après cette lettre
		}
		return true;
	}

    // Initialisation
    loadData();
});