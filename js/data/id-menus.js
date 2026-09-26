// Catalogue des menus du logiciel ID (module > option > sous-option).
export const MODULES = {
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
