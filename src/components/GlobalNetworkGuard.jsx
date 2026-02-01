import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useNetworkStatus } from 'react-native-network-status';
import { View } from 'react-native';

export default function GlobalNetworkGuard() {
  const { isConnected } = useNetworkStatus();
  const [hasInternet, setHasInternet] = useState(true);

  const alertVisible = useRef(false);
  const disconnectTimer = useRef(null);

  useEffect(() => {
    if (!isConnected) {
      if (!disconnectTimer.current) {
        disconnectTimer.current = setTimeout(() => {
          setHasInternet(false);
          disconnectTimer.current = null;
        }, 3000);
      }
    } else {
      if (disconnectTimer.current) {
        clearTimeout(disconnectTimer.current);
        disconnectTimer.current = null;
      }
      setHasInternet(true);
    }

    return () => {
      if (disconnectTimer.current) clearTimeout(disconnectTimer.current);
    };
  }, [isConnected]);

  useEffect(() => {
    if (hasInternet || alertVisible.current) return;

    alertVisible.current = true;

    const showAlert = () => {
      Alert.alert(
        '인터넷 연결 필요',
        '인터넷에 연결되어야 앱을 사용할 수 있습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              alertVisible.current = false;

              setTimeout(() => {
                if (!hasInternet && !alertVisible.current) {
                  showAlert();
                }
              }, 500);
            },
          },
        ],
        { cancelable: false },
      );
    };

    showAlert();
  }, [hasInternet]);

  return <View />;
}
