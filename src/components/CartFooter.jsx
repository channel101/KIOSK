import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@rneui/themed';
import { useCart } from '../contexts/CartContext';
import { useNavigation } from '@react-navigation/native';
import FontAwesome from '@react-native-vector-icons/fontawesome';

const CartFooter = () => {
  const navigation = useNavigation();
  const { cart, clearCart } = useCart();

  const orderViewOpen = () => navigation.navigate('OrderView');
  const totalCount = cart.reduce((sum, i) => sum + i.count, 0);

  const totalPrice = cart.reduce((sum, i) => sum + i.totalPrice, 0);

  const cancelOrder = () => {
    if (cart.length === 0) {
      clearCart();
      navigation.navigate('Front');
      return;
    } else {
      Alert.alert('경고', '홈으로 가시겠습니까? 현재 장바구니가 비워집니다.', [
        { text: '취소', style: 'cancel' },
        {
          text: '홈으로',
          style: 'destructive',
          onPress: () => {
            clearCart();
            navigation.navigate('Front');
          },
        },
      ]);
    }
  };

  return (
    <View style={styles.footer}>
      <View>
        <Text style={styles.count}>{totalCount}개 선택됨</Text>
        <Text style={styles.price}>{totalPrice.toLocaleString()}원</Text>
      </View>

      <View style={styles.btnGroup}>
        <TouchableOpacity
          style={[styles.btn, styles.goBackBtn]}
          onPress={cancelOrder}
        >
          <FontAwesome
            name="home"
            color="black"
            size={18}
            style={styles.blackBtnText}
          />
        </TouchableOpacity>

        {cart.length !== 0 && (
          <>
            {}

            <TouchableOpacity
              style={[styles.btn, styles.orderBtn]}
              onPress={orderViewOpen}
            >
              <FontAwesome
                name="shopping-cart"
                color="white"
                size={18}
                style={styles.blackBtnText}
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

export default CartFooter;

const styles = StyleSheet.create({
  footer: {
    height: 90,
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  count: {
    fontSize: 14,
    color: '#666',
  },

  price: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  btnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'flex-end',
  },

  btn: {
    minWidth: 80,
    flexGrow: 0,
    flexShrink: 0,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 0,
    marginRight: 0,
  },

  clearBtn: {
    backgroundColor: '#bbb',
    paddingHorizontal: 20,
  },

  goBackBtn: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
  },

  blackBtnText: {
    fontWeight: 'bold',
  },

  orderBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 26,
  },

  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
