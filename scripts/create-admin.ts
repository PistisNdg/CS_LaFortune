import { PrismaClient, Role } from '@prisma/client';
import { hashPassword, generateSecurePassword } from '../src/lib/auth';
import { createAdminSupabaseClient } from '../src/lib/supabase-admin';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🔐 Création d\'un compte administrateur Direction\n');

  const email = (await question('Adresse e-mail de l\'administrateur: ')).trim().toLowerCase();

  if (!email || !email.includes('@')) {
    console.error('❌ Adresse e-mail invalide');
    rl.close();
    process.exit(1);
  }

  const existingUser = await prisma.utilisateur.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.error('❌ Un utilisateur avec cet e-mail existe déjà');
    rl.close();
    process.exit(1);
  }

  const useGeneratedPassword = await question('Générer un mot de passe sécurisé automatiquement? (Y/n): ');

  let password: string;

  if (useGeneratedPassword.toLowerCase() === 'n') {
    password = await question('Mot de passe (min 8 caractères): ');

    if (password.length < 8) {
      console.error('❌ Le mot de passe doit contenir au moins 8 caractères');
      rl.close();
      process.exit(1);
    }
  } else {
    password = generateSecurePassword(16);
    console.log(`\n🔑 Mot de passe généré: ${password}`);
    console.log('   ⚠️  Conservez-le précieusement, il ne sera plus affiché!\n');
  }

  const confirm = await question('Confirmer la création du compte? (Y/n): ');

  if (confirm.toLowerCase() === 'n') {
    console.log('❌ Création annulée');
    rl.close();
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);
  let authUserId: string;

  try {
    const supabase = createAdminSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: Role.DIRECTION },
    });

    if (authError || !authData.user) {
      console.error('❌ Erreur Supabase Auth:', authError?.message);
      rl.close();
      process.exit(1);
    }

    authUserId = authData.user.id;

    const { error: dbError } = await supabase.from('utilisateurs').insert({
      id: authUserId,
      email,
      password_hash: passwordHash,
      role: Role.DIRECTION,
      actif: true,
      force_changement_mdp: true,
    });

    if (dbError) {
      await supabase.auth.admin.deleteUser(authUserId);
      console.error('❌ Erreur table utilisateurs:', dbError.message);
      rl.close();
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Supabase non configuré (SUPABASE_SERVICE_ROLE_KEY). Création Prisma seule.');
    const user = await prisma.utilisateur.create({
      data: {
        email,
        passwordHash,
        role: Role.DIRECTION,
        actif: true,
        forceChangementMdp: true,
      },
    });
    console.log('\n⚠️  Compte créé en base Prisma uniquement. Exécutez `node scripts/create-users.js` pour Supabase Auth.');
    console.log(`   Email: ${user.email}`);
    rl.close();
    await prisma.$disconnect();
    return;
  }

  await prisma.utilisateur.upsert({
    where: { email },
    create: {
      id: authUserId!,
      email,
      passwordHash,
      role: Role.DIRECTION,
      actif: true,
      forceChangementMdp: true,
    },
    update: {
      passwordHash,
      actif: true,
    },
  });

  console.log('\n✅ Compte administrateur créé (Supabase Auth + utilisateurs)!');
  console.log(`   Email: ${email}`);
  console.log(`   Rôle: ${Role.DIRECTION}`);

  if (useGeneratedPassword.toLowerCase() !== 'n') {
    console.log(`\n⚠️  Mot de passe: ${password}`);
  }

  rl.close();
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    rl.close();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
