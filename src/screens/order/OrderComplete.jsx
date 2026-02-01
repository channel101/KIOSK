import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@rneui/themed';
import { createOrder, getNextOrderNumber } from '../../lib/supabase-realtime';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import Toast from 'react-native-toast-message';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const COUNTDOWN_SEC = 5;

const OrderComplete = ({ navigation }) => {
  const [rawPhone, setRawPhone] = useState('010');
  const [loading, setLoading] = useState(false);
  const [savedOrderNumber, setSavedOrderNumber] = useState(null);

  const [successVisible, setSuccessVisible] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SEC);

  const { cart, clearCart } = useCart();
  const { storeNumber } = useStore();
  const { height: screenH } = useWindowDimensions();

  const [contentH, setContentH] = useState(0);
  const [footerH, setFooterH] = useState(0);

  const needScroll = contentH > screenH - footerH;

  const formatPhone = value => {
    if (!value) return '';
    if (value.length <= 3) return '010-';
    if (value.length <= 7) return `${value.slice(0, 3)}-${value.slice(3)}`;
    return `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
  };

  const addNumber = num => {
    if (loading || rawPhone.length >= 11) return;
    setRawPhone(prev => prev + num);
  };

  const removeNumber = () => {
    if (loading || rawPhone.length <= 3) return;
    setRawPhone(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (!successVisible) return;

    setCountdown(COUNTDOWN_SEC);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          closeSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [successVisible]);

  const closeSuccess = () => {
    setSuccessVisible(false);
    navigation.navigate('Front');
  };

  const sendOrder = async () => {
    if (rawPhone.length < 11) {
      Toast.show({
        type: 'error',
        text1: '오류',
        text2: '전화번호를 끝까지 입력해주세요.',
      });
      return;
    }

    try {
      setLoading(true);
      setErrorVisible(false);

      const orderNumber = await getNextOrderNumber(storeNumber);

      const orderData = {
        order_number: orderNumber,
        phone_number: rawPhone,
        status: 'new',
        total_price: cart.reduce((s, i) => s + i.totalPrice, 0),
        menu: cart.map(item => ({
          id: item.menuKey,
          quantity: item.count,
          price: item.totalPrice,
          name: item.name,
          options: item.options.map(opt => ({
            name: opt.name,
            choice:
              Array.isArray(opt.options) &&
              typeof opt.value === 'number' &&
              opt.options[opt.value] !== undefined
                ? opt.options[opt.value]
                : opt.value,
            price: opt.price,
          })),
        })),
      };

      await createOrder(storeNumber, orderData);

      setSavedOrderNumber(orderNumber);
      clearCart();
      setSuccessVisible(true);
    } catch (e) {
      setErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View style={styles.safe} edges={['top']}>
        <View style={styles.container}>
          <ScrollView
            style={{ flex: 1 }}
            scrollEnabled={needScroll}
            contentContainerStyle={{
              paddingBottom: footerH + 8,
              paddingHorizontal: 16,
            }}
            onContentSizeChange={(_, h) => setContentH(h)}
          >
            <Text h4 style={styles.title}>
              전화번호 입력
            </Text>

            <View style={styles.display}>
              <Text h3>{formatPhone(rawPhone)}</Text>
            </View>

            <View style={styles.keypad}>
              {KEYS.map(key => (
                <TouchableOpacity
                  key={key}
                  style={styles.key}
                  onPress={() => addNumber(key)}
                  disabled={loading}
                >
                  <Text h3>{key}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.key, styles.delete]}
                onPress={removeNumber}
                disabled={loading}
              >
                <Text h4>⌫</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {}
          <View
            style={styles.footer}
            onLayout={e => setFooterH(e.nativeEvent.layout.height)}
          >
            <TouchableOpacity
              style={[styles.orderBtn, styles.leftBtn]}
              onPress={() => navigation.navigate('Main')}
              disabled={loading}
            >
              <Text style={styles.orderText}>취소</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.orderBtn,
                styles.rightBtn,
                { opacity: loading ? 0.6 : 1 },
              ]}
              onPress={sendOrder}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.orderText}>주문 전송</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {}
      <Modal
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        visible={successVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text h4>주문 완료</Text>
            <Text style={{ marginTop: 10 }}>주문 번호</Text>
            <Text style={{ marginTop: 6 }}>{formatPhone(rawPhone)}</Text>
            <Text style={{ marginTop: 6 }}>으로 접수 되었습니다.</Text>
            <Text style={{ marginTop: 8 }}>
              {countdown}초 후 자동으로 닫힙니다
            </Text>

            <TouchableOpacity style={styles.confirmBtn} onPress={closeSuccess}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {}
      <Modal
        animationType="fade"
        transparent
        presentationStyle="overFullScreen"
        statusBarTranslucent
        visible={errorVisible}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text h4>전송 실패</Text>
            <Text style={{ marginVertical: 16 }}>
              네트워크 오류가 발생했습니다.
            </Text>

            <TouchableOpacity style={styles.retryBtn} onPress={sendOrder}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>재시도</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setErrorVisible(false)}
            >
              <Text>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default OrderComplete;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 16 },

  title: { textAlign: 'center', marginBottom: 20 },

  display: {
    height: 70,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  key: {
    width: '30%',
    height: 70,
    backgroundColor: '#eee',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  delete: { backgroundColor: '#f5c6cb' },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 12,
    paddingBottom: 10,
  },

  orderBtn: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    marginHorizontal: 6,
  },

  leftBtn: { backgroundColor: 'green' },
  rightBtn: { backgroundColor: 'black' },
  orderText: { color: '#fff', fontWeight: 'bold' },

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

  confirmBtn: {
    marginTop: 20,
    backgroundColor: '#000',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
  },

  retryBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
  },

  cancelBtn: { marginTop: 12 },
});
