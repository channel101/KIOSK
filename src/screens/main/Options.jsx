import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@rneui/themed';
import { useCart } from '../../contexts/CartContext';

const Options = ({ route, navigation }) => {
  const {
    name,
    price,
    menuKey,
    max,
    min,
    options = [],
    remain = max,
  } = route.params;

  const { addToCart } = useCart();

    const [count, setCount] = useState(1);

    const [selectedOptions, setSelectedOptions] = useState(() => {
    const result = {};
    options.forEach(opt => {
      result[opt.key] =
        opt.type === 'range' ? opt.default ?? opt.min ?? 0 : opt.default ?? 0;
    });
    return result;
  });

    const updateOption = (key, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };

    const optionPrice = useMemo(() => {
    let sum = 0;
    options.forEach(opt => {
      if (opt.type === 'range') {
        sum += (selectedOptions[opt.key] || 0) * Number(opt.price || 0);
      }
    });
    return sum;
  }, [selectedOptions, options]);

  const totalPrice = (Number(price) + optionPrice) * count;

    const handleAdd = () => {
    const normalizedOptions = options.map(opt => ({
      key: opt.key,
      name: opt.name,
      options: opt.options,
      type: opt.type,
      value: selectedOptions[opt.key],
      price:
        opt.type === 'range'
          ? (selectedOptions[opt.key] || 0) * Number(opt.price || 0)
          : 0,
    }));

    const optionsSignature = normalizedOptions
      .map(o => `${o.key}:${o.value}`)
      .sort()
      .join('|');

    addToCart({
      menuKey,
      name,
      min,
      max,
      basePrice: Number(price),
      count,
      options: normalizedOptions,
      optionsSignature,
    });

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.basePrice}>기본가 {price}원</Text>
        </View>

        {options.map(opt => (
          <View key={opt.key} style={styles.optionBox}>
            <Text style={styles.optionTitle}>{opt.name}</Text>

            {opt.type === 'radio' && (
              <View style={styles.row}>
                {opt.options.map((v, idx) => {
                  const active = selectedOptions[opt.key] === idx;
                  return (
                    <TouchableOpacity
                      key={v}
                      style={[styles.radioBtn, active && styles.radioActive]}
                      onPress={() => updateOption(opt.key, idx)}
                    >
                      <Text
                        style={[
                          styles.radioText,
                          active && styles.radioTextActive,
                        ]}
                      >
                        {v.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {opt.type === 'range' && (
              <View style={styles.rangeRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() =>
                    updateOption(
                      opt.key,
                      Math.max(opt.min ?? 0, selectedOptions[opt.key] - 1),
                    )
                  }
                >
                  <Text>-</Text>
                </TouchableOpacity>

                <Text style={styles.countText}>{selectedOptions[opt.key]}</Text>

                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() =>
                    updateOption(
                      opt.key,
                      Math.min(opt.max ?? 0, selectedOptions[opt.key] + 1),
                    )
                  }
                >
                  <Text>+</Text>
                </TouchableOpacity>

                <Text style={styles.subPrice}>(+{opt.price}원)</Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.optionBox}>
          <Text style={styles.optionTitle}>수량</Text>
          <View style={styles.rangeRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setCount(Math.max(min, count - 1))}
            >
              <Text>-</Text>
            </TouchableOpacity>

            <Text style={styles.countText}>{count}</Text>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setCount(Math.min(remain, count + 1))}
            >
              <Text>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.total}>총 {totalPrice.toLocaleString()}원</Text>

        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={[styles.bottomBtn, { backgroundColor: '#777' }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.btnText}>취소</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomBtn} onPress={handleAdd}>
            <Text style={styles.btnText}>담기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Options;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  basePrice: { marginTop: 4, color: '#666' },

  optionBox: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  row: { flexDirection: 'row' },

  radioBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    marginRight: 8,
  },

  radioActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },

  radioText: { color: '#333' },
  radioTextActive: { color: '#fff' },

  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stepBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },

  countText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: 'bold',
  },

  subPrice: {
    marginLeft: 8,
    color: '#666',
  },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  total: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  bottomBtn: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },

  btnGroup: {
    flexDirection: 'row',
    gap: 10,
  },

  rmBtn: {
    backgroundColor: '#f00',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },

  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
