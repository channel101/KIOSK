import {
  StyleSheet,
  View,
  useWindowDimensions,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Button, Text, Input } from '@rneui/themed';
import { supabase } from '../../lib/supabase';
import { getDevice } from '../../lib/supabase-realtime';
import Carousel from '../../components/Carousel';
import { getDeviceCode, resetDeviceCode } from '../../hooks/deviceCode';
import { useStore } from '../../contexts/StoreContext';
import { useAuth } from '../../hooks/useAuth';
import { navigationRef } from '../../../App';

const TITLE_HEIGHT = 68;

const Front = ({ navigation }) => {
  const { storeNumber } = useStore();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const { currentBanner } = useAuth(navigationRef);

  const [bannerImages, setBannerImages] = useState([]);
  const titleLastPress = useRef(0);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [inputStoreNumber, setInputStoreNumber] = useState('');

  const REMAINS_HEIGHT = SCREEN_HEIGHT - TITLE_HEIGHT;
  const CAROUSEL_HEIGHT = (REMAINS_HEIGHT * 2) / 3;
  const BUTTON_AREA_HEIGHT = REMAINS_HEIGHT / 3;

  useEffect(() => {
    if (currentBanner) {
      let urls = [];
      if (typeof currentBanner === 'object' && !Array.isArray(currentBanner)) {
        urls = Object.values(currentBanner).filter(Boolean);
      } else if (Array.isArray(currentBanner)) {
        urls = currentBanner.filter(Boolean);
      }
      setBannerImages(urls.map(url => ({ uri: url })));
    } else {
      setBannerImages([]);
    }
  }, [currentBanner]);

  useEffect(() => {
    let channel;

    const subscribe = async () => {
      try {
        const { deviceCode } = await getDeviceCode();
        if (!storeNumber) return;

        const deviceData = await getDevice(storeNumber, deviceCode);
        if (deviceData?.data?.banner) {
          let urls = [];
          const banner = deviceData.data.banner;
          if (banner && typeof banner === 'object' && !Array.isArray(banner)) {
            urls = Object.values(banner).filter(Boolean);
          } else if (Array.isArray(banner)) {
            urls = banner.filter(Boolean);
          }
          setBannerImages(urls.map(url => ({ uri: url })));
        }

        channel = supabase
          .channel(`device-banner:${storeNumber}:${deviceCode}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'devices',
              filter: `store_number=eq.${storeNumber}`,
            },
            payload => {
              if (payload.new?.device_code !== deviceCode) return;

              const data = payload.new;
              if (!data?.data?.banner) {
                setBannerImages([]);
                return;
              }

              let urls = [];
              const banner = data.data.banner;
              if (
                banner &&
                typeof banner === 'object' &&
                !Array.isArray(banner)
              ) {
                urls = Object.values(banner).filter(Boolean);
              } else if (Array.isArray(banner)) {
                urls = banner.filter(Boolean);
              }
              setBannerImages(urls.map(url => ({ uri: url })));
            },
          )
          .subscribe();
      } catch (e) {
        setBannerImages([]);
      }
    };

    subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [storeNumber]);

  const handleTitlePress = () => {
    const now = Date.now();
    if (now - titleLastPress.current < 400) {
      setConfirmVisible(true);
    }
    titleLastPress.current = now;
  };

  const handleConfirmLogout = async () => {
    if (inputStoreNumber.trim() === String(storeNumber)) {
      try {
        setConfirmVisible(false);
        setInputStoreNumber('');
        await resetDeviceCode(storeNumber);
        const { signOutUser } = require('../../services/auth');
        await signOutUser();
      } catch (e) {
        Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
      }
    } else {
      Alert.alert('오류', '가게 번호가 일치하지 않습니다.');
    }
  };

  return (
    <>
      <View style={styles.container}>
        {}
        <TouchableOpacity
          style={styles.title}
          activeOpacity={0.7}
          onPress={handleTitlePress}
        >
          <Text style={styles.titleText}>TREE ORDER</Text>
        </TouchableOpacity>

        {}
        <View style={{ paddingHorizontal: 16, height: CAROUSEL_HEIGHT }}>
          {bannerImages.length > 0 && (
            <Carousel
              images={bannerImages}
              interval={4000}
              height={CAROUSEL_HEIGHT}
            />
          )}
        </View>

        {}
        <View style={{ height: BUTTON_AREA_HEIGHT }}>
          <Button
            title="주문 시작"
            onPress={() => navigation.navigate('Main')}
            containerStyle={styles.buttonContainer}
            titleStyle={styles.buttonTitle}
            buttonStyle={styles.buttonStyle}
          />
        </View>
      </View>

      {}
      <Modal
        visible={confirmVisible}
        presentationStyle="overFullScreen"
        transparent
        statusBarTranslucent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text h4>가게 번호 확인</Text>

            <Input
              placeholder="가게 번호 입력"
              value={inputStoreNumber}
              onChangeText={setInputStoreNumber}
              keyboardType="number-pad"
            />

            <View style={styles.modalButtons}>
              <Button
                title="취소"
                type="outline"
                onPress={() => {
                  setConfirmVisible(false);
                  setInputStoreNumber('');
                }}
              />
              <Button title="확인" onPress={handleConfirmLogout} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Front;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  title: {
    height: TITLE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 30,
    fontWeight: 'bold',
  },

  buttonContainer: {
    marginHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  buttonStyle: {
    height: '100%',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTitle: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
});
