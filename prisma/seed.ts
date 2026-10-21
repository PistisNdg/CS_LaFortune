import { PrismaClient, Role, Niveau, StatutEleve, LienParent, CanalNotification, TypeJour, StatutPresence, SourcePresence, ResultatScan, StatutJustificatif, StatutNotification } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';
import { env } from '../src/lib/env';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  // Vérifier si SEED_DEMO est activé
  if (!env.SEED_DEMO) {
    console.log('⚠️  SEED_DEMO n\'est pas activé. Seed annulé.');
    console.log('   Activez-le avec: SEED_DEMO=true npm run seed');
    return;
  }

  // Nettoyer la base de données
  console.log('🧹 Nettoyage de la base de données...');
  await prisma.notification.deleteMany();
  await prisma.justificatif.deleteMany();
  await prisma.scan.deleteMany();
  await prisma.presence.deleteMany();
  await prisma.lienParentEleve.deleteMany();
  await prisma.calendrier.deleteMany();
  await prisma.regleHoraire.deleteMany();
  await prisma.affectation.deleteMany();
  await prisma.eleve.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.enseignant.deleteMany();
  await prisma.classe.deleteMany();
  await prisma.anneeScolaire.deleteMany();
  await prisma.utilisateur.deleteMany();
  await prisma.parametre.deleteMany();
  await prisma.journalAudit.deleteMany();

  console.log('✅ Base de données nettoyée');

  // Créer l'année scolaire
  const anneeScolaire = await prisma.anneeScolaire.create({
    data: {
      libelle: '2026-2027',
      dateDebut: new Date('2026-09-01'),
      dateFin: new Date('2027-07-31'),
      estActive: true,
    },
  });
  console.log(`📚 Année scolaire créée: ${anneeScolaire.libelle}`);

  // Créer les règles horaires (après-midi seulement, entrée 12h30)
  await prisma.regleHoraire.createMany({
    data: [
      {
        niveau: Niveau.MATERNELLE,
        heureOuverture: '12:30:00',
        heureLimiteRetard: '13:00:00',
        heureLimiteAbsence: '14:00:00',
        anneeId: anneeScolaire.id,
      },
      {
        niveau: Niveau.PRIMAIRE,
        heureOuverture: '12:30:00',
        heureLimiteRetard: '13:00:00',
        heureLimiteAbsence: '14:00:00',
        anneeId: anneeScolaire.id,
      },
      {
        niveau: Niveau.SECONDAIRE,
        heureOuverture: '12:30:00',
        heureLimiteRetard: '13:00:00',
        heureLimiteAbsence: '14:00:00',
        anneeId: anneeScolaire.id,
      },
    ],
  });
  console.log('⏰ Règles horaires créées');

  // Créer le calendrier scolaire
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Sauter le week-end
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    await prisma.calendrier.create({
      data: {
        date,
        type: TypeJour.COURS,
        libelle: 'Cours normal',
        anneeId: anneeScolaire.id,
      },
    });
  }
  console.log('📅 Calendrier scolaire créé');

  // Créer les classes
  const classes = await Promise.all([
    prisma.classe.create({
      data: {
        anneeId: anneeScolaire.id,
        niveau: Niveau.MATERNELLE,
        nom: 'Maternelle 3',
        effectifMax: 30,
      },
    }),
    prisma.classe.create({
      data: {
        anneeId: anneeScolaire.id,
        niveau: Niveau.PRIMAIRE,
        nom: '2e Primaire A',
        effectifMax: 40,
      },
    }),
    prisma.classe.create({
      data: {
        anneeId: anneeScolaire.id,
        niveau: Niveau.PRIMAIRE,
        nom: '6e Primaire A',
        effectifMax: 40,
      },
    }),
    prisma.classe.create({
      data: {
        anneeId: anneeScolaire.id,
        niveau: Niveau.SECONDAIRE,
        nom: '3e Secondaire',
        effectifMax: 35,
      },
    }),
  ]);
  console.log(`🏫 ${classes.length} classes créées`);

  // Créer les enseignants
  const enseignants = await Promise.all([
    prisma.enseignant.create({
      data: {
        nom: 'Kabongo',
        postnom: 'Mutombo',
        prenom: 'Marie',
        email: 'marie.kabongo@lafortune.cd',
        matierePrincipale: 'Français',
      },
    }),
    prisma.enseignant.create({
      data: {
        nom: 'Mukendi',
        postnom: 'Kasongo',
        prenom: 'Jean',
        email: 'jean.mukendi@lafortune.cd',
        matierePrincipale: 'Mathématiques',
      },
    }),
  ]);
  console.log(`👨‍🏫 ${enseignants.length} enseignants créés`);

  // Affecter les enseignants aux classes
  await prisma.affectation.create({
    data: {
      enseignantId: enseignants[0].id,
      classeId: classes[1].id,
      anneeId: anneeScolaire.id,
    },
  });
  await prisma.affectation.create({
    data: {
      enseignantId: enseignants[1].id,
      classeId: classes[2].id,
      anneeId: anneeScolaire.id,
    },
  });
  console.log('📋 Affectations créées');

  // Créer les parents
  const parents = await Promise.all([
    prisma.parent.create({
      data: {
        nom: 'Mbuyi',
        postnom: 'Kasongo',
        prenom: 'Pierre',
        lien: LienParent.PERE,
        telephoneE164: '+243999123456',
        email: 'pierre.mbuyi@example.com',
        canalPrefere: CanalNotification.EMAIL,
      },
    }),
    prisma.parent.create({
      data: {
        nom: 'Ilunga',
        postnom: 'Mukendi',
        prenom: 'Marie',
        lien: LienParent.MERE,
        telephoneE164: '+243999654321',
        email: 'marie.ilunga@example.com',
        canalPrefere: CanalNotification.WHATSAPP,
      },
    }),
  ]);
  console.log(`👪 ${parents.length} parents créés`);

  // Créer les élèves
  const eleves = await Promise.all([
    prisma.eleve.create({
      data: {
        matricule: 'CSF-2026-00001',
        nom: 'Mbuyi',
        postnom: 'Kasongo',
        prenom: 'Grâce',
        sexe: 'F',
        dateNaissance: new Date('2015-03-15'),
        classeId: classes[2].id,
        statut: StatutEleve.ACTIF,
        qrPublicId: generateRandomId(),
      },
    }),
    prisma.eleve.create({
      data: {
        matricule: 'CSF-2026-00002',
        nom: 'Kasongo',
        postnom: 'Mutombo',
        prenom: 'Jonathan',
        sexe: 'M',
        dateNaissance: new Date('2014-07-22'),
        classeId: classes[1].id,
        statut: StatutEleve.ACTIF,
        qrPublicId: generateRandomId(),
      },
    }),
    prisma.eleve.create({
      data: {
        matricule: 'CSF-2026-00003',
        nom: 'Ilunga',
        postnom: 'Mukendi',
        prenom: 'Esther',
        sexe: 'F',
        dateNaissance: new Date('2009-01-10'),
        classeId: classes[3].id,
        statut: StatutEleve.ACTIF,
        qrPublicId: generateRandomId(),
      },
    }),
    prisma.eleve.create({
      data: {
        matricule: 'CSF-2026-00004',
        nom: 'Kalala',
        postnom: 'Tshibangu',
        prenom: 'Divine',
        sexe: 'F',
        dateNaissance: new Date('2010-05-18'),
        classeId: classes[3].id,
        statut: StatutEleve.ACTIF,
        qrPublicId: generateRandomId(),
      },
    }),
    prisma.eleve.create({
      data: {
        matricule: 'CSF-2026-00005',
        nom: 'Tshala',
        postnom: 'Kasongo',
        prenom: 'Merveille',
        sexe: 'F',
        dateNaissance: new Date('2013-09-30'),
        classeId: classes[2].id,
        statut: StatutEleve.ACTIF,
        qrPublicId: generateRandomId(),
      },
    }),
  ]);
  console.log(`🎓 ${eleves.length} élèves créés`);

  // Lier les parents aux élèves
  await prisma.lienParentEleve.create({
    data: {
      parentId: parents[0].id,
      eleveId: eleves[0].id,
      estContactPrincipal: true,
    },
  });
  await prisma.lienParentEleve.create({
    data: {
      parentId: parents[1].id,
      eleveId: eleves[2].id,
      estContactPrincipal: true,
    },
  });
  console.log('🔗 Liens parent-élève créés');

  // Créer les utilisateurs
  const adminPassword = await hashPassword('Admin123!');
  const directionUser = await prisma.utilisateur.create({
    data: {
      email: 'direction@lafortune.cd',
      passwordHash: adminPassword,
      role: Role.DIRECTION,
      actif: true,
    },
  });

  const enseignantPassword = await hashPassword('Enseignant123!');
  const enseignantUser = await prisma.utilisateur.create({
    data: {
      email: enseignants[0].email!,
      passwordHash: enseignantPassword,
      role: Role.ENSEIGNANT,
      lieAId: enseignants[0].id,
      actif: true,
    },
  });

  const parentPassword = await hashPassword('Parent123!');
  const parentUser = await prisma.utilisateur.create({
    data: {
      email: parents[0].email!,
      passwordHash: parentPassword,
      role: Role.PARENT,
      lieAId: parents[0].id,
      actif: true,
    },
  });

  console.log('👤 Utilisateurs créés:');
  console.log(`   - Direction: direction@lafortune.cd / Admin123!`);
  console.log(`   - Enseignant: ${enseignants[0].email} / Enseignant123!`);
  console.log(`   - Parent: ${parents[0].email} / Parent123!`);

  // Créer des présences de démonstration
  const presenceDay = new Date();
  presenceDay.setHours(0, 0, 0, 0);
  
  await prisma.presence.createMany({
    data: [
      {
        date: presenceDay,
        eleveId: eleves[0].id,
        classeId: classes[2].id,
        anneeId: anneeScolaire.id,
        statut: StatutPresence.PRESENT,
        heureArriveeLocale: '12:45:00',
        source: SourcePresence.SCAN,
      },
      {
        date: presenceDay,
        eleveId: eleves[1].id,
        classeId: classes[1].id,
        anneeId: anneeScolaire.id,
        statut: StatutPresence.PRESENT,
        heureArriveeLocale: '12:50:00',
        source: SourcePresence.SCAN,
      },
      {
        date: presenceDay,
        eleveId: eleves[2].id,
        classeId: classes[3].id,
        anneeId: anneeScolaire.id,
        statut: StatutPresence.RETARD,
        heureArriveeLocale: '13:15:00',
        minutesRetard: 15,
        source: SourcePresence.SCAN,
      },
      {
        date: presenceDay,
        eleveId: eleves[3].id,
        classeId: classes[3].id,
        anneeId: anneeScolaire.id,
        statut: StatutPresence.ABSENT,
        source: SourcePresence.MANUEL,
      },
    ],
  });
  console.log('✅ Présences de démonstration créées');

  // Créer des paramètres par défaut
  await prisma.parametre.createMany({
    data: [
      {
        cle: 'ecole_nom',
        valeur: 'Complexe Scolaire La Fortune',
        description: 'Nom de l\'école',
      },
      {
        cle: 'ecole_adresse',
        valeur: 'Av. Sep-Congo N°12865, Masina/Petro-Congo, Kinshasa, RDC',
        description: 'Adresse de l\'école',
      },
      {
        cle: 'notification_actif',
        valeur: 'false',
        description: 'Activer les notifications automatiques',
      },
    ],
  });
  console.log('⚙️  Paramètres par défaut créés');

  console.log('✅ Seed terminé avec succès!');
}

function generateRandomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
