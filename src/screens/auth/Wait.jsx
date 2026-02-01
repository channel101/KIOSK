import React, { useState, useEffect } from 'react';
import { View, Image, Dimensions, StyleSheet } from 'react-native';
import { Button, Text, Card } from '@rneui/themed';
import { useRoute } from '@react-navigation/native';

import { useDeviceCode } from '../../hooks/deviceCode';
import { signOutUser } from '../../services/auth';
import { useStore } from '../../contexts/StoreContext';

export default function WaitScreen({ navigation }) {
  const route = useRoute();
  const { storeNumber } = useStore();

  const { deviceCode, deviceName } = useDeviceCode(storeNumber);
  const { width, height } = Dimensions.get('window');

  const IMAGE_MAX_WIDTH = width - 60;
  const IMAGE_MAX_HEIGHT = height * 0.35;

  const code = route?.params?.code ?? '';

  const [realtimeReason, setRealtimeReason] = useState(
    route?.params?.reason ?? '',
  );

  useEffect(() => {
    setRealtimeReason(route?.params?.reason ?? '');
  }, [route?.params?.reason]);

  const img = route?.params?.img ?? '';

  if (code === 'wait') {
    return (
      <View style={styles.container}>
        <Card containerStyle={styles.card}>
          <Text h4 style={styles.title}>
            대기 중인 디바이스
          </Text>

          <Text style={styles.info}>
            디바이스 코드: <Text style={styles.bold}>{deviceCode}</Text>
          </Text>
          <Text style={styles.info}>
            디바이스 이름: <Text style={styles.bold}>{deviceName}</Text>
          </Text>

          <Text style={styles.description}>
            이 기기는 현재 대기 상태입니다.
            {'\n'}관리자 승인 후 사용이 가능합니다.
          </Text>

          <Button
            title="로그아웃"
            radius="md"
            size="lg"
            containerStyle={{ marginTop: 20 }}
            onPress={async () => {
              await signOutUser();
            }}
          />
        </Card>
      </View>
    );
  }

  if (code === 'blocked') {
    return (
      <View style={styles.container}>
        <Card containerStyle={styles.card}>
          {img ? (
            <Image
              source={{ uri: img }}
              style={{
                width: IMAGE_MAX_WIDTH,
                maxHeight: IMAGE_MAX_HEIGHT,
                aspectRatio: 1,
                resizeMode: 'contain',
                alignSelf: 'center',
              }}
            />
          ) : null}

          <Text
            h2
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            style={styles.blockedText}
          >
            {realtimeReason || '이 기기는 차단된 상태입니다.'}
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card containerStyle={styles.card}>
        <Text h4 style={styles.title}>
          잘못된 접근입니다
        </Text>

        <Button
          title="로그아웃"
          radius="md"
          size="lg"
          containerStyle={{ marginTop: 20 }}
          onPress={async () => {
            await signOutUser();
            navigation.replace('Home');
          }}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 30,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 6,
  },
  bold: {
    fontWeight: 'bold',
  },
  description: {
    marginTop: 20,
    fontSize: 15,
    textAlign: 'center',
    color: 'gray',
  },
  blockedText: {
    marginTop: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
