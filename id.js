document.addEventListener("DOMContentLoaded", () => {
    const moduleSelect = document.getElementById("module");
    const optionSelect = document.getElementById("option");
    const subOptionSelect = document.getElementById("subOption");
    const resultDiv = document.getElementById("result");
    const generateBtn = document.getElementById("generateBtn");
		
    const modules = {
    'A': {
        'name': 'Comptoir',
        'options': {
            'J': 'Facturation',
            'K': 'Ventes commerciales',
            'L': 'Ventes à facturer',
            'M': {
                'name': 'Rappel',
                'sub_options': {
                    'T': 'Rappel sur erreur',
                    'U': 'Renouvellement',
                    'V': 'Rappel en attente',
                    'W': 'Rappel Bons Livraison'
                }
            },
            'N': {
                'name': 'Encaissement',
                'sub_options': {
                    'T': 'Encaissement crédit',
                    'U': 'Caisse centrale'
                }
            },
            'O': 'Rétrocession / Retours fournisseurs',
            'P': 'Entrées / Sorties d’espèces',
            'Q': {
                'name': 'Messages DP',
                'sub_options': {
                    'T': 'Messages Alerte DP',
                    'U': 'Ruptures DP'
                }
            },
            'R': 'Bordereaux de livraison',
            'S': 'Remise des produits dus'
        }
    },
    'B': {
        'name': 'Gestion Stock',
        'options': {
            'J': 'Préparation commande Répartiteur',
            'K': 'Préparation commande Directe',
            'L': 'Transmission Commande',
            'M': 'Réception Commande',
            'N': 'Commandes planifiées',
            'O': 'Édition des Étiquettes papier',
            'P': 'Produits dus',
            'Q': 'Réapprovisionnement / Déplacement de stocks',
            'R': 'Saisie de l’Inventaire',
            'S': 'Édition de l’inventaire',
            'T': 'Entrées/Sorties',
            'U': 'Observatoire des étiquettes électroniques',
            'V': 'Historique des boîtes sérialisées'
        }
    },
    'C': {
        'name': 'Données',
        'options': {
            'J': 'Patient',
            'K': 'Praticiens',
            'L': 'Produits',
            'M': 'Génériques et Biosimilaires',
            'N': {
                'name': 'Organisme',
                'sub_options': {
                    'W': 'Organismes',
                    'X': 'Conventions AMC',
                    'Y': 'Regroupements AMC',
                    'Z': 'Correspondances AMC'
                }
            },
            'O': 'Fournisseurs',
            'P': 'Promotions',
            'Q': 'Fixation prix de vente',
            'R': {
                'name': 'Profils et Opérateurs',
                'sub_options': {
                    'W': 'Profils',
                    'X': 'Opérateurs',
                    'Y': 'Gestion des contrôles de sécurité'
                }
            },
            'S': 'LPP Référence',
            'T': 'Programmes Avantages et Relationnels',
            'U': {
                'name': 'Autres Données',
                'sub_options': {
                    'W': 'Gestion des Zones Géo',
                    'X': 'Gestion des Dépôts',
                    'Y': 'Classifications internes',
                    'Z': 'Codifications Libres',
                    '1': 'Profils de Remise'
                }
            },
            'V': 'Collectivités'
        }
    },
    'D': {
        'name': 'Suivi Administratif',
        'options': {
            'J': {
                'name': 'Encours Règlements',
                'sub_options': {
                    'U': 'Saisie Règlements T.P',
                    'V': 'Consultation Règlements T.P',
                    'W': 'Encours T.P',
                    'X': 'Gestion des Relances',
                    'Y': 'Balance Comptable T.P',
                    'Z': 'Crédits',
                    '1': 'Balance Comptable des Crédits',
                    '2': 'Suivi Financier T.P'
                }
            },
            'K': {
                'name': 'Télétransmission caisse',
                'sub_options': {
                    'U': 'Constitution des Lots',
                    'V': 'Transmission',
                    'W': 'Messages de Service',
                    'X': 'Consultation des Lots',
                    'Y': 'Consultation des accusés de réception lot',
                    'Z': 'Consultation des Fichiers',
                    '1': 'Constitution des Cédéroms'
                }
            },
            'L': {
                'name': 'Gestion Bande de Caisse',
                'sub_options': {
                    'U': 'Actes Provisoires',
                    'V': 'Actes Définitifs',
                    'W': 'Consolidation',
                    'X': 'Bordereau CHQ/CB',
                    'Y': 'Gestion du fonds de caisse',
                    'Z': 'Consultation des clôtures'
                }
            },
            'M': {
                'name': 'Suivi Factures',
                'sub_options': {
                    'U': 'Suivi Factures',
                    'V': 'Contrôle Ordonnances'
                }
            },
            'N': 'Bordereaux Organismes',
            'O': {
                'name': 'Ordonnanciers / Stupéfiants',
                'sub_options': {
                    'U': 'Edition Ordonnanciers',
                    'V': 'Edition Balance Stupéfiants',
                    'W': 'Destruction Stupéfiants'
                }
            },
            'P': 'Relevé des Opérations',
            'Q': {
                'name': 'Réédition',
                'sub_options': {
                    'U': 'Caisse',
                    'V': 'Gestion Administrative',
                    'W': 'Télétransmission',
                    'X': 'Stock',
                    'Y': 'Documentation',
                    'Z': 'Traçabilité',
                }
            },
            'R': 'Modules',
            'S': 'Livraison hors pilulier',
            'T': 'Télédéclaration Activité Annuelle'
        }
    },
    'E': {
        'name': 'Configuration',
        'options': {
            'J': {
                'name': 'Gestion Stock',
                'sub_options': {
                    'S': 'Générale',
                    'T': 'Commandes',
                    'U': 'Table de Rotation',
                    'V': 'Affectation Commande Répartiteur',
                    'W': 'Filtres et Alertes',
                    'X': 'Inventaire',
                    'Y': 'Gestion des codes réponse'
                }
            },
            'K': {
                'name': 'Matériel',
                'sub_options': {
                    'S': 'Matériel',
                    'T': 'Lecteur'
                }
            },
            'L': {
                'name': 'Officine',
                'sub_options': {
                    'S': 'Modes de Règlements',
                    'T': 'Formulaires',
                    'U': 'Paramètres Officine',
                    'V': 'TVA',
                    'W': 'Majorations Dispositifs Médicaux',
                    'X': 'Paramètres Postes',
                    'Y': 'Frais de Douane'
                }
            },
            'M': 'Ordonnanceur',
            'N': {
                'name': 'Gestion Avancée',
                'sub_options': {
                    'S': 'Maintenance Organismes',
                    'T': 'Prestations',
                    'U': 'Régimes',
                    'V': 'Règles',
                    'W': 'Couvertures',
                    'X': 'Paramètres Officine',
                    'Y': 'Spécialités'
                }
            },
            'O': {
                'name': 'BDM',
                'sub_options': {
                    'S': 'Paramétrage Import',
                    'T': 'Paramétrage MAJ Base Produit'
                }
            },
            'P': 'Campagnes',
            'Q': {
                'name': 'Télétransmission',
                'sub_options': {
                    'S': 'Destinataire FSE',
                    'T': 'Modules'
                }
            },
            'R': {
                'name': 'Etiquette',
                'sub_options': {
                    'S': 'Planches d’étiquettes',
                    'T': 'Modèles d’étiquettes'
                }
            }
        }
    },
    'F': {
        'name': 'BDD Médic',
        'options': {
            'J': 'Recherche Produit',
            'K': 'MAJ des Produits'
        }
    },
    'G': {
        'name': 'Utilitaires / Listes',
        'options': {
            'J': {
                'name': 'Logiciel',
                'sub_options': {
                    'Q': 'Codification Produits',
                    'R': 'Générateur d’États',
                    'S': 'Purge des Données',
                    'T': 'OffiDoses',
                    'U': 'Messagerie',
                    'V': 'Archivage des Documents Numérisés',
                    'W': 'Bilan Financier',
                    'X': 'Synthèse Paramètres Officine',
					'Y': 'Id Pay',
                    'Z': 'Modules d’Extraction'
                }
            },
            'K': {
                'name': 'Technique',
                'sub_options': {
                    'Q': 'Sauvegarde',
                    'R': 'Système',
                    'S': 'Télémaintenance'
                }
            },
            'L': {
                'name': 'Listes',
                'sub_options': {
                    'Q': 'Produits Avancés',
                    'R': 'Stocks à Contrôler',
                    'S': 'Catalogue des Médicaments',
                    'T': 'Praticiens',
                    'U': 'Collectivités',
                    'V': 'Relevé Activité',
                    'W': 'LPP Dispositifs Médicaux',
                    'X': 'Achats',
                    'Y': 'Produits Vendus'
                }
            },
            'M': {
                'name': 'Traçabilité',
                'sub_options': {
                    'Q': 'Traçabilité Stock/Prix',
                    'R': 'Traçabilité Ventes',
					'S': 'traçabilité INS',
					'T': 'Traçabilité incivilité'
                }
            },
			'N': {
				'name': 'Cession d officine',
				'sub_options': {
					'Q': 'Vente de votre officine - cédant',
					'R': 'Vente de votre officine - repreneur',
					'S': 'Portabilité des données'
				}
			},
            'O': 'Tableau de Bord SEGUR',
            'P': 'Données Externalisées'
        }
    },
    'H': {
        'name': 'Service Suivi Patient',
        'options': {
            'J': 'ID Care+',
            'K': 'Suivi des programmes (SMS-Mail-MPM)',
            'L': 'Suivi des SMS-Mails',
            'M': 'Supervision des services patients'
        }
    },
    'I': {
        'name': 'Location',
        'options': {
            'J': 'Matériel de Location',
            'K': 'Ouverture de Dossier',
            'L': 'Facturation et Suivi des Dossiers',
			'M': 'Liste Matériel de Location'
        }
    }
};
function updateOptions() {
    let moduleValue = moduleSelect.value;

    // Réinitialise les listes
    optionSelect.innerHTML = '<option value="">Sélectionner</option>';
    subOptionSelect.innerHTML = '<option value="">Sélectionner</option>';

    // Cacher par défaut
    document.getElementById('optionContainer').style.display = 'none';
    document.getElementById('subOptionContainer').style.display = 'none';

    // Affiche les options seulement si un module est sélectionné
    if (moduleValue && modules[moduleValue]) {
        let module = modules[moduleValue];
        let options = module.options;

        for (let key in options) {
            let label = typeof options[key] === 'string'
                ? `${key}: ${options[key]}`
                : `${key}: ${options[key].name}`;
            optionSelect.innerHTML += `<option value="${key}">${label}</option>`;
        }

        document.getElementById('optionContainer').style.display = 'block';
    }

    updateSubOptions(); 
    generateSentence(); 
}

function updateSubOptions() {
    let moduleValue = moduleSelect.value;
    let optionValue = optionSelect.value;
    subOptionSelect.innerHTML = '<option value="">Sélectionner</option>';

    document.getElementById('subOptionContainer').style.display = 'none';

    if (moduleValue && optionValue) {
        let module = modules[moduleValue];
        let option = module.options[optionValue];

        if (option && option.sub_options) {
            let subOptions = option.sub_options;
            let sortedKeys = Object.keys(subOptions).sort((a, b) => {
                let isAlphaA = /^[a-zA-Z]+$/.test(a);
                let isAlphaB = /^[a-zA-Z]+$/.test(b);

                if (isAlphaA && !isAlphaB) return -1;
                if (!isAlphaA && isAlphaB) return 1;
                return a.localeCompare(b, undefined, { numeric: true });
            });

            if (sortedKeys.length > 0) {
                for (let key of sortedKeys) {
                    subOptionSelect.innerHTML += `<option value="${key}">${key}: ${subOptions[key]}</option>`;
                }
                document.getElementById('subOptionContainer').style.display = 'block';
            }
        }
    }

    generateSentence(); 
}


	// Chargement phrase
	window.addEventListener('DOMContentLoaded', () => {
		const savedIntro = localStorage.getItem('customIntroText');
		if (!savedIntro) {
			localStorage.setItem('customIntroText', 'Je vous invite à suivre le chemin suivant :');
		}
	});

	// enregistrer la nouvelle phrase
	document.getElementById('changeIntroBtn').addEventListener('click', () => {
		const currentIntro = localStorage.getItem('customIntroText') || 'Je vous invite à suivre le chemin suivant :';
		const newIntro = prompt('Modifiez le texte d’introduction :', currentIntro);

		if (newIntro !== null && newIntro.trim() !== '') {
			localStorage.setItem('customIntroText', newIntro.trim());
			alert('mis à jour avec succès !');
		}
	});

	// génération phrase
	function generateSentence() {
		let moduleValue = moduleSelect.value;
		let optionValue = optionSelect.value;
		let subOptionValue = subOptionSelect.value;

		const introText = localStorage.getItem('customIntroText') || 'Je vous invite à suivre le chemin suivant :';

		if (moduleValue && optionValue) {
			let module = modules[moduleValue];
			let option = module.options[optionValue];
			let subOptionName = subOptionValue && option.sub_options
				? option.sub_options[subOptionValue]
				: '';

			let resultText = `${introText}\n• Menu ID\n• ${moduleValue}: ${module.name}`;
			resultText += `\n• ${optionValue}: ${typeof option === 'string' ? option : option.name}`;

			if (subOptionName) {
				resultText += `\n• ${subOptionValue}: ${subOptionName}`;
			}

			resultDiv.textContent = resultText;
			resultDiv.classList.add('visible');

			navigator.clipboard.writeText(resultText.trim()).then(() => {
				console.log('La phrase a été copiée dans le presse-papiers');
			}).catch(error => {
				console.error('Erreur lors de la copie : ' + error);
			});
		} else {
			resultDiv.classList.remove('visible');
			resultDiv.textContent = '';
		}
	}


	let suggestionClicked = false;

	document.getElementById('searchInput').addEventListener('input', function () {
		const query = this.value.toLowerCase().trim();
		const resultsContainer = document.getElementById('resultsContainer');
    
		// Si champs est vide, ne pas afficher de suggestions et cacher le menu
		if (!query) {
			resultsContainer.innerHTML = ''; // Réinitialise les résultats
			resultsContainer.style.display = 'none'; // Cache le container de résultats
			return;
		}

		if (suggestionClicked) {
		return;
	}
	
	
	let matches = [];

for (let moduleKey in modules) {
    const module = modules[moduleKey];

    for (let optionKey in module.options) {
        const option = module.options[optionKey];
        const optionName = typeof option === 'string' ? option : option.name;
        const fullOption = `${optionKey}: ${optionName}`.toLowerCase();

        let subMatches = [];
        let hasMatchingSubOption = false;

        // Vérifie sous-options
        if (option.sub_options) {
            for (let subKey in option.sub_options) {
                const subValue = option.sub_options[subKey];
                const fullSub = `${subKey}: ${subValue}`.toLowerCase();
                if (fullSub.includes(query)) {
                    hasMatchingSubOption = true;

                    // Chemin moduleKey
                    const matchLabel = `${moduleKey}: ${module.name} / ${optionKey}: ${optionName} / ${subKey}: ${subValue}`;
                    subMatches.push({
                        match: matchLabel,
                        moduleKey,
                        optionKey,
                        subOption: subKey
                    });
                }
            }
        }

        // Ajouter option  uniquement si aucune sous-option
        if (fullOption.includes(query) && !hasMatchingSubOption) {
            const matchLabel = `${moduleKey}: ${module.name} / ${optionKey}: ${optionName}`;
            matches.push({
                match: matchLabel,
                moduleKey,
                optionKey,
                subOption: null
            });
        }

        // Ajouter les sous-options correspondantes
        matches.push(...subMatches);
    }
}

    // Si des correspondances sont trouvées
    if (matches.length > 0) {
        // Affiche résultats
        resultsContainer.style.display = 'block';

        // menu pour afficher les résultats
        resultsContainer.innerHTML = ''; // Réinitialise 

        // afficher match
        matches.forEach(match => {
            let resultItem = document.createElement('div');
            resultItem.classList.add('result-item');
            resultItem.textContent = match.match;

            resultItem.addEventListener('click', function() {

                suggestionClicked = true;

                // masquer les résultats après un clic sur une suggestion
                document.getElementById('searchInput').value = '';
                resultsContainer.innerHTML = ''; // Masque 
				resultsContainer.style.display = 'none';

                moduleSelect.value = match.moduleKey;
                updateOptions();

                setTimeout(() => {
                    optionSelect.value = match.optionKey;
                    updateSubOptions();

                    setTimeout(() => {
                        if (match.subOption) {
                            subOptionSelect.value = match.subOption;
                        }
                        generateSentence();
                    }, 100);
                }, 100); 
            });

            resultsContainer.appendChild(resultItem);
        });
    } else {
        // Si aucune correspondance n'est trouvée /cacher le menu
        resultsContainer.style.display = 'none';
    }
});

// Réinitialiser champs 
document.getElementById('searchInput').addEventListener('focus', function () {
    suggestionClicked = false;
});


// Événements
moduleSelect.addEventListener("change", updateOptions);
optionSelect.addEventListener("change", () => {
    updateSubOptions();
    generateSentence();
});
subOptionSelect.addEventListener("change", generateSentence);

});