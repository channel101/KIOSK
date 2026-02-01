import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  getAdminInfo,
  getStoreSettings,
  getDevice,
  subscribeToDevice,
} from '../lib/supabase-realtime';
import { getDeviceCode, ensureDeviceCodeInDatabase } from './deviceCode';
import { useStore } from '../contexts/StoreContext';
import { StackActions } from '@react-navigation/native';
import { NativeModules, Platform } from 'react-native';

const { KioskModule } = NativeModules;

export const useAuth = navigationRef => {
  const { setStoreNumber } = useStore();

  const lastStatusRef = useRef(null);
  const lastContentRef = useRef(null);
  const storeNumberRef = useRef(null);

  const isSettingUpRef = useRef(false);
  const reRegisteringRef = useRef(false);

  const unsubscribeDeviceRef = useRef(null);
  const unsubscribeDeleteRef = useRef(null);

  const [currentBanner, setCurrentBanner] = useState(null);

  useEffect(() => {
    let mounted = true;

    const navigateOnce = (name, params = {}) => {
      if (!navigationRef.isReady()) return;

      const state = navigationRef.getRootState();
      let route = state.routes[state.index];
      while (route.state) {
        route = route.state.routes[route.state.index];
      }

      const same =
        route.name === name &&
        JSON.stringify(route.params ?? {}) === JSON.stringify(params);

      if (!same) {
        navigationRef.dispatch(StackActions.replace(name, params));
      }
    };

    const cleanup = () => {
      lastStatusRef.current = null;
      lastContentRef.current = null;

      unsubscribeDeviceRef.current?.();
      unsubscribeDeleteRef.current?.();

      unsubscribeDeviceRef.current = null;
      unsubscribeDeleteRef.current = null;
    };

    const handleDevice = async device => {
      if (!mounted) return;

      if (!device) {
        if (reRegisteringRef.current) return;

        const storeNumber = storeNumberRef.current;
        if (!storeNumber) {
          return;
        }

        reRegisteringRef.current = true;
        const { deviceCode, deviceName } = await getDeviceCode();
        await ensureDeviceCodeInDatabase(storeNumber, deviceCode, deviceName);
        lastStatusRef.current = null;
        lastContentRef.current = null;

        setTimeout(() => {
          reRegisteringRef.current = false;
        }, 1500);

        return;
      }
      const status = device.status;
      const banner = device.data?.status?.banner ?? null;
      const reason = device.data?.status?.reason ?? null;
      const img = device.data?.status?.img ?? null;

      const same =
        lastStatusRef.current === status &&
        JSON.stringify(lastContentRef.current) ===
          JSON.stringify({ banner, reason, img });

      if (same) return;

      lastStatusRef.current = status;
      lastContentRef.current = { banner, reason, img };

      setCurrentBanner(banner);

      if (status === 'blocked') {
        navigateOnce('Wait', {
          code: 'blocked',
          img,
          reason: reason ?? '차단된 기기입니다.',
        });
        return;
      }

      if (status === 'wait') {
        navigateOnce('Wait', {
          code: 'wait',
          img,
          reason,
        });
        return;
      }

      if (status === 'ready') {
        navigateOnce('Front');

        if (Platform.OS === 'android' && KioskModule) {
          KioskModule.enableKiosk();
        }
      }
    };

    const setupAuth = async () => {
      if (isSettingUpRef.current) return;
      isSettingUpRef.current = true;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;
        if (!user) {
          cleanup();
          setStoreNumber(null);
          navigateOnce('Login');
          return;
        }

        const admin = await getAdminInfo(user.id);
        if (!admin?.access?.kiosk) {
          navigateOnce('Error', {
            code: 403,
            message: 'KIOSK 접근 권한 없음',
          });
          return;
        }

        const storeNumber = admin.store;
        setStoreNumber(storeNumber);
        storeNumberRef.current = storeNumber;

        const store = await getStoreSettings(storeNumber);
        if (store.email !== user.email) {
          navigateOnce('Error', {
            code: 400,
            message: '스토어 설정 오류',
          });
          return;
        }

        const { deviceCode, deviceName } = await getDeviceCode();
        await ensureDeviceCodeInDatabase(storeNumber, deviceCode, deviceName);
        const device = await getDevice(storeNumber, deviceCode);
        await handleDevice(device);

        unsubscribeDeviceRef.current = subscribeToDevice(
          storeNumber,
          deviceCode,
          handleDevice,
        );

        const deleteChannel = supabase
          .channel(`devices-delete-${storeNumber}`)
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'devices',
            },
            async () => {
              const latest = await getDevice(storeNumber, deviceCode);
              if (!latest) {
                handleDevice(null);
              }
            },
          )
          .subscribe();

        unsubscribeDeleteRef.current = () => {
          supabase.removeChannel(deleteChannel);
        };
      } catch (e) {
        navigateOnce('Error', {
          code: 500,
          message: e.message ?? '알 수 없는 오류',
        });
      } finally {
        isSettingUpRef.current = false;
      }
    };

    setupAuth();

    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        cleanup();
        setStoreNumber(null);
        navigateOnce('Login');
      }

      if (event === 'SIGNED_IN') {
        setupAuth();
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
      cleanup();
    };
  }, [navigationRef, setStoreNumber]);

  return { currentBanner };
};
