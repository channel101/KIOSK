import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'react-native';
import { Text } from '@rneui/themed';
import {
  getMenu,
  subscribeToMenu,
  getCategories,
} from '../../lib/supabase-realtime';
import { useCart } from '../../contexts/CartContext';
import Toast from 'react-native-toast-message';
import CartFooter from '../../components/CartFooter';
import { useStore } from '../../contexts/StoreContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const normalizeItem = (item, category) => ({
  menuKey: item.key,
  category,
  name: item.name,
  price: item.price,
  image: item.image ?? null,
  max: item.max ?? 1,
  min: item.min ?? 1,
  options: item.option ?? [],
});

const normalizeList = value =>
  Array.isArray(value) ? value : Object.values(value || {});

const Main = ({ navigation }) => {
  const { storeNumber } = useStore();
  const { getItemCount } = useCart();

  const [categories, setCategories] = useState(['ALL']);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const [menuMap, setMenuMap] = useState({});

  useEffect(() => {
    if (!storeNumber) return;

    let unsubscribe;

    const loadMenu = async () => {
      try {
        const categories = await getCategories(storeNumber);
        const categoryNames = categories.map(c => c.name).filter(Boolean);
        setCategories(['ALL', ...categoryNames]);

        const menuItems = await getMenu(storeNumber);
        const newMenuMap = {};

        menuItems.forEach(item => {
          if (!item || item.status === false || !item.menu_key) return;

          if (item.image) {
            Image.prefetch(item.image);
          }

          newMenuMap[item.menu_key] = {
            menuKey: item.menu_key,
            category: item.category,
            name: item.name,
            price: item.price,
            image: item.image || null,
            max: item.max || 1,
            min: item.min || 1,
            options: item.options || [],
          };
        });

        setMenuMap(newMenuMap);

        unsubscribe = subscribeToMenu(storeNumber, payload => {
          if (payload.table === 'menu_categories') {
            loadCategories();
          } else if (payload.table === 'menus') {
            handleMenuChange(payload);
          }
        });
      } catch (error) {
        console.error('Menu load error:', error);
      }
    };

    const loadCategories = async () => {
      const categories = await getCategories(storeNumber);
      const categoryNames = categories.map(c => c.name).filter(Boolean);
      setCategories(['ALL', ...categoryNames]);
    };

    const handleMenuChange = payload => {
      const { eventType, new: newData, old: oldData } = payload;

      if (eventType === 'DELETE' && oldData) {
        setMenuMap(prev => {
          const next = { ...prev };
          delete next[oldData.menu_key];
          return next;
        });
      } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
        if (!newData || newData.status === false) {
          setMenuMap(prev => {
            const next = { ...prev };
            delete next[newData.menu_key];
            return next;
          });
        } else {
          if (newData.image) {
            Image.prefetch(newData.image);
          }

          setMenuMap(prev => ({
            ...prev,
            [newData.menu_key]: {
              menuKey: newData.menu_key,
              category: newData.category,
              name: newData.name,
              price: newData.price,
              image: newData.image || null,
              max: newData.max || 1,
              min: newData.min || 1,
              options: newData.options || [],
            },
          }));
        }
      }
    };

    loadMenu();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [storeNumber]);

  const menuItems = useMemo(() => Object.values(menuMap), [menuMap]);

  const filteredMenu = useMemo(() => {
    if (selectedCategory === 'ALL') return menuItems;
    return menuItems.filter(i => i.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  const openOptions = item => {
    const already = getItemCount(item.menuKey);

    if (already >= item.max) {
      Toast.show({
        type: 'error',
        text1: '수량 제한',
        text2: '해당 메뉴는 더 이상 담을 수 없습니다.',
      });
      return;
    }

    navigation.navigate('Options', {
      ...item,
      remain: item.max - already,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#2c2c2c' }}>
      <View style={styles.container}>
        {}
        <View style={styles.sidebar}>
          {categories.map(cat => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryButton, active && styles.activeCategory]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.activeCategoryText,
                  ]}
                >
                  {cat.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {}
        <View style={styles.mainArea}>
          <ScrollView style={styles.content}>
            {filteredMenu.map(item => (
              <TouchableOpacity
                key={item.menuKey}
                style={styles.menuItem}
                onPress={() => openOptions(item)}
              >
                {item.image && (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.price}>{item.price}원</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <CartFooter />
    </SafeAreaView>
  );
};

export default Main;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },

  sidebar: {
    width: 90,
    backgroundColor: '#2c2c2c',
    paddingVertical: 10,
  },

  categoryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },

  activeCategory: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 6,
  },

  categoryText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: 'bold',
  },

  activeCategoryText: {
    color: '#000',
  },

  mainArea: {
    flex: 1,
    backgroundColor: '#fff',
  },

  content: {
    padding: 12,
    paddingBottom: 100,
  },

  menuItem: {
    flexDirection: 'row',
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
  },

  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#eee',
  },

  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  price: {
    fontSize: 14,
    color: '#444',
  },
});
