/* Jaggi Properties cloud connector. This module does not modify browser-local listings. */
const JAGGI_SUPABASE_URL = 'https://mwgsvhkcmwykolgqbzcy.supabase.co';
const JAGGI_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_de5rd0alMOHtRmx6n4dC7w_Vn72L-pf';

export async function connectJaggiSupabase() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  return createClient(JAGGI_SUPABASE_URL, JAGGI_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
}

export async function signInAdmin(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function listCloudProperties(client) {
  const { data, error } = await client.from('jp_properties').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveCloudProperty(client, property) {
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) throw new Error('Admin login required');
  const row = {
    id: String(property.id), owner_id: user.id, title: property.title,
    type: property.type, location: property.location, price: Number(property.price),
    area: property.area || '', beds: Number(property.beds || 0),
    baths: Number(property.baths || 0), status: property.status || 'Available',
    description: property.description || '',
    updated_at: new Date().toISOString()
  };
  const { data, error } = await client.from('jp_properties').upsert(row, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return data;
}

export async function uploadPropertyPhoto(client, file, propertyId) {
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) throw new Error('Admin login required');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Unsupported image type');
  const extension = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
  const path = user.id + '/' + encodeURIComponent(String(propertyId)) + '/' + crypto.randomUUID() + '.' + extension;
  const { data, error } = await client.storage.from('jaggi-property-photos').upload(path, file, { contentType: file.type });
  if (error) throw error;
  return data.path;
}
