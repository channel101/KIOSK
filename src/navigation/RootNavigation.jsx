import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../screens/auth/Login';
import Home from '../screens/Home';
import Error from '../screens/auth/Error';
import Wait from '../screens/auth/Wait';
import Front from '../screens/main/Front';
import Main from '../screens/main/Main';
import Options from '../screens/main/Options';
import OrderView from '../screens/order/OrderView';
import OrderComplete from '../screens/order/OrderComplete';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerBackVisible: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Error" component={Error} />
      <Stack.Screen name="Wait" component={Wait} />
      <Stack.Screen name="Front" component={Front} />
      <Stack.Screen name="Main" component={Main} />
      <Stack.Screen name="Options" component={Options} />
      <Stack.Screen name="OrderView" component={OrderView} />
      <Stack.Screen name="OrderComplete" component={OrderComplete} />
    </Stack.Navigator>
  );
}
