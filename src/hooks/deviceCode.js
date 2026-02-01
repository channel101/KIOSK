import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import base64 from 'react-native-base64';
import DeviceInfo from 'react-native-device-info';
import { supabase } from '../lib/supabase';
import {
  getDevice,
  upsertDevice,
  deleteDevice,
  getStoreSettings,
} from '../lib/supabase-realtime';
import { Alert } from 'react-native';

const STORAGE_KEY = 'DEVICE_CODE';
const DEVICE_NAME_KEY = 'DEVICE_NAME';

const generateCode = () => {
  const epochSeconds = Math.floor(Date.now() / 1000);
  const encoded = base64.encode(epochSeconds.toString());
  return encoded.replace(/=/g, '').slice(-8);
};

const getDeviceName = async () => {
  try {
    return await DeviceInfo.getDeviceName();
  } catch {
    return 'Unknown';
  }
};

export const getDeviceCode = async () => {
  const deviceName = await getDeviceName();
  const savedName = await AsyncStorage.getItem(DEVICE_NAME_KEY);

  if (savedName && savedName !== deviceName) {
    await AsyncStorage.multiRemove([STORAGE_KEY, DEVICE_NAME_KEY]);
  }

  const savedCode = await AsyncStorage.getItem(STORAGE_KEY);

  if (savedCode) {
    return { deviceCode: savedCode, deviceName };
  }

  const newCode = generateCode();
  await AsyncStorage.setItem(STORAGE_KEY, newCode);
  await AsyncStorage.setItem(DEVICE_NAME_KEY, deviceName);

  return { deviceCode: newCode, deviceName };
};

export const resetDeviceCode = async storeNumber => {
  const code = await AsyncStorage.getItem(STORAGE_KEY);
  await AsyncStorage.multiRemove([STORAGE_KEY, DEVICE_NAME_KEY]);

  if (storeNumber && code) {
    await deleteDevice(storeNumber, code);
  }
};

export const ensureDeviceCodeInDatabase = async (
  storeNumber,
  deviceCodeArg = null,
  deviceNameArg = null,
) => {
  const local =
    deviceCodeArg && deviceNameArg
      ? { deviceCode: deviceCodeArg, deviceName: deviceNameArg }
      : await getDeviceCode();
  const { deviceCode, deviceName } = local;

  const device = await getDevice(storeNumber, deviceCode);

  if (device) {
    return device;
  }

  const storeSettings = await getStoreSettings(storeNumber);

  const created = await upsertDevice(storeNumber, deviceCode, {
    device_name: deviceName,
    status: 'wait',
    data: {
      banner: storeSettings?.default_banners || null,
      status: storeSettings?.default_status || null,
    },
    created_at: new Date().toISOString(),
  });

  return created;
};

export const subscribeDeviceDeletion = (
  storeNumber,
  deviceCode = null,
  onDelete,
) => {
  if (typeof deviceCode === 'function') {
    onDelete = deviceCode;
    deviceCode = null;
  }

  const channelName = deviceCode
    ? `device-delete-${storeNumber}-${deviceCode}`
    : `device-delete-${storeNumber}`;

  const filterParts = [`store_number=eq.${storeNumber}`];
  if (deviceCode) filterParts.push(`device_code=eq.${deviceCode}`);
  const filter = filterParts.join(',');

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'devices',
        filter,
      },
      payload => {
        try {
          onDelete(payload, { filtered: !!deviceCode });
        } catch (e) {
          Alert.alert('디바이스 삭제 핸들러 오류', e.message || e.toString());
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const useDeviceCode = storeNumber => {
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    if (!storeNumber) return;

    let cancelled = false;

    const init = async () => {
      const local = await getDeviceCode();
      if (cancelled) return;

      setDeviceCode(local.deviceCode);
      setDeviceName(local.deviceName);

      await ensureDeviceCodeInDatabase(storeNumber);
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [storeNumber]);

  return { deviceCode, deviceName };
};
