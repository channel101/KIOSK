import { supabase } from './supabase';

export async function getDevice(storeNumber, deviceCode) {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('store_number', storeNumber)
    .eq('device_code', deviceCode)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function upsertDevice(storeNumber, deviceCode, data) {
  const { data: result, error } = await supabase
    .from('devices')
    .upsert(
      {
        store_number: storeNumber,
        device_code: deviceCode,
        ...data,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'store_number,device_code',
      },
    )
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteDevice(storeNumber, deviceCode) {
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('store_number', storeNumber)
    .eq('device_code', deviceCode);

  if (error) throw error;
}

export function subscribeToDevice(storeNumber, deviceCode, callback) {
  const channel = supabase
    .channel(`device:${storeNumber}:${deviceCode}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'devices',
        filter: `store_number=eq.${storeNumber}`,
      },
      payload => {
        if (payload.eventType === 'DELETE') {
          if (payload.old?.device_code === deviceCode) {
            callback(null);
          }
        } else if (payload.new?.device_code === deviceCode) {
          callback(payload.new);
        }
      },
    )
    .subscribe(status => {});

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getStoreSettings(storeNumber) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('store_number', storeNumber)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function getAdminInfo(userId) {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function getMenu(storeNumber) {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('store_number', storeNumber)
    .eq('version', 'v5');

  if (error) throw error;
  return data;
}

export async function getCategories(storeNumber) {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('store_number', storeNumber)
    .order('order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export function subscribeToMenu(storeNumber, callback) {
  const channel = supabase
    .channel(`menu:${storeNumber}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'menus',
        filter: `store_number=eq.${storeNumber}`,
      },
      payload => {
        callback(payload);
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'menu_categories',
        filter: `store_number=eq.${storeNumber}`,
      },
      payload => {
        callback(payload);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createOrder(storeNumber, orderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      store_number: storeNumber,
      ...orderData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getNextOrderNumber(storeNumber) {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase.rpc('get_next_order_number', {
    p_store_number: storeNumber,
    p_date: today,
  });

  if (error) throw error;
  return data;
}
