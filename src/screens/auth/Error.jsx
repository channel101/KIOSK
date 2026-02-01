import { View, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Button, Text, Card } from '@rneui/themed';
import { signOutUser } from '../../services/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ErrorScreen({ navigation }) {
  const route = useRoute();
  const code = route?.params?.code ?? '';
  const message = route?.params?.message ?? '';

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <Card containerStyle={{ width: '100%', maxWidth: 400, borderRadius: 10 }}>
        <View style={{ alignItems: 'center' }}>
          <Image
            source={require('../../../assets/login/warning.png')}
            style={{ width: 120, height: 120 }}
            resizeMode="contain"
          />

          <Text
            style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}
          >
            {code} - {message}
          </Text>

          <Button
            title="로그아웃"
            buttonStyle={{
              borderRadius: 10,
              height: 50,
            }}
            containerStyle={{ width: '100%' }}
            onPress={async () => {
              await signOutUser();
            }}
          />
        </View>
      </Card>
    </SafeAreaView>
  );
}
