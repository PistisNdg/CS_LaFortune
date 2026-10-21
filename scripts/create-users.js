const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  {
    email: 'direction@lafortune.cd',
    password: 'Admin123!',
    role: 'DIRECTION',
    appMetadata: { role: 'DIRECTION' },
  },
  {
    email: 'marie.kabongo@lafortune.cd',
    password: 'Enseignant123!',
    role: 'ENSEIGNANT',
    appMetadata: { role: 'ENSEIGNANT' },
  },
  {
    email: 'pierre.mbuyi@example.com',
    password: 'Parent123!',
    role: 'PARENT',
    appMetadata: { role: 'PARENT' },
  },
];

async function findAuthUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureAuthUser(user) {
  let authUser = await findAuthUserByEmail(user.email);

  if (!authUser) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      app_metadata: user.appMetadata,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    authUser = authData.user;
    console.log(`✓ Created Supabase Auth user: ${user.email}`);
  } else {
    const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: user.password,
      email_confirm: true,
      app_metadata: user.appMetadata,
    });
    if (updateError) {
      console.warn(`⚠ Could not reset password for ${user.email}:`, updateError.message);
    } else {
      console.log(`✓ Supabase Auth user exists, password synced: ${user.email}`);
    }
  }

  return authUser;
}

async function ensureUtilisateur(user, authUserId) {
  const passwordHash = await bcrypt.hash(user.password, 12);

  const { data: existing } = await supabase
    .from('utilisateurs')
    .select('id, email')
    .eq('email', user.email)
    .maybeSingle();

  if (!existing) {
    const { error: dbError } = await supabase.from('utilisateurs').insert({
      id: authUserId,
      email: user.email,
      password_hash: passwordHash,
      role: user.role,
      actif: true,
    });
    if (dbError) throw new Error(dbError.message);
    console.log(`✓ Inserted utilisateurs row: ${user.email}`);
    return;
  }

  const { error: updateError } = await supabase
    .from('utilisateurs')
    .update({
      id: authUserId,
      password_hash: passwordHash,
      role: user.role,
      actif: true,
    })
    .eq('email', user.email);

  if (updateError) throw new Error(updateError.message);
  console.log(`✓ Updated utilisateurs row (id = auth uid): ${user.email}`);
}

async function createUsers() {
  console.log('Syncing demo users (Supabase Auth + utilisateurs)...\n');

  for (const user of users) {
    try {
      const authUser = await ensureAuthUser(user);
      await ensureUtilisateur(user, authUser.id);
      console.log('');
    } catch (error) {
      console.error(`✗ ${user.email}:`, error.message, '\n');
    }
  }

  console.log('Done!');
}

createUsers().catch(console.error);
