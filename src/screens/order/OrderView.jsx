import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { Text } from '@rneui/themed';
import { useCart } from '../../contexts/CartContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const OrderView = ({ navigation }) => {
  const { cart, clearCart, removeItem, increaseCount, decreaseCount } =
    useCart();

    const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const handleOrder = () => {
    navigation.navigate('OrderComplete');
  };

  const handleRemove = index => {
    Alert.alert('삭제', '이 항목을 장바구니에서 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => removeItem(index),
      },
    ]);
  };

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        {}
        <View style={styles.header}>
          <Text style={styles.title}>주문 내역</Text>
        </View>

        {}
        <ScrollView contentContainerStyle={styles.list}>
          {cart.map(item => (
            <View key={item.cartId} style={styles.card}>
              <View style={styles.row}>
                <View>
                  <Text style={styles.name}>{item.name}</Text>

                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => decreaseCount(item.cartId)}
                    >
                      <Text style={styles.qtyText}>−</Text>
                    </TouchableOpacity>

                    <Text style={styles.qty}>{item.count}</Text>

                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => {
                        if (item.count >= (item.max ?? 99)) {
                          Toast.show({
                            type: 'error',
                            text1: '알림',
                            text2: `해당 상품은 최대 ${
                              item.max ?? 99
                            }개까지 주문할 수 있습니다.`,
                            visibilityTime: 3000,
                          });
                          return;
                        }
                        increaseCount(item.cartId);
                      }}
                    >
                      <Text style={styles.qtyText}>＋</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity onPress={() => handleRemove(item.cartId)}>
                  <Text style={styles.remove}>✕</Text>
                </TouchableOpacity>
              </View>

              {item.options.map(opt => (
                <Text key={opt.key} style={styles.option}>
                  · {opt.name} : {opt.options?.[opt.value] ?? opt.value}
                </Text>
              ))}

              <Text style={styles.price}>
                {item.totalPrice.toLocaleString()}원
              </Text>
            </View>
          ))}

          {cart.length === 0 && (
            <Text style={styles.empty}>장바구니가 비어있습니다.</Text>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.total}>총 {totalPrice.toLocaleString()}원</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.orderBtn, styles.leftBtn]}
              onPress={() => navigation.navigate('Main')}
            >
              <Text style={styles.orderText}>매뉴 추가 주문</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.orderBtn,
                styles.rightBtn,
                cart.length === 0 && styles.disabled,
              ]}
              disabled={cart.length === 0}
              onPress={handleOrder}
            >
              <Text style={styles.orderText}>주문하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default OrderView;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },

  container: {
    flex: 1,
  },

  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  list: {
    padding: 16,
    paddingBottom: 140,
  },

  card: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  count: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
  },

  remove: {
    fontSize: 18,
    color: '#999',
    paddingHorizontal: 6,
  },

  option: {
    marginTop: 4,
    fontSize: 13,
    color: '#555',
  },

  price: {
    marginTop: 8,
    fontWeight: 'bold',
    textAlign: 'right',
  },

  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 60,
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },

  total: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },

  orderBtn: {
    includeFontPadding: false,
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 10,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabled: {
    backgroundColor: '#aaa',
  },

  orderText: {
    includeFontPadding: false,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    justifyContent: 'center',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  leftBtn: { flex: 0.6, backgroundColor: 'green' },
  rightBtn: { flex: 1.4, backgroundColor: 'black' },

  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },

  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  qty: {
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
